import { NextRequest, NextResponse } from "next/server";

const CODEX_API_BASE = "http://127.0.0.1:8080/api/codex/v1/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        { error: "CID parameter is required" },
        { status: 400 }
      );
    }

    console.log(`📡 Fetching metadata for CID: ${cid}`);

    const response = await fetch(`${CODEX_API_BASE}/${cid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(
        `❌ Codex API error for ${cid}:`,
        response.status,
        response.statusText
      );
      return NextResponse.json(
        {
          error: `Failed to fetch metadata: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const metadata = await response.json();
    console.log(`✅ Successfully fetched metadata for ${cid}`);

    return NextResponse.json({
      success: true,
      data: metadata,
      cid: cid,
    });
  } catch (error) {
    console.error("❌ Error in getMetadata API route:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Server error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}
