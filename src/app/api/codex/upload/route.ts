// app/api/codex/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

// Types
interface BountyMetadata {
  title: string;
  description: string;
  reward: string;
  deadline: string;
  createdAt: string;
  createdBy?: string;
  status: string;
  version: string;
  format: string;
  metadata: {
    platform: string;
    network: string;
    tags?: string[];
  };
}

interface UploadResponse {
  success: boolean;
  cid?: string;
  error?: string;
  requestId?: string;
}

// Codex configuration
const CODEX_ENDPOINT =
  process.env.CODEX_ENDPOINT || "http://127.0.0.1:8080/api/codex/v1";

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  try {
    console.log("📤 API: Starting Codex upload...");

    // Parse request body
    const body = await request.json();
    const { title, description, reward, deadline, creatorAddress, tags } = body;

    // Validate required fields
    if (!title || !description || !reward || !deadline) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create metadata object
    const metadata: BountyMetadata = {
      title,
      description,
      reward,
      deadline,
      createdAt: new Date().toISOString(),
      createdBy: creatorAddress || null,
      status: "open",
      version: "1.0",
      format: "zuitzerland-bounty-v1",
      metadata: {
        platform: "Zuitzerland DAO",
        network: "Base",
        tags: tags || [],
      },
    };

    console.log("📋 API: Metadata to upload:", metadata);

    // Convert to JSON
    const jsonData = JSON.stringify(metadata, null, 2);

    // Upload to Codex
    const uploadResponse = await fetch(`${CODEX_ENDPOINT}/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "content-disposition": "attachment; filename=bounty_metadata.json",
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

    const cid = await uploadResponse.text();
    console.log("✅ API: Metadata uploaded successfully!");
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

    return NextResponse.json({
      success: true,
      cid,
      requestId,
    });
  } catch (error) {
    console.error("❌ API: Upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to create storage request
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

// GET endpoint to retrieve bounty metadata
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get("cid");

    if (!cid) {
      return NextResponse.json(
        { success: false, error: "CID parameter required" },
        { status: 400 }
      );
    }

    console.log("📥 API: Retrieving metadata for CID:", cid);

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
          error: `Failed to retrieve metadata: ${response.status}`,
        },
        { status: 404 }
      );
    }

    const metadata = await response.json();
    console.log("✅ API: Retrieved metadata:", metadata);

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error("❌ API: Retrieval failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
