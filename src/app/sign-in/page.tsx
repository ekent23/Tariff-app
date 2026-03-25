"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";

export default function SignInPage() {
  const router = useRouter();
  const { isLoading, user, error } = db.useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<"email" | "code">("email");

  const canSend = useMemo(
    () => email.trim().length > 3 && email.includes("@"),
    [email],
  );

  useEffect(() => {
    if (user) {
      router.replace("/analysis");
    }
  }, [user, router]);

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    setIsSending(true);
    setStatus("");
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStep("code");
      setStatus("Magic code sent. Check your inbox.");
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Unable to send code.";
      setStatus(message);
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) {
      return;
    }
    setIsVerifying(true);
    setStatus("");
    try {
      await db.auth.signInWithMagicCode({
        email: email.trim(),
        code: code.trim(),
      });
      router.replace("/analysis");
    } catch (verifyError) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : "Unable to verify code.";
      setStatus(message);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-300 hover:text-zinc-100"
          >
            ← Back to dashboard
          </Link>
        </div>

        <Card className="border-zinc-800/80 bg-zinc-950/80 text-zinc-50 shadow-xl shadow-emerald-500/10">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl font-semibold">
              Sign in or create an account
            </CardTitle>
            <CardDescription className="text-base text-zinc-300">
              Use your work email to access TradeShield scenario modeling,
              tariff exposure analysis, and supplier risk dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Checking session...</p>
            ) : null}
            {error ? (
              <p className="text-sm text-red-400">{error.message}</p>
            ) : null}

            {step === "email" ? (
              <form className="space-y-4" onSubmit={handleSendCode}>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-200"
                  >
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-base"
                  disabled={!canSend || isSending}
                >
                  {isSending ? "Sending code..." : "Send magic code"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyCode}>
                <div className="space-y-2">
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-zinc-200"
                  >
                    Magic code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Enter the 6-digit code"
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-base"
                  disabled={!code.trim() || isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Continue"}
                </Button>

                <button
                  type="button"
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setStatus("");
                  }}
                >
                  Use a different email
                </button>
              </form>
            )}

            {status ? (
              <p className="text-sm text-zinc-300">{status}</p>
            ) : null}

            <div className="border-t border-zinc-800 pt-4 text-sm text-zinc-400">
              <p>
                New to TradeShield?{" "}
                <span className="font-medium text-emerald-300">
                  We will create your workspace after verification.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
