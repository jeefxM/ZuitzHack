// app/api/codex/submission/route.ts
import { NextRequest, NextResponse } from "next/server";

// Use the same environment variable as the working bounty endpoint
const CODEX_ENDPOINT =
  process.env.CODEX_ENDPOINT || "http://127.0.0.1:8080/api/codex/v1";

// Type definitions
interface SubmissionData {
  title: string;
  description: string;
  // bountyId: string | number;
  submitterAddress?: string;
}

interface CodexUploadResponse {
  success: boolean;
  cid?: string;
  error?: string;
  requestId?: string;
}

// POST handler for creating new submissions
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SubmissionData = await request.json();
    console.log("📥 Received submission request:", body);

    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: title, description, and bountyId are required",
        },
        { status: 400 }
      );
    }

    // Prepare metadata for Codex - following the same format that works for bounties
    const metadata = {
      type: "bounty_submission",
      title: body.title.trim(),
      description: body.description.trim(),

      submitterAddress:
        body.submitterAddress || "0x0000000000000000000000000000000000000000",
      submittedAt: new Date().toISOString(),
      // tags: [`bounty-${body.bountyId}`, "submission", "bounty-submission"],
      // Additional metadata that might be useful
      metadata: {
        version: "1.0",
        platform: "codex-bounty-platform",
        timestamp: Date.now(),
      },
    };

    console.log("📤 API: Uploading submission to Codex...");
    console.log("🔗 Codex URL:", `${CODEX_ENDPOINT}/data`);
    console.log("📋 Metadata:", JSON.stringify(metadata, null, 2));

    // Convert to JSON - same approach as working bounty upload
    const jsonData = JSON.stringify(metadata, null, 2);

    // Upload to Codex - using the same endpoint and approach as working bounty upload
    const uploadResponse = await fetch(`${CODEX_ENDPOINT}/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "content-disposition": "attachment; filename=submission_metadata.json",
      },
      body: jsonData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("❌ API: Codex upload failed:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Codex upload failed: ${uploadResponse.status}`,
        },
        { status: 500 }
      );
    }

    // Get CID from response - same as bounty upload
    const cid = await uploadResponse.text();
    console.log("✅ API: Submission uploaded successfully!");
    console.log("📋 API: CID:", cid);

    // Optional: Create storage request for persistence
    let requestId: string | undefined;
    try {
      requestId = await createStorageRequest(cid);
      console.log("✅ API: Storage request created:", requestId);
    } catch (storageError) {
      console.warn("⚠️ API: Storage request failed:", storageError);
      // Continue anyway - data is still available locally
    }

    // Return success response
    return NextResponse.json({
      success: true,
      cid,
      requestId,
      message: "Submission uploaded successfully",
      metadata: {
        // bountyId: body.bountyId,
        submittedAt: metadata.submittedAt,
      },
    });
  } catch (error) {
    console.error("❌ API route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to create storage request - copied from working bounty endpoint
async function createStorageRequest(cid: string): Promise<string> {
  const storageOptions = {
    duration: 2592000, // 30 days
    pricePerBytePerSecond: "1000000000000000",
    proofProbability: "0.1",
    nodes: 3,
    tolerance: 1,
    collateralPerByte: "2000000000000000000",
    expiry: 86400, // 24 hours
  };

  const response = await fetch(`${CODEX_ENDPOINT}/storage/request/${cid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify(storageOptions),
  });

  if (!response.ok) {
    throw new Error(`Storage request failed: ${response.status}`);
  }

  return await response.text();
}

// GET handler for retrieving submission
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        {
          success: false,
          error: "CID parameter is required",
        },
        { status: 400 }
      );
    }

    console.log("📥 Retrieving submission with CID:", cid);

    // Fetch from Codex - using the same approach as bounty endpoint
    // Try local node first
    let response = await fetch(`${CODEX_ENDPOINT}/data/${cid}`);

    if (!response.ok) {
      console.log("⚠️ API: Local fetch failed, trying network...");
      // Fallback to network retrieval
      response = await fetch(`${CODEX_ENDPOINT}/data/${cid}/network/stream`);
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to retrieve submission: ${response.status}`,
        },
        { status: 404 }
      );
    }

    const data = await response.json();

    // Verify this is a submission
    if (data.type !== "bounty_submission") {
      return NextResponse.json(
        {
          success: false,
          error: "CID does not correspond to a bounty submission",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: data,
    });
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to retrieve submission",
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
