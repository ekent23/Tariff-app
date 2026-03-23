import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignInPage() {
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
            <form className="space-y-4">
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
                  placeholder="you@company.com"
                  className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-zinc-400">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full text-base">
                Continue
              </Button>
            </form>

            <div className="border-t border-zinc-800 pt-4 text-sm text-zinc-400">
              <p>
                New to TradeShield?{" "}
                <button
                  type="button"
                  className="font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Request a new workspace
                </button>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

