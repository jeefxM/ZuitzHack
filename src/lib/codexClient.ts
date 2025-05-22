// lib/codexClient.ts
export interface BountyFormData {
  title: string;
  description: string;
  reward: string;
  deadline: string;
  creatorAddress?: string;
  tags?: string[];
}

export interface CodexUploadResponse {
  success: boolean;
  cid?: string;
  error?: string;
  requestId?: string;
}

export interface CodexRetrieveResponse {
  success: boolean;
  metadata?: any;
  error?: string;
}

export class CodexClient {
  /**
   * Upload bounty metadata to Codex via Next.js API
   */
  static async uploadBountyMetadata(
    formData: BountyFormData
  ): Promise<CodexUploadResponse> {
    try {
      console.log("📤 Client: Uploading bounty metadata...");

      // Get creator address from wallet if available
      let creatorAddress = formData.creatorAddress;
      if (!creatorAddress && typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          creatorAddress = accounts[0] || undefined;
        } catch (error) {
          console.warn("Could not get wallet address:", error);
        }
      }

      const requestBody = {
        title: formData.title,
        description: formData.description,
        reward: formData.reward,
        deadline: formData.deadline,
        creatorAddress,
        tags: formData.tags || [],
      };

      console.log("📋 Client: Request body:", requestBody);

      const response = await fetch("/api/codex/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result: CodexUploadResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      console.log("✅ Client: Upload successful!");
      console.log("📋 Client: CID:", result.cid);

      return result;
    } catch (error) {
      console.error("❌ Client: Upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve bounty metadata from Codex via Next.js API
   */
  static async retrieveBountyMetadata(
    cid: string
  ): Promise<CodexRetrieveResponse> {
    try {
      console.log("📥 Client: Retrieving metadata for CID:", cid);

      const response = await fetch(
        `/api/codex/upload?cid=${encodeURIComponent(cid)}`
      );
      const result: CodexRetrieveResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Retrieval failed");
      }

      console.log("✅ Client: Retrieval successful!");
      return result;
    } catch (error) {
      console.error("❌ Client: Retrieval failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if Codex is available via Next.js API
   */
  static async checkCodexStatus(): Promise<boolean> {
    try {
      // We can add a health check endpoint later if needed
      // For now, we'll assume it's available
      return true;
    } catch (error) {
      console.error("❌ Client: Status check failed:", error);
      return false;
    }
  }
}
