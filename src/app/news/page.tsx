"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Article = {
  title: string;
  description: string;
  url: string;
  source: { name: string };
  publishedAt: string;
  urlToImage: string | null;
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filters = ["all", "china", "tariff", "steel", "semiconductor"];

  const filtered =
    filter === "all"
      ? articles
      : articles.filter((a) =>
          (a.title + " " + a.description).toLowerCase().includes(filter),
        );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_45%,_#000_80%)] px-4 py-10 text-zinc-50 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300 mb-1">
              TradeShield
            </p>
            <h1 className="text-2xl font-semibold">Tariff Intelligence Feed</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Live trade policy and tariff updates
            </p>
          </div>
          <Link
            href="/analysis"
            className="text-sm text-zinc-300 hover:text-zinc-100"
          >
            Back to workspace
          </Link>
        </header>

        <div className="flex gap-2 flex-wrap mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
                filter === f
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-400">
            Loading latest trade news...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            No articles found for this filter.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((article, i) => (
              <a
                key={i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-zinc-950/70 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500/40 transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    {article.source.name}
                  </span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(article.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-zinc-100 leading-snug mb-2">
                  {article.title}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                  {article.description}
                </p>
                <p className="text-xs text-emerald-400 mt-3">
                  Read full article
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
