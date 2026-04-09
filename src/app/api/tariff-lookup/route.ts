import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hts = searchParams.get("hts")?.replace(/\./g, "") ?? "";

  if (!hts) {
    return NextResponse.json({ error: "HTS code required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://hts.usitc.gov/reststop/api/details/htscode/${hts}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}