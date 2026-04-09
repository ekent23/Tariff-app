import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${BACKEND_URL}/analyze-csv`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: text || "CSV analysis failed" },
        { status: response.status },
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    const message = error instanceof Error ? error.message : "fetch failed";
    return NextResponse.json(
      { error: "fetch failed", detail: message },
      { status: 500 },
    );
  }
}
