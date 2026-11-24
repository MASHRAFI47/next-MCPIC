import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { withDbContext, writeAuditLog } from "./db";
import { getEnv } from "./env";
import { logger } from "./logger";
import { decryptSecret } from "./security/crypto";
import { checkRateLimit } from "./security/rate-limit";
import { matchRecoveryCode, verifyTotpCode } from "./security/totp";
import type { AppRole } from "@/types/next-auth";

interface DbUserRow {
  id: string;
  email: string;
  name: string;
  image_url: string;
  password_hash: string;
  role: AppRole;
  designation: string;
  email_verified_at: Date | null;
  mfa_enabled: boolean;
  mfa_secret_enc: string | null;
  mfa_recovery_hashes: string[];
  token_version: number;
}

const env = getEnv();

export const authOptions: NextAuthOptions = {
  secret: env.nextAuthSecret,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 hours (instead of 365 days)
    updateAge: 60 * 30, // refresh every 30 minutes
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: env.isProd ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.isProd,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Authenticator / Recovery Code", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email ?? "").trim().toLowerCase();
        const password = credentials?.password ?? "";
        const totpCode = (credentials?.totpCode ?? "").trim();

        if (!email || !password) {
          throw new Error("Invalid email or password");
        }

        const rl = checkRateLimit("auth", `login:${email}`);
        if (!rl.allowed) {
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        return withDbContext({ role: "system" }, async (client) => {
          const res = await client.query<DbUserRow>(
            `SELECT id, email, name, image_url, password_hash, role, designation,
                    email_verified_at, mfa_enabled, mfa_secret_enc, mfa_recovery_hashes, token_version
             FROM users
             WHERE email = $1
             LIMIT 1`,
            [email]
          );

          const user = res.rows[0];
          if (!user) {
            // Constant-time dummy comparison to reduce account enumeration timing differences
            await bcrypt.compare(
              password,
              "$2a$12$C6UzMDM.H6dfI/f/IKcEeO6F0w8m9k2O3f1F7K9q7f8F9v7e2M6e."
            );
            throw new Error("Invalid email or password");
          }

          const passwordValid = await bcrypt.compare(password, user.password_hash);
          if (!passwordValid) {
            logger.warn("Failed password login attempt", { userId: user.id });
            throw new Error("Invalid email or password");
          }

          // Multi-Factor Authentication enforcement (only checked after password succeeds)
          if (user.mfa_enabled) {
            if (!totpCode) {
              throw new Error("MFA_REQUIRED");
            }

            const mfaRl = checkRateLimit("mfa", `mfa:${user.id}`);
            if (!mfaRl.allowed) {
              throw new Error("TOO_MANY_ATTEMPTS");
            }

            let mfaPassed = false;
            if (user.mfa_secret_enc) {
              const secret = decryptSecret(user.mfa_secret_enc);
              if (verifyTotpCode(secret, totpCode)) {
                mfaPassed = true;
              }
            }

            if (!mfaPassed && user.mfa_recovery_hashes.length > 0) {
              const matchIdx = matchRecoveryCode(totpCode, user.mfa_recovery_hashes);
              if (matchIdx !== -1) {
                // Consume one-time recovery code immediately
                const remainingHashes = user.mfa_recovery_hashes.filter((_, i) => i !== matchIdx);
                await client.query(
                  "UPDATE users SET mfa_recovery_hashes = $1 WHERE id = $2",
                  [remainingHashes, user.id]
                );
                await writeAuditLog(client, {
                  actorId: user.id,
                  action: "auth.mfa_recovery_used",
                  resourceType: "user",
                  resourceId: user.id,
                });
                mfaPassed = true;
              }
            }

            if (!mfaPassed) {
              logger.warn("Failed MFA verification", { userId: user.id });
              throw new Error("INVALID_MFA_CODE");
            }
          }

          await writeAuditLog(client, {
            actorId: user.id,
            action: "auth.login",
            resourceType: "user",
            resourceId: user.id,
            metadata: { mfa: user.mfa_enabled },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image_url,
            role: user.role,
            designation: user.designation,
            emailVerified: Boolean(user.email_verified_at),
            mfaEnabled: user.mfa_enabled,
            tokenVersion: user.token_version,
          };
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;
        token.designation = user.designation;
        token.emailVerified = user.emailVerified;
        token.mfaEnabled = user.mfaEnabled;
        token.tokenVersion = user.tokenVersion;
        token.lastCheckedAt = Date.now();
        token.invalidated = false;
        return token;
      }

      // Throttle DB session revalidation to every 30s (or immediately on explicit update)
      // so page navigation stays fast while role/revocation changes take effect promptly.
      const shouldRevalidate =
        trigger === "update" ||
        !token.lastCheckedAt ||
        Date.now() - token.lastCheckedAt > 30_000;

      if (token.id && shouldRevalidate) {
        try {
          const fresh = await withDbContext({ role: "system" }, async (client) => {
            const res = await client.query<{
              name: string;
              image_url: string;
              role: AppRole;
              designation: string;
              email_verified_at: Date | null;
              mfa_enabled: boolean;
              token_version: number;
            }>(
              `SELECT name, image_url, role, designation, email_verified_at, mfa_enabled, token_version
               FROM users WHERE id = $1 LIMIT 1`,
              [token.id]
            );
            return res.rows[0] ?? null;
          });

          if (!fresh || fresh.token_version !== token.tokenVersion) {
            token.invalidated = true;
            return token;
          }

          token.name = fresh.name;
          token.image = fresh.image_url;
          token.role = fresh.role;
          token.designation = fresh.designation;
          token.emailVerified = Boolean(fresh.email_verified_at);
          token.mfaEnabled = fresh.mfa_enabled;
          token.lastCheckedAt = Date.now();
        } catch (err) {
          logger.error("Failed to refresh JWT session from DB", { error: err });
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.invalidated) {
        return { ...session, user: undefined as unknown as typeof session.user };
      }
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        image: token.image,
        role: token.role,
        designation: token.designation,
        emailVerified: token.emailVerified,
        mfaEnabled: token.mfaEnabled,
      };
      return session;
    },
  },
};
