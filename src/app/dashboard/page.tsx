"use client";

import { useState } from "react";
import Link from "next/link";

type Product = {
  name: string;
  country: string;
  annual_spend: number;
  tariff_rate: number;
  risk_score: number;
  duty_exposure: number;
};

type CountryBreakdown = {
  country: string;
  spend: number;
  duty: number;
  count: number;
};

type Summary = {
  total_products: number;
  total_spend: number;
  total_duty_exposure: number;
  critical_count: number;
  avg_risk_score: number;
};

type DashboardData = {
  products: Product[];
  country_breakdown: CountryBreakdown[];
  summary: Summary;
};

function fmt(n: number) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + Math.round(n);
}

function riskColor(score: number) {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-amber-400";
  if (score >= 20) return "text-blue-400";
  return "text-emerald-400";
}

function riskBg(score: number) {
  if (score >= 75) return "bg-red-500/10 border-red-500/20 text-red-400";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  if (score >= 20) return "bg-blue-500/10 border-blue-500/20 text-blue-400";
  return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
}

function riskLabel(score: number) {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-red-500" :
    score >= 50 ? "bg-amber-500" :
    score >= 20 ? "bg-blue-500" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-mono font-bold w-6 text-right ${riskColor(score)}`}>
        {Math.round(score)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(f: File) {
    setFile(f);
    setLoading(true);
    setError("");
    setData(null);
    const formData = new FormData();
    formData.append("file", f);
    try {
      const res = await fetch("/api/analyze-csv", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — make sure backend is running");
    } finally {
      setLoading(false);
    }
  }

  const top5 = data?.products.slice(0, 5) ?? [];
  const maxDuty = Math.max(...(data?.country_breakdown.map((c) => c.duty) ?? [1]));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300 mb-1">TradeShield</p>
            <h1 className="text-2xl font-semibold">Risk Score Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Upload a supplier CSV to generate your risk report</p>
          </div>
          <Link href="/analysis" className="text-sm text-zinc-300 hover:text-zinc-100">
            Back to workspace
          </Link>
        </header>

        <div
          className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center cursor-pointer hover:border-emerald-500/40 transition mb-8"
          onClick={() => document.getElementById("dash-file")?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
        >
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg font-medium text-zinc-200 mb-2">
            {file ? `Uploaded: ${file.name}` : "Drop your supplier CSV here"}
          </p>
          <p className="text-sm text-zinc-500 mb-6">Columns needed: name, origin_country, annual_spend</p>
          <button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition">
            {file ? "Upload Different File" : "Choose File"}
          </button>
          <input
            id="dash-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
        </div>

        {loading && (
          <div className="text-center py-20 text-zinc-400">
            <div className="inline-block w-8 h-8 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p>Analyzing your supply chain...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-zinc-400">
                Results for <span className="text-zinc-200 font-medium">{file?.name}</span>
              </p>
              <button
                onClick={() => { setData(null); setFile(null); }}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg transition"
              >
                Upload new file
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Total Products</p>
                <p className="text-3xl font-mono font-bold text-blue-400">{data.summary.total_products}</p>
                <p className="text-xs text-zinc-500 mt-1">in your supply chain</p>
              </div>
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Total Spend</p>
                <p className="text-3xl font-mono font-bold text-zinc-100">{fmt(data.summary.total_spend)}</p>
                <p className="text-xs text-zinc-500 mt-1">annual exposure</p>
              </div>
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Duty Exposure</p>
                <p className="text-3xl font-mono font-bold text-amber-400">{fmt(data.summary.total_duty_exposure)}</p>
                <p className="text-xs text-zinc-500 mt-1">estimated annual duties</p>
              </div>
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-5">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Critical Risk</p>
                <p className="text-3xl font-mono font-bold text-red-400">{data.summary.critical_count}</p>
                <p className="text-xs text-zinc-500 mt-1">products score ≥75</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-6">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Top 5 Highest Risk Products</p>
                <div className="space-y-4">
                  {top5.map((p, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-600">{i + 1}</span>
                          <span className="text-sm font-medium text-zinc-100">{p.name}</span>
                          <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{p.country}</span>
                        </div>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${riskBg(p.risk_score)}`}>
                          {riskLabel(p.risk_score)}
                        </span>
                      </div>
                      <RiskBar score={p.risk_score} />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-zinc-600">Spend: {fmt(p.annual_spend)}</span>
                        <span className="text-xs text-zinc-600">Duty: {fmt(p.duty_exposure)}/yr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-6">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Duty Exposure by Country</p>
                <div className="space-y-4">
                  {data.country_breakdown
                    .sort((a, b) => b.duty - a.duty)
                    .slice(0, 8)
                    .map((c, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-zinc-300">{c.country}</span>
                            <span className="text-xs text-zinc-600">{c.count} product{c.count > 1 ? "s" : ""}</span>
                          </div>
                          <span className="text-xs font-mono text-amber-400">{fmt(c.duty)}/yr</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(c.duty / maxDuty) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">Total spend: {fmt(c.spend)}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-6 mb-8">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-5">Full Product Risk Table</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider pb-3 pr-4">Product</th>
                      <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider pb-3 pr-4">Country</th>
                      <th className="text-right text-xs font-mono text-zinc-500 uppercase tracking-wider pb-3 pr-4">Annual Spend</th>
                      <th className="text-right text-xs font-mono text-zinc-500 uppercase tracking-wider pb-3 pr-4">Tariff Rate</th>
                      <th className="text-right text-xs font-mono text-zinc-500 uppercase tracking-wider pb-3 pr-4">Duty/Year</th>
                      <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider pb-3">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p, i) => (
                      <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition">
                        <td className="py-3 pr-4 text-zinc-200 font-medium">{p.name}</td>
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{p.country}</span>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-zinc-300">{fmt(p.annual_spend)}</td>
                        <td className="py-3 pr-4 text-right font-mono text-zinc-300">{(p.tariff_rate * 100).toFixed(1)}%</td>
                        <td className="py-3 pr-4 text-right font-mono text-amber-400">{fmt(p.duty_exposure)}</td>
                        <td className="py-3">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${riskBg(p.risk_score)}`}>
                            {riskLabel(p.risk_score)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/analysis"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
              >
                Run AI Analysis on These Results →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
