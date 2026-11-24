import "next-auth";
import "next-auth/jwt";

export type AppRole = "member" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
      role: AppRole;
      designation: string;
      emailVerified: boolean;
      mfaEnabled: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image: string;
    role: AppRole;
    designation: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    tokenVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    image: string;
    role: AppRole;
    designation: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    tokenVersion: number;
    lastCheckedAt?: number;
    invalidated?: boolean;
  }
}
