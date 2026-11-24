"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaShieldAlt } from "react-icons/fa";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/api-client";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();

  // Verification email
  const [sendingVerify, setSendingVerify] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);

  // MFA Setup / Verify / Disable
  const [mfaSetupData, setMfaSetupData] = useState<{
    qrCodeDataUrl: string;
    manualSecret: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);

  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  if (status === "loading") return <LoadingSpinner />;
  const user = session?.user;
  if (!user) return null;

  const handleSendVerification = async () => {
    setSendingVerify(true);
    setDevVerifyUrl(null);
    try {
      const res = await apiFetch<{ message: string; devVerifyUrl?: string }>("/api/verify-email", {
        method: "POST",
      });
      toast.success(res.message);
      if (res.devVerifyUrl) setDevVerifyUrl(res.devVerifyUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send verification email");
    } finally {
      setSendingVerify(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPass(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/profile/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success(res.message);
      setCurrentPassword("");
      setNewPassword("");
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setChangingPass(false);
    }
  };

  const handleStartMfaSetup = async () => {
    setMfaBusy(true);
    try {
      const res = await apiFetch<{ qrCodeDataUrl: string; manualSecret: string }>(
        "/api/mfa/setup",
        { method: "POST" }
      );
      setMfaSetupData(res);
      setRecoveryCodes(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start MFA setup");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaBusy(true);
    try {
      const res = await apiFetch<{ message: string; recoveryCodes: string[] }>("/api/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code: mfaCode }),
      });
      toast.success(res.message);
      setRecoveryCodes(res.recoveryCodes);
      setMfaSetupData(null);
      setMfaCode("");
      await update();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setMfaBusy(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaBusy(true);
    try {
      const res = await apiFetch<{ message: string }>("/api/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ password: disablePassword, code: disableCode }),
      });
      toast.success(res.message);
      setDisablePassword("");
      setDisableCode("");
      await update();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disable MFA");
    } finally {
      setMfaBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl text-[#e8f5f3]">User Profile &amp; Security</h1>

      {/* Profile Summary */}
      <div className="card bg-[#0b1514] border border-[#122e2a] p-6 flex flex-col sm:flex-row items-center gap-6">
        <Image
          src={user.image || "/images/blank.webp"}
          alt={user.name}
          width={112}
          height={112}
          unoptimized={(user.image || "").startsWith("/api/uploads/")}
          className="object-cover w-28 h-28 rounded-full ring-2 ring-[#30c4b6]"
        />
        <div className="space-y-1 text-center sm:text-left flex-1">
          <h2 className="text-3xl text-[#e8f5f3]">{user.name}</h2>
          <p className="text-sm text-[#89aca8]">{user.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-2">
            <span className="badge bg-[#102220] text-[#30c4b6] border-[#17403b] uppercase">
              {user.role}
            </span>
            <span className="badge badge-outline text-[#e8f5f3]">{user.designation}</span>
            {user.emailVerified ? (
              <span className="badge badge-success gap-1 text-xs">
                <FaCheckCircle /> Email Verified
              </span>
            ) : (
              <span className="badge badge-warning text-xs">Email Unverified</span>
            )}
            {user.mfaEnabled && (
              <span className="badge badge-info gap-1 text-xs">
                <FaShieldAlt /> 2FA Enabled
              </span>
            )}
          </div>
          {!user.emailVerified && (
            <div className="pt-3">
              <button
                type="button"
                disabled={sendingVerify}
                onClick={handleSendVerification}
                className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
              >
                {sendingVerify ? "Sending..." : "Verify Email"}
              </button>
              {devVerifyUrl && (
                <div className="mt-2 text-xs text-[#30c4b6]">
                  Dev link:{" "}
                  <Link href={devVerifyUrl} className="underline text-white">
                    Click to verify email
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-Factor Authentication (TOTP 2FA) */}
      <div className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FaShieldAlt className="text-[#30c4b6]" size={20} />
          <h2 className="text-2xl text-[#e8f5f3]">Multi-Factor Authentication (Authenticator App)</h2>
        </div>

        {recoveryCodes && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2">
            <p className="text-sm font-semibold text-amber-200">
              Save these one-time recovery codes in a safe place. They will NOT be shown again:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {recoveryCodes.map((code) => (
                <code
                  key={code}
                  className="bg-[#080f0e] border border-[#122e2a] rounded px-2 py-1 text-center text-[#30c4b6]"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>
        )}

        {!user.mfaEnabled ? (
          !mfaSetupData ? (
            <div className="space-y-3">
              <p className="text-sm">
                Protect your account with a 6-digit TOTP authenticator app (Google Authenticator,
                Authy, 1Password, or Bitwarden).
              </p>
              <button
                type="button"
                disabled={mfaBusy}
                onClick={handleStartMfaSetup}
                className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
              >
                {mfaBusy ? "Generating..." : "Set Up 2FA"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <p className="text-sm">
                  1. Scan this QR code in your authenticator app, or enter the manual secret key:
                </p>
                <Image
                  src={mfaSetupData.qrCodeDataUrl}
                  alt="2FA QR Code"
                  width={192}
                  height={192}
                  unoptimized
                  className="rounded-lg bg-white p-2 w-48 h-48"
                />
                <div className="text-xs font-mono bg-[#080f0e] p-2 rounded border border-[#122e2a] break-all">
                  Secret: <span className="text-[#30c4b6]">{mfaSetupData.manualSecret}</span>
                </div>
              </div>

              <form onSubmit={handleVerifyMfa} className="space-y-3">
                <p className="text-sm">2. Enter the 6-digit code shown in your app to activate:</p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  className="input input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3] font-mono tracking-widest"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={mfaBusy}
                    className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e]"
                  >
                    {mfaBusy ? "Verifying..." : "Confirm & Enable 2FA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMfaSetupData(null)}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          <form onSubmit={handleDisableMfa} className="space-y-3 max-w-md">
            <p className="text-sm text-[#30c4b6]">
              2FA is currently active. To disable it, confirm your password and current 6-digit
              code (or a recovery code).
            </p>
            <input
              type="password"
              required
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Current password"
              className="input input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
            />
            <input
              type="text"
              required
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="6-digit code or recovery code"
              className="input input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
            />
            <button type="submit" disabled={mfaBusy} className="btn btn-sm btn-error text-white">
              {mfaBusy ? "Disabling..." : "Disable 2FA"}
            </button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="card bg-[#0b1514] border border-[#122e2a] p-6 space-y-4">
        <h2 className="text-2xl text-[#e8f5f3]">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="input input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 10 chars, Aa1!)"
            className="input input-bordered w-full bg-[#0d1c1a] text-[#e8f5f3]"
          />
          <button
            type="submit"
            disabled={changingPass}
            className="btn btn-sm border-[#30c4b6] bg-[#30c4b6] text-[#080f0e] hover:bg-[#1c9e92]"
          >
            {changingPass ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
