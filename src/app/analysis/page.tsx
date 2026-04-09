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
    if (!activeAnalysis) return [] as Message[];
    const messages = (activeAnalysis.messages ?? []) as Message[];
    return [...messages].sort((a, b) => a.createdAt - b.createdAt);
  }, [activeAnalysis]);

  const latestSummary = activeAnalysis?.summary;

<<<<<<< Updated upstream
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
=======
  function handleNewAnalysis() {
    if (!auth.user) return;
    const analysisId = id();
    const now = Date.now();
    db.transact(
      db.tx.analyses[analysisId].create({
        title: "New analysis",
        createdAt: now,
        updatedAt: now,
        status: "draft",
      }),
>>>>>>> Stashed changes
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

  function handleDeleteAnalysis(analysisId: string) {
    db.transact(db.tx.analyses[analysisId].delete());
    if (activeId === analysisId) setActiveId(null);
  }

  async function handleUploadCsv(event: FormEvent) {
    event.preventDefault();
    if (!auth.user || !uploadFile) return;
    setIsUploading(true);
    setUploadStatus("");

    const analysisId = ensureAnalysis("CSV analysis");
    if (!analysisId) {
<<<<<<< Updated upstream
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
=======
      analysisId = id();
      db.transact(
        db.tx.analyses[analysisId].create({
          title: "CSV upload",
          createdAt: now,
          updatedAt: now,
          status: "in-progress",
        }),
      );
      setActiveId(analysisId);
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      if (!response.ok) throw new Error(text || "CSV upload failed");

      const result = JSON.parse(text) as {
        message: string;
        rows: number;
        columns: string[];
        sample?: string[][];
      };

      const summary = `CSV uploaded: ${result.rows} rows, ${result.columns.length} columns. Columns: ${result.columns.join(", ")}.`;

      db.transact([
        db.tx.messages[id()]
          .create({ role: "assistant", content: summary, createdAt: Date.now() })
          .link({ analysis: analysisId }),
        db.tx.analyses[analysisId].update({
          updatedAt: Date.now(),
          summary,
          status: "complete",
        }),
      ]);

      setUploadStatus(result.message);
>>>>>>> Stashed changes
      setUploadFile(null);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "CSV upload failed.";
      setUploadStatus(message);
      db.transact(db.tx.analyses[analysisId].update({ status: "error" }));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSimulation(event: FormEvent) {
    event.preventDefault();
<<<<<<< Updated upstream
    if (!auth.user) {
      return;
    }
    setIsSimulating(true);
    setSimulationStatus("");
=======
    if (!auth.user || !prompt.trim()) return;
    setIsSending(true);
    setSendError("");

    const now = Date.now();
    const promptText = prompt.trim();
    setPrompt("");

    let analysisId = activeId;
    const txs: Array<any> = [];
>>>>>>> Stashed changes

    const analysisId = ensureAnalysis("Scenario simulation");
    if (!analysisId) {
<<<<<<< Updated upstream
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
=======
      analysisId = id();
      txs.push(
        db.tx.analyses[analysisId].create({
          title: promptText.slice(0, 48),
          createdAt: now,
          updatedAt: now,
          status: "in-progress",
        }),
      );
      setActiveId(analysisId);
    } else {
      txs.push(db.tx.analyses[analysisId].update({ updatedAt: now, status: "in-progress" }));
    }

    txs.push(
      db.tx.messages[id()]
        .create({ role: "user", content: promptText, createdAt: now })
        .link({ analysis: analysisId }),
    );

    db.transact(txs);

    try {
      const historyPayload = activeMessages.slice(-6).map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));

      const response = await requestTariffAnalysis({ prompt: promptText, history: historyPayload });

      db.transact([
        db.tx.messages[id()]
          .create({ role: "assistant", content: response.analysis, createdAt: Date.now() })
          .link({ analysis: analysisId }),
        db.tx.analyses[analysisId].update({
          updatedAt: Date.now(),
          summary: response.analysis,
          status: "complete",
        }),
      ]);
    } catch (analysisError) {
      const message = analysisError instanceof Error ? analysisError.message : "Unable to run analysis.";
      setSendError(message);
>>>>>>> Stashed changes
      db.transact(db.tx.analyses[analysisId].update({ status: "error" }));
    } finally {
      setIsSimulating(false);
    }
  }

  if (!auth.user && !auth.isLoading) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
<<<<<<< Updated upstream
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
              TradeShield
            </p>
            <h1 className="text-2xl font-semibold text-zinc-100">
              AI Analysis Workspace
            </h1>
=======
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">TradeShield</p>
            <h1 className="text-2xl font-semibold text-zinc-100">Tariff analysis workspace</h1>
>>>>>>> Stashed changes
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <Link
              href="/news"
              className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <span className="text-xs">📰</span> Tariff News
            </Link>
            <Link
              href="/tariff-lookup"
              className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:border-zinc-500 transition"
            >
              <span className="text-xs">🔍</span> Tariff Lookup
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-purple-300 hover:bg-purple-500/20 transition"
            >
              <span className="text-xs">📊</span> Risk Dashboard
            </Link>
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
<<<<<<< Updated upstream
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Analyses
              </h2>
              <Button size="sm" onClick={() => createNewAnalysis("New analysis")}>
                New
              </Button>
=======
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Analyses</h2>
              <Button size="sm" onClick={handleNewAnalysis}>New</Button>
>>>>>>> Stashed changes
            </div>
            <div className="space-y-3">
              {analyses.length === 0 ? (
                <Card className="border-zinc-800/80 bg-zinc-950/70 p-4 text-sm text-zinc-400">
                  No analyses yet. Upload a CSV or run a simulation to save your
                  work.
                </Card>
              ) : null}
<<<<<<< Updated upstream
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
=======
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className={`relative group w-full rounded-lg border px-3 py-3 text-left transition ${
                    analysis.id === activeId
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-zinc-800/80 bg-zinc-950/70 hover:border-emerald-400/40"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left pr-6"
                    onClick={() => setActiveId(analysis.id)}
                  >
                    <p className="text-sm font-semibold text-zinc-100">{analysis.title}</p>
                    <p className="text-xs text-zinc-400">{new Date(analysis.updatedAt).toLocaleString()}</p>
                    <p className="mt-2 text-xs text-zinc-500">Status: {analysis.status ?? "draft"}</p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAnalysis(analysis.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-zinc-600 hover:text-red-400 text-xs px-1.5 py-0.5 rounded hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </div>
              ))}
>>>>>>> Stashed changes
            </div>
            <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Quick Links</p>
              <div className="flex flex-col gap-2">
                <Link href="/news" className="text-xs text-emerald-400 hover:text-emerald-300">
                  📰 Live tariff news →
                </Link>
                <Link href="/tariff-lookup" className="text-xs text-zinc-400 hover:text-zinc-300">
                  🔍 HTS code lookup →
                </Link>
                <Link href="/dashboard" className="text-xs text-purple-400 hover:text-purple-300">
                  📊 Risk dashboard →
                </Link>
              </div>
            </div>
          </aside>

          <section className="flex flex-col gap-6">
            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
<<<<<<< Updated upstream
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
=======
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active scenario</p>
                  <h2 className="text-xl font-semibold text-zinc-100">
                    {activeAnalysis?.title ?? "Start a new analysis"}
                  </h2>
>>>>>>> Stashed changes
                </div>
                <div className="text-right text-xs text-zinc-400">
                  {activeAnalysis ? `Updated ${new Date(activeAnalysis.updatedAt).toLocaleString()}` : ""}
                </div>
              </div>
              {latestSummary ? (
                <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
<<<<<<< Updated upstream
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                    Latest summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {latestSummary}
                  </p>
=======
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Latest AI summary</p>
                  <p className="mt-2 text-sm leading-relaxed">{latestSummary}</p>
>>>>>>> Stashed changes
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">
                  Upload a CSV or run a scenario simulation to generate results.
                </p>
              )}
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <div className="space-y-4">
                {isLoading ? <p className="text-sm text-zinc-400">Loading analyses...</p> : null}
                {error ? <p className="text-sm text-red-400">{error.message}</p> : null}
                {activeMessages.length === 0 ? (
                  <p className="text-sm text-zinc-400">
<<<<<<< Updated upstream
                    Results and AI briefings will appear here after analysis.
=======
                    Ask a question about tariff exposure, supplier risk, or landed cost scenarios.
>>>>>>> Stashed changes
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
                      <p className="mt-2 whitespace-pre-line">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
              <form className="space-y-4" onSubmit={handleUploadCsv}>
                <div className="space-y-2">
<<<<<<< Updated upstream
                  <label
                    htmlFor="csv-upload"
                    className="block text-sm font-medium text-zinc-200"
                  >
                    Upload CSV for AI analysis
=======
                  <label htmlFor="csv-upload" className="block text-sm font-medium text-zinc-200">
                    Upload CSV for analysis
>>>>>>> Stashed changes
                  </label>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1.5 file:text-emerald-100 hover:file:bg-emerald-500/30"
                  />
                </div>
                {uploadStatus ? <p className="text-sm text-zinc-300">{uploadStatus}</p> : null}
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={!uploadFile || isUploading}>
<<<<<<< Updated upstream
                    {isUploading ? "Analyzing..." : "Run CSV analysis"}
                  </Button>
                  <p className="text-xs text-zinc-500">
                    Uses the FastAPI `/analyze` endpoint.
                  </p>
=======
                    {isUploading ? "Uploading..." : "Upload CSV"}
                  </Button>
                  <p className="text-xs text-zinc-500">We will parse the file and summarize columns + row count.</p>
>>>>>>> Stashed changes
                </div>
              </form>
            </Card>

            <Card className="border-zinc-800/80 bg-zinc-950/70 p-5">
<<<<<<< Updated upstream
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
=======
              <form className="space-y-4" onSubmit={handleSendPrompt}>
                <div className="space-y-2">
                  <label htmlFor="prompt" className="block text-sm font-medium text-zinc-200">
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
                {sendError ? <p className="text-sm text-red-400">{sendError}</p> : null}
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={isSending || !prompt.trim()}>
                    {isSending ? "Running analysis..." : "Run analysis"}
                  </Button>
                  <p className="text-xs text-zinc-500">Results are stored privately in your Instant workspace.</p>
>>>>>>> Stashed changes
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
