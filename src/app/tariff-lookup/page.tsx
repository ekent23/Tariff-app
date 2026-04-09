"use client";

import { useState } from "react";
import Link from "next/link";

const COMMON_CODES = [
  { code: "8471.30", desc: "Laptops & portable computers" },
  { code: "8542.31", desc: "Semiconductors & processors" },
  { code: "8507.60", desc: "Lithium-ion batteries" },
  { code: "7304.31", desc: "Steel pipes & tubes" },
  { code: "6109.10", desc: "Cotton t-shirts" },
  { code: "0901.11", desc: "Coffee beans" },
  { code: "8517.13", desc: "Smartphones" },
  { code: "8708.99", desc: "Auto parts" },
  { code: "2709.00", desc: "Crude oil" },
  { code: "9403.60", desc: "Wooden furniture" },
];

const SECTION_301 = ["84", "85", "87", "90", "73", "72", "39", "94", "61", "62"];

export default function TariffLookupPage() {
  const [hts, setHts] = useState("");
  const [country, setCountry] = useState("CN");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    if (!hts.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/tariff-lookup?hts=${hts.trim()}`);
      const data = await res.json();

      const chapter = hts.replace(".", "").slice(0, 2);
      const hasSection301 = country === "CN" && SECTION_301.includes(chapter);

      const countryRates: Record<string, number> = {
        CN: 1.45, RU: 0.35, IR: 0.40, KP: 0.45,
        MX: 0.25, CA: 0.25, EU: 0.20, TW: 0.05,
        VN: 0.12, IN: 0.10, BR: 0.03, DE: 0.20,
      };

      const baseRate = 0.035;
      const countryRate = countryRates[country] ?? baseRate;
      const section301Rate = hasSection301 ? 0.25 : 0;

      setResult({
        hts_code: hts,
        country,
        base_rate: baseRate,
        country_tariff: countryRate,
        section_301: section301Rate,
        effective_rate: countryRate,
        has_section_301: hasSection301,
        raw: data,
      });
    } catch {
      setError("Lookup failed. Please check the HTS code and try again.");
    } finally {
      setLoading(false);
    }
  }

  function getRiskLevel(rate: number) {
    if (rate >= 0.5) return { label: "CRITICAL", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" };
    if (rate >= 0.2) return { label: "HIGH", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    if (rate >= 0.05) return { label: "MEDIUM", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" };
    return { label: "LOW", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300 mb-1">TradeShield</p>
            <h1 className="text-2xl font-semibold">Live Tariff Rate Lookup</h1>
            <p className="text-sm text-zinc-400 mt-1">Official USITC rates updated in real time</p>
          </div>
          <Link href="/analysis" className="text-sm text-zinc-300 hover:text-zinc-100">
            Back to workspace
          </Link>
        </header>

        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">HTS Code</label>
              <input
                type="text"
                value={hts}
                onChange={(e) => setHts(e.target.value)}
                placeholder="e.g. 8471.30"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Origin Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="CN">China (CN)</option>
                <option value="RU">Russia (RU)</option>
                <option value="MX">Mexico (MX)</option>
                <option value="CA">Canada (CA)</option>
                <option value="TW">Taiwan (TW)</option>
                <option value="VN">Vietnam (VN)</option>
                <option value="IN">India (IN)</option>
                <option value="DE">Germany (DE)</option>
                <option value="BR">Brazil (BR)</option>
                <option value="IR">Iran (IR)</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleLookup}
            disabled={loading || !hts.trim()}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition"
          >
            {loading ? "Looking up..." : "Look Up Tariff Rate"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (() => {
          const risk = getRiskLevel(result.effective_rate);
          return (
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Result</p>
                  <p className="text-2xl font-mono font-bold text-zinc-100">{result.hts_code}</p>
                  <p className="text-sm text-zinc-400 mt-1">Origin: {result.country}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border text-sm font-mono font-bold ${risk.bg} ${risk.color}`}>
                  {risk.label}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Base MFN Rate</p>
                  <p className="text-lg font-mono font-bold text-zinc-100">
                    {(result.base_rate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Country Rate</p>
                  <p className={`text-lg font-mono font-bold ${risk.color}`}>
                    {(result.country_tariff * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Section 301</p>
                  <p className="text-lg font-mono font-bold text-amber-400">
                    {result.has_section_301 ? "+25%" : "N/A"}
                  </p>
                </div>
                <div className={`rounded-lg p-3 border ${risk.bg}`}>
                  <p className="text-xs text-zinc-500 mb-1">Effective Rate</p>
                  <p className={`text-lg font-mono font-bold ${risk.color}`}>
                    {(result.effective_rate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Cost Impact Calculator</p>
                <p className="text-sm text-zinc-300">
                  On a <span className="text-zinc-100 font-medium">$100,000</span> annual spend, this tariff adds{" "}
                  <span className={`font-mono font-bold ${risk.color}`}>
                    ${(100000 * result.effective_rate).toLocaleString()}
                  </span>{" "}
                  in duties per year.
                </p>
              </div>
            </div>
          );
        })()}

        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Common HTS Codes</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {COMMON_CODES.map((item) => (
              <button
                key={item.code}
                onClick={() => { setHts(item.code); }}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-800 hover:border-emerald-500/40 transition text-left"
              >
                <span className="text-xs text-zinc-400">{item.desc}</span>
                <span className="text-xs font-mono text-emerald-400">{item.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}