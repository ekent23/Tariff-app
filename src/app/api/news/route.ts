import { NextResponse } from "next/server";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function GET() {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=tariff+trade+import+duty&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}