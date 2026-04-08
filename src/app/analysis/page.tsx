"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { id, InstaQLEntity } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  requestCsvAnalysis,
  requestSimulation,
  type ProductResult,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AppSchema } from "@/instant.schema";

type Analysis = InstaQLEntity<AppSchema, "analyses", { messages: {} }>;
type Message = InstaQLEntity<AppSchema, "messages">;

type SimulationForm = {
  htsCode: string;
  originCountry: string;
  annualSpend: string;
  tariffRate: string;
};

export default function AnalysisPage() {
  const router = useRouter();
  const auth = db.useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [simulation, setSimulation] = useState<SimulationForm>({
    htsCode: "",
    originCountry: "",
    annualSpend: "",
    tariffRate: "",
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

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

  useEffect(() => {
    if (activeAnalysis) {
      setRenameValue(activeAnalysis.title);
      setIsRenaming(false);
    }
  }, [activeAnalysis]);

  function shouldAutoRename(title: string) {
    return (
      title === "New analysis" ||
      title === "CSV analysis" ||
      title === "Scenario simulation"
    );
  }

  function ensureAnalysis(title: string) {
    if (!auth.user) {
      return null;
    }
    if (activeId) {
      return activeId;
    }

    const analysisId = id();
    const now = Date.now();
    db.transact(
      db.tx.analyses[analysisId]
        .create({
          title,
          createdAt: now,
          updatedAt: now,
          status: "in-progress",
        })
        .link({ owner: auth.user.id }),
    );
    setActiveId(analysisId);
    return analysisId;
  }

  function createNewAnalysis(title: string) {
    if (!auth.user) {
      return null;
    }
    const analysisId = id();
    const now = Date.now();
    db.transact(
      db.tx.analyses[analysisId]
        .create({
          title,
          createdAt: now,
          updatedAt: now,
          status: "draft",
        })
        .link({ owner: auth.user.id }),
    );
    setActiveId(analysisId);
    return analysisId;
  }

  function requestDeleteAnalysis(analysisId: string) {
    setPendingDeleteId(analysisId);
    setIsDeleteOpen(true);
  }

  function closeDeleteModal() {
    setIsDeleteOpen(false);
    setPendingDeleteId(null);
  }

  function confirmDeleteAnalysis() {
    if (!auth.user || !pendingDeleteId) {
      closeDeleteModal();
      return;
    }

    if (activeId === pendingDeleteId) {
      const remaining = analyses.filter(
        (analysis) => analysis.id !== pendingDeleteId,
      );
      setActiveId(remaining[0]?.id ?? null);
    }

    db.transact(db.tx.analyses[pendingDeleteId].delete());
    closeDeleteModal();
  }

  function writeAssistantMessage(
    analysisId: string,
    content: string,
    suggestedTitle?: string,
  ) {
    const txs = [
      db.tx.messages[id()]
        .create({
          role: "assistant",
          content,
          createdAt: Date.now(),
        })
        .link({ analysis: analysisId }),
      db.tx.analyses[analysisId].update({
        updatedAt: Date.now(),
        summary: content,
        status: "complete",
      }),
    ];

    if (activeAnalysis && activeAnalysis.id === analysisId) {
      const nextTitle =
        suggestedTitle ??
        (shouldAutoRename(activeAnalysis.title)
          ? content.split("\n")[0]?.slice(0, 64)
          : null);
      if (nextTitle && nextTitle !== activeAnalysis.title) {
        txs.push(
          db.tx.analyses[analysisId].update({
            title: nextTitle,
            updatedAt: Date.now(),
          }),
        );
      }
    }

    db.transact(txs);
  }

  async function handleUploadCsv(event: FormEvent) {
    event.preventDefault();
    if (!auth.user || !uploadFile) {
      return;
    }
    setIsUploading(true);
    setUploadStatus("");

    const analysisId = ensureAnalysis("CSV analysis");
    if (!analysisId) {
      setIsUploading(false);
      return;
    }

    try {
      const results = await requestCsvAnalysis({ file: uploadFile });
      const summary = buildCsvSummary(results);
      const baseName = uploadFile.name.replace(/\.[^/.]+$/, "");
      const suggestedTitle = baseName ? `CSV: ${baseName}` : "CSV analysis";
      writeAssistantMessage(analysisId, summary, suggestedTitle);
      setUploadStatus("CSV analyzed successfully.");
      setUploadFile(null);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "CSV upload failed.";
      setUploadStatus(message);
      db.transact(db.tx.analyses[analysisId].update({ status: "error" }));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSimulation(event: FormEvent) {
    event.preventDefault();
    if (!auth.user) {
      return;
    }
    setIsSimulating(true);
    setSimulationStatus("");

    const analysisId = ensureAnalysis("Scenario simulation");
    if (!analysisId) {
      setIsSimulating(false);
      return;
    }

    try {
      const result = await requestSimulation({
        hts_code: simulation.htsCode.trim(),
        origin_country: simulation.originCountry.trim(),
        annual_spend: Number(simulation.annualSpend),
        tariff_rate: Number(simulation.tariffRate),
      });

      const summary = `Scenario results:\nOriginal cost: $${result.original_cost}\nNew cost: $${result.new_cost}\nImpact: $${result.impact}\nRisk score: ${result.risk_score}`;
      const suggestedTitle = `Scenario: ${simulation.htsCode.trim()} · ${simulation.originCountry.trim()}`;
      writeAssistantMessage(analysisId, summary, suggestedTitle);
      setSimulationStatus("Simulation completed.");
    } catch (simulationError) {
      const message =
        simulationError instanceof Error
          ? simulationError.message
          : "Simulation failed.";
      setSimulationStatus(message);
      db.transact(db.tx.analyses[analysisId].update({ status: "error" }));
    } finally {
      setIsSimulating(false);
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
              AI Analysis Workspace
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
              <Button size="sm" onClick={() => createNewAnalysis("New analysis")}>
                New
              </Button>
            </div>
            <div className="space-y-3">
              {analyses.length === 0 ? (
                <Card className="border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No analyses yet. Upload a CSV or run a simulation to save your
                  work.
                </Card>
              ) : null}
              {analyses.map((analysis) => {
                const isActive = analysis.id === activeId;
                return (
                  <div
                    key={analysis.id}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-3 transition ${
                      isActive
                        ? "border-emerald-400/60 bg-emerald-500/10"
                        : "border-zinc-800/80 bg-zinc-950/70 hover:border-emerald-400/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(analysis.id)}
                      className="flex-1 text-left"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-zinc-400 hover:text-red-300"
                      onClick={() => requestDeleteAnalysis(analysis.id)}
                    >
                      Delete
                    </Button>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="flex flex-col gap-6">
            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Active scenario
                  </p>
                  {isRenaming && activeAnalysis ? (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const trimmed = renameValue.trim();
                          if (!trimmed || !activeAnalysis) {
                            return;
                          }
                          db.transact(
                            db.tx.analyses[activeAnalysis.id].update({
                              title: trimmed,
                              updatedAt: Date.now(),
                            }),
                          );
                          setIsRenaming(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenameValue(activeAnalysis.title);
                          setIsRenaming(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-zinc-100">
                        {activeAnalysis?.title ?? "Start a new analysis"}
                      </h2>
                      {activeAnalysis ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-emerald-200"
                          onClick={() => setIsRenaming(true)}
                        >
                          Edit name
                        </Button>
                      ) : null}
                    </div>
                  )}
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
                    Latest summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {latestSummary}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">
                  Upload a CSV or run a scenario simulation to generate results.
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
                    Results and AI briefings will appear here after analysis.
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
              <form className="space-y-4" onSubmit={handleUploadCsv}>
                <div className="space-y-2">
                  <label
                    htmlFor="csv-upload"
                    className="block text-sm font-medium text-zinc-200"
                  >
                    Upload CSV for AI analysis
                  </label>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={(event) =>
                      setUploadFile(event.target.files?.[0] ?? null)
                    }
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1.5 file:text-emerald-100 hover:file:bg-emerald-500/30"
                  />
                </div>
                {uploadStatus ? (
                  <p className="text-sm text-zinc-300">{uploadStatus}</p>
                ) : null}
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={!uploadFile || isUploading}>
                    {isUploading ? "Analyzing..." : "Run CSV analysis"}
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Uses the FastAPI `/analyze` endpoint.
                  </p>
                </div>
              </form>
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <form className="space-y-4" onSubmit={handleSimulation}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="hts-code"
                      className="block text-sm font-medium text-zinc-200"
                    >
                      HTS code
                    </label>
                    <input
                      id="hts-code"
                      value={simulation.htsCode}
                      onChange={(event) =>
                        setSimulation((prev) => ({
                          ...prev,
                          htsCode: event.target.value,
                        }))
                      }
                      placeholder="8517.62"
                      className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="origin-country"
                      className="block text-sm font-medium text-zinc-200"
                    >
                      Origin country
                    </label>
                    <input
                      id="origin-country"
                      value={simulation.originCountry}
                      onChange={(event) =>
                        setSimulation((prev) => ({
                          ...prev,
                          originCountry: event.target.value,
                        }))
                      }
                      placeholder="CN"
                      className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="annual-spend"
                      className="block text-sm font-medium text-zinc-200"
                    >
                      Annual spend
                    </label>
                    <input
                      id="annual-spend"
                      type="number"
                      value={simulation.annualSpend}
                      onChange={(event) =>
                        setSimulation((prev) => ({
                          ...prev,
                          annualSpend: event.target.value,
                        }))
                      }
                      placeholder="250000"
                      className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="tariff-rate"
                      className="block text-sm font-medium text-zinc-200"
                    >
                      Proposed tariff rate
                    </label>
                    <input
                      id="tariff-rate"
                      type="number"
                      value={simulation.tariffRate}
                      onChange={(event) =>
                        setSimulation((prev) => ({
                          ...prev,
                          tariffRate: event.target.value,
                        }))
                      }
                      placeholder="0.15"
                      className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:ring-offset-0"
                    />
                  </div>
                </div>
                {simulationStatus ? (
                  <p className="text-sm text-zinc-300">{simulationStatus}</p>
                ) : null}
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={
                      isSimulating ||
                      !simulation.htsCode ||
                      !simulation.originCountry ||
                      !simulation.annualSpend ||
                      !simulation.tariffRate
                    }
                  >
                    {isSimulating ? "Running..." : "Run simulation"}
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Uses the FastAPI `/simulate` endpoint.
                  </p>
                </div>
              </form>
            </Card>
          </section>
        </main>
      </div>
      {isDeleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-lg font-semibold">Delete this chat?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This will permanently remove the analysis and its messages. This
              action cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button
                variant="ghost"
                className="text-zinc-300"
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 text-white hover:bg-red-400"
                onClick={confirmDeleteAnalysis}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildCsvSummary(results: ProductResult[]) {
  if (results.length === 0) {
    return "CSV processed, but no rows were returned.";
  }

  const top = results.slice(0, 5);
  const lines = top.map(
    (row) =>
      `- ${row.name} (${row.hts_code}, ${row.origin_country}) risk ${row.risk_score}`,
  );

  return `CSV analysis complete. ${results.length} products analyzed.\nTop results:\n${lines.join(
    "\n",
  )}`;
}
