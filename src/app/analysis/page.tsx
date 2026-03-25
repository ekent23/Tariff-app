"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { id, InstaQLEntity } from "@instantdb/react";
import { db } from "@/lib/db";
import { requestTariffAnalysis } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppSchema } from "@/instant.schema";

type Analysis = InstaQLEntity<AppSchema, "analyses", { messages: {} }>;
type Message = InstaQLEntity<AppSchema, "messages">;

export default function AnalysisPage() {
  const router = useRouter();
  const auth = db.useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const query =
    auth.user && !auth.isLoading
      ? ({
          analyses: {
            $: {
              where: { "owner.id": auth.user.id },
              order: { updatedAt: "desc" },
            },
            messages: {},
          },
        } as const)
      : null;

  const { data, isLoading, error } = db.useQuery(query);

  const analyses = data?.analyses ?? [];

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.replace("/sign-in");
    }
  }, [auth.isLoading, auth.user, router]);

  useEffect(() => {
    if (!activeId && analyses.length > 0) {
      setActiveId(analyses[0].id);
    }
  }, [activeId, analyses]);

  const activeAnalysis = analyses.find((analysis) => analysis.id === activeId);

  const activeMessages = useMemo(() => {
    if (!activeAnalysis) {
      return [] as Message[];
    }
    const messages = (activeAnalysis.messages ?? []) as Message[];
    return [...messages].sort((a, b) => a.createdAt - b.createdAt);
  }, [activeAnalysis]);

  const latestSummary = activeAnalysis?.summary;

  function handleNewAnalysis() {
    if (!auth.user) {
      return;
    }
    const analysisId = id();
    const now = Date.now();
    db.transact(
      db.tx.analyses[analysisId]
        .create({
          title: "New analysis",
          createdAt: now,
          updatedAt: now,
          status: "draft",
        })
        .link({ owner: auth.user.id }),
    );
    setActiveId(analysisId);
  }

  async function handleSendPrompt(event: FormEvent) {
    event.preventDefault();
    if (!auth.user || !prompt.trim()) {
      return;
    }
    setIsSending(true);
    setSendError("");

    const now = Date.now();
    const promptText = prompt.trim();
    setPrompt("");

    let analysisId = activeId;
    const txs: Array<any> = [];

    if (!analysisId) {
      analysisId = id();
      txs.push(
        db.tx.analyses[analysisId]
          .create({
            title: promptText.slice(0, 48),
            createdAt: now,
            updatedAt: now,
            status: "in-progress",
          })
          .link({ owner: auth.user.id }),
      );
      setActiveId(analysisId);
    } else {
      txs.push(
        db.tx.analyses[analysisId].update({
          updatedAt: now,
          status: "in-progress",
        }),
      );
    }

    txs.push(
      db.tx.messages[id()]
        .create({
          role: "user",
          content: promptText,
          createdAt: now,
        })
        .link({ analysis: analysisId }),
    );

    db.transact(txs);

    try {
      const historyPayload = activeMessages
        .slice(-6)
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        }));

      const response = await requestTariffAnalysis({
        prompt: promptText,
        history: historyPayload,
      });

      db.transact([
        db.tx.messages[id()]
          .create({
            role: "assistant",
            content: response.analysis,
            createdAt: Date.now(),
          })
          .link({ analysis: analysisId }),
        db.tx.analyses[analysisId].update({
          updatedAt: Date.now(),
          summary: response.analysis,
          status: "complete",
        }),
      ]);
    } catch (analysisError) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Unable to run analysis.";
      setSendError(message);
      db.transact(
        db.tx.analyses[analysisId].update({ status: "error" }),
      );
    } finally {
      setIsSending(false);
    }
  }

  if (!auth.user && !auth.isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
              TradeShield
            </p>
            <h1 className="text-2xl font-semibold text-zinc-100">
              Tariff analysis workspace
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <Link href="/" className="hover:text-zinc-100">
              Back to landing
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700/80 bg-transparent text-zinc-100"
              onClick={() => db.auth.signOut()}
            >
              Sign out
            </Button>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,_260px)_minmax(0,_1fr)]">
          <aside className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Analyses
              </h2>
              <Button size="sm" onClick={handleNewAnalysis}>
                New
              </Button>
            </div>
            <div className="space-y-3">
              {analyses.length === 0 ? (
                <Card className="border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No analyses yet. Start a new scenario to save your work.
                </Card>
              ) : null}
              {analyses.map((analysis) => (
                <button
                  key={analysis.id}
                  type="button"
                  onClick={() => setActiveId(analysis.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    analysis.id === activeId
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-zinc-800/80 bg-zinc-950/70 hover:border-emerald-400/40"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-100">
                    {analysis.title}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(analysis.updatedAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Status: {analysis.status ?? "draft"}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex flex-col gap-6">
            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Active scenario
                  </p>
                  <h2 className="text-xl font-semibold text-zinc-100">
                    {activeAnalysis?.title ?? "Start a new analysis"}
                  </h2>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  {activeAnalysis
                    ? `Updated ${new Date(activeAnalysis.updatedAt).toLocaleString()}`
                    : ""}
                </div>
              </div>
              {latestSummary ? (
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                    Latest AI summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {latestSummary}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">
                  Share a scenario to generate an AI tariff impact summary.
                </p>
              )}
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-zinc-400">Loading analyses...</p>
                ) : null}
                {error ? (
                  <p className="text-sm text-red-400">{error.message}</p>
                ) : null}
                {activeMessages.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    Ask a question about tariff exposure, supplier risk, or
                    landed cost scenarios.
                  </p>
                ) : null}
                <div className="space-y-3">
                  {activeMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-50"
                          : "border-zinc-800/80 bg-zinc-900/70 text-zinc-200"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                        {message.role === "user" ? "You" : "TradeShield AI"}
                      </p>
                      <p className="mt-2 whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <form className="space-y-4" onSubmit={handleSendPrompt}>
                <div className="space-y-2">
                  <label
                    htmlFor="prompt"
                    className="block text-sm font-medium text-zinc-200"
                  >
                    Scenario prompt
                  </label>
                  <textarea
                    id="prompt"
                    rows={4}
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Example: Analyze a 15% tariff increase on HS code 8517.62 for imports from CN to the US. Focus on top 20 SKUs and supplier concentration risk."
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                  />
                </div>
                {sendError ? (
                  <p className="text-sm text-red-400">{sendError}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={isSending || !prompt.trim()}>
                    {isSending ? "Running analysis..." : "Run analysis"}
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Results are stored privately in your Instant workspace.
                  </p>
                </div>
              </form>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
