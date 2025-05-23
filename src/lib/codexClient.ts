// lib/codexClient.ts
export interface BountyFormData {
  title: string;
  description: string;
  reward: string;
  deadline: string;
  creatorAddress?: string;
  tags?: string[];
}

export interface SubmissionFormData {
  title: string;
  description: string;
  submitterAddress?: string;
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
  // Codex API base URL - you can make this configurable
  private static readonly CODEX_API_URL = "http://127.0.0.1:8080/api/codex/v1";

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
        type: "bounty",
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
   * Upload submission metadata to Codex via dedicated Next.js API route
   */
  static async uploadSubmissionMetadata(
    formData: SubmissionFormData
  ): Promise<CodexUploadResponse> {
    try {
      console.log("📤 Client: Uploading submission metadata...");

      // Get submitter address from wallet if available
      let submitterAddress = formData.submitterAddress;
      if (
        !submitterAddress &&
        typeof window !== "undefined" &&
        window.ethereum
      ) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          submitterAddress = accounts[0] || undefined;
        } catch (error) {
          console.warn("Could not get wallet address:", error);
        }
      }

      const requestBody = {
        title: formData.title,
        description: formData.description,
        submitterAddress,
      };

      console.log("📋 Client: Submission request body:", requestBody);

      // Use the dedicated submission endpoint
      const response = await fetch("/api/codex/submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Submission upload failed");
      }

      console.log("✅ Client: Submission upload successful!");
      console.log("📋 Client: CID:", result.cid);
      console.log("📋 Client: Request ID:", result.requestId);

      return {
        success: true,
        cid: result.cid,
        requestId: result.requestId,
      };
    } catch (error) {
      console.error("❌ Client: Submission upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve submission metadata from Codex
   */
  static async retrieveSubmissionMetadata(
    cid: string
  ): Promise<CodexRetrieveResponse> {
    try {
      console.log("📥 Client: Retrieving submission for CID:", cid);

      const response = await fetch(
        `/api/codex/submission?cid=${encodeURIComponent(cid)}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to retrieve submission");
      }

      console.log("✅ Client: Submission retrieval successful!");
      return {
        success: true,
        metadata: result.submission,
      };
    } catch (error) {
      console.error("❌ Client: Submission retrieval failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generic upload method that can handle both bounties and submissions
   */
  static async uploadMetadata(
    data: BountyFormData | SubmissionFormData,
    type: "bounty" | "submission"
  ): Promise<CodexUploadResponse> {
    if (type === "bounty") {
      return this.uploadBountyMetadata(data as BountyFormData);
    } else {
      return this.uploadSubmissionMetadata(data as SubmissionFormData);
    }
  }

  /**
   * Retrieve bounty metadata from Codex directly or via Next.js API
   */
  static async retrieveBountyMetadata(
    cid: string
  ): Promise<CodexRetrieveResponse> {
    try {
      console.log("📥 Client: Retrieving metadata for CID:", cid);

      // Try direct Codex API first
      try {
        const directUrl = `${this.CODEX_API_URL}/data/${encodeURIComponent(
          cid
        )}`;
        console.log("🔗 Trying direct Codex API:", directUrl);

        const directResponse = await fetch(directUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log("✅ Direct Codex API successful!");

          return {
            success: true,
            metadata: data,
          };
        } else {
          console.warn(
            `⚠️ Direct Codex API failed: ${directResponse.status} ${directResponse.statusText}`
          );
        }
      } catch (directError) {
        console.warn("⚠️ Direct Codex API error:", directError);
      }

      // Fallback to Next.js API
      console.log("🔄 Falling back to Next.js API...");
      const fallbackResponse = await fetch(
        `/api/codex/upload?cid=${encodeURIComponent(cid)}`
      );

      const result: CodexRetrieveResponse = await fallbackResponse.json();

      if (!result.success) {
        throw new Error(result.error || "Retrieval failed");
      }

      console.log("✅ Client: Fallback retrieval successful!");
      return result;
    } catch (error) {
      console.error("❌ Client: All retrieval methods failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if CID is available directly from Codex
   */
  static async checkCIDAvailability(cid: string): Promise<boolean> {
    try {
      const directUrl = `${this.CODEX_API_URL}/data/${encodeURIComponent(cid)}`;

      const response = await fetch(directUrl, {
        method: "HEAD", // Just check if exists, don't download
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const isAvailable = response.ok;
      console.log(
        `🔍 CID ${cid} availability:`,
        isAvailable ? "✅ Available" : "❌ Not available"
      );

      return isAvailable;
    } catch (error) {
      console.warn(`❌ Error checking CID ${cid}:`, error);
      return false;
    }
  }

  /**
   * Get Codex node info/status
   */
  static async getCodexInfo(): Promise<{
    success: boolean;
    info?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.CODEX_API_URL}/info`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const info = await response.json();
      return { success: true, info };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if Codex node is available
   */
  static async checkCodexStatus(): Promise<boolean> {
    try {
      const result = await this.getCodexInfo();
      return result.success;
    } catch (error) {
      console.error("❌ Client: Status check failed:", error);
      return false;
    }
  }

  /**
   * Get the direct Codex URL for a CID (useful for debugging)
   */
  static getDirectCodexUrl(cid: string): string {
    return `${this.CODEX_API_URL}/data/${encodeURIComponent(cid)}`;
  }
}
