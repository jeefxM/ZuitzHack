import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { CodexClient, type BountyFormData } from "@/lib/codexClient";
import { CreateBountyFormProps } from "@/lib/types";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useCreateBountyFlow, CONTRACTS } from "@/hooks/useBountyContract";

// Enhanced upload status interface
interface UploadStatus {
  isUploading: boolean;
  isUploaded: boolean;
  cid: string | null;
  error: string | null;
  requestId?: string;
}

interface TransactionStatus {
  step:
    | "idle"
    | "checking"
    | "approving"
    | "approved"
    | "creating"
    | "completed";
  error?: string;
  skipApproval?: boolean;
}

export default function CreateBountyForm({
  formData,
  handleInputChange,
  handleTagSelection,
  errors,
  isSubmitting,
  showSuccess,
  onSubmit,
  onBack,
}: CreateBountyFormProps) {
  const { address } = useAccount();

  // Use the enhanced bounty flow hook
  const {
    // Approval
    approveForBounty,
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveHash,
    approveReceiptError,

    // Creation
    createBounty,
    isCreatePending,
    isCreateConfirming,
    isCreateConfirmed,
    createBountyHash,
    createReceipt,
    createError,

    // Allowance
    currentAllowance,
    hasInsufficientAllowance,
    refetchAllowance,
  } = useCreateBountyFlow();

  // State for Codex upload
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    isUploading: false,
    isUploaded: false,
    cid: null,
    error: null,
  });

  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    step: "idle",
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: CONTRACTS.USDC,
  });

  // Copy CID to clipboard
  const copyCID = async () => {
    if (uploadStatus.cid) {
      try {
        await navigator.clipboard.writeText(uploadStatus.cid);
        console.log("✅ CID copied to clipboard");
      } catch (error) {
        console.error("❌ Failed to copy CID:", error);
      }
    }
  };

  // Handle approval success or skip
  useEffect(() => {
    if (txStatus.step === "approving") {
      if (txStatus.skipApproval) {
        // Skip approval, go straight to creation
        console.log("✅ Sufficient allowance exists, skipping approval");
        setTxStatus((prev) => ({ ...prev, step: "approved" }));

        // Auto-trigger bounty creation after short delay
        setTimeout(() => {
          if (uploadStatus.cid && formData.reward) {
            setTxStatus((prev) => ({ ...prev, step: "creating" }));
            createBounty(formData.reward, uploadStatus.cid);
          }
        }, 500);
      } else if (isApproveConfirmed) {
        console.log("✅ USDC approval confirmed");
        setTxStatus((prev) => ({ ...prev, step: "approved" }));

        // Refetch allowance to make sure it's updated
        refetchAllowance();

        // Auto-trigger bounty creation after short delay
        setTimeout(() => {
          if (uploadStatus.cid && formData.reward) {
            setTxStatus((prev) => ({ ...prev, step: "creating" }));
            createBounty(formData.reward, uploadStatus.cid);
          }
        }, 1000);
      }
    }
  }, [
    isApproveConfirmed,
    txStatus.step,
    txStatus.skipApproval,
    createBounty,
    uploadStatus.cid,
    formData.reward,
    refetchAllowance,
  ]);

  // Handle bounty creation success
  useEffect(() => {
    if (isCreateConfirmed && txStatus.step === "creating") {
      console.log("✅ Bounty created successfully!");

      // Try to extract bounty ID from logs
      let bountyId = "";
      if (createReceipt?.logs) {
        console.log("Transaction receipt:", createReceipt);
        // You could decode the BountyCreated event here to get the actual bounty ID
      }

      setTxStatus((prev) => ({
        ...prev,
        step: "completed",
      }));
    }
  }, [isCreateConfirmed, txStatus.step, createReceipt]);

  // Handle errors with better error messages
  useEffect(() => {
    if (approveReceiptError) {
      console.error("❌ Approval failed:", approveReceiptError);
      let errorMessage = "USDC approval failed. Please try again.";

      // Check if it's the transport error we've been seeing
      if (
        approveReceiptError.message?.includes("transports") ||
        approveReceiptError.message?.includes("transport")
      ) {
        errorMessage =
          "Network error while confirming approval. The transaction may have succeeded - please check your wallet and try creating the bounty again.";
      }

      setTxStatus((prev) => ({
        ...prev,
        step: "idle",
        error: errorMessage,
      }));
    }

    if (createError) {
      console.error("❌ Bounty creation failed:", createError);
      setTxStatus((prev) => ({
        ...prev,
        step: "idle",
        error: "Bounty creation failed. Please try again.",
      }));
    }
  }, [approveReceiptError, createError]);

  // Enhanced form submission handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    // Check USDC balance
    if (usdcBalance && formData.reward) {
      const rewardAmount = parseFloat(formData.reward) * 1e6; // Convert to USDC units (6 decimals)
      if (BigInt(rewardAmount) > usdcBalance.value) {
        alert("Insufficient USDC balance");
        return;
      }
    }

    // Reset statuses
    setUploadStatus({
      isUploading: false,
      isUploaded: false,
      cid: null,
      error: null,
    });
    setTxStatus({ step: "idle" });

    try {
      // Step 1: Upload metadata to Codex
      setUploadStatus((prev) => ({ ...prev, isUploading: true, error: null }));
      console.log("🚀 Starting bounty creation process...");

      const bountyDataForCodex: BountyFormData = {
        title: formData.title,
        description: formData.description,
        reward: formData.reward,
        deadline: formData.deadline,
        tags: formData.tags || [],
      };

      console.log("📋 Form data to upload:", bountyDataForCodex);

      const uploadResult = await CodexClient.uploadBountyMetadata(
        bountyDataForCodex
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      setUploadStatus({
        isUploading: false,
        isUploaded: true,
        cid: uploadResult.cid || null,
        error: null,
        requestId: uploadResult.requestId,
      });

      console.log("✅ Bounty metadata uploaded to Codex!");
      console.log("📋 CID:", uploadResult.cid);

      // Step 2: Check allowance and approve if needed
      setTxStatus({ step: "checking" });

      // Check if approval is needed
      const needsApproval = hasInsufficientAllowance(formData.reward);

      if (!needsApproval) {
        console.log(
          "✅ Sufficient allowance exists, proceeding to bounty creation"
        );
        setTxStatus({ step: "approving", skipApproval: true });
      } else {
        console.log("🔓 Insufficient allowance, requesting approval");
        setTxStatus({ step: "approving", skipApproval: false });

        // Use the enhanced approve function
        const approvalResult = await approveForBounty(formData.reward);

        if (!approvalResult.needsApproval) {
          // This shouldn't happen since we checked above, but just in case
          setTxStatus((prev) => ({ ...prev, skipApproval: true }));
        }
      }
    } catch (error) {
      console.error("❌ Bounty creation failed:", error);
      setUploadStatus({
        isUploading: false,
        isUploaded: false,
        cid: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setTxStatus({
        step: "idle",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const isProcessing =
    uploadStatus.isUploading ||
    txStatus.step === "checking" ||
    isApprovePending ||
    isApproveConfirming ||
    isCreatePending ||
    isCreateConfirming;
  const isCompleted = txStatus.step === "completed";

  // Helper function to get current allowance display
  const getCurrentAllowanceDisplay = () => {
    if (!currentAllowance) return "0";
    return formatUnits(currentAllowance, 6);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounties
      </Button>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Bounty
          </h1>

          {/* Success Alert */}
          {isCompleted && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Bounty Created Successfully! 🎉</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  Your bounty has been created and is now live on the
                  blockchain!
                </p>

                {uploadStatus.cid && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-mono bg-green-100 px-2 py-1 rounded border">
                      CID: {uploadStatus.cid}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyCID}
                      className="h-6 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                )}

                <div className="mt-3 space-y-1 text-xs">
                  {approveHash && (
                    <div className="flex items-center gap-2">
                      <span>Approval TX:</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${approveHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {createBountyHash && (
                    <div className="flex items-center gap-2">
                      <span>Bounty TX:</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${createBountyHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Alert */}
          {isProcessing && (
            <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle>
                {uploadStatus.isUploading && "Uploading to Codex"}
                {txStatus.step === "checking" && "Checking Allowance"}
                {txStatus.step === "approving" &&
                  !txStatus.skipApproval &&
                  "Step 1/2: Approving USDC"}
                {txStatus.step === "approving" &&
                  txStatus.skipApproval &&
                  "Step 1/2: Allowance OK"}
                {txStatus.step === "approved" && "Step 1/2: Approval Complete"}
                {txStatus.step === "creating" && "Step 2/2: Creating Bounty"}
              </AlertTitle>
              <AlertDescription>
                {uploadStatus.isUploading &&
                  "📤 Uploading metadata to Codex..."}
                {txStatus.step === "checking" &&
                  "🔍 Checking current USDC allowance..."}
                {txStatus.step === "approving" &&
                  !txStatus.skipApproval &&
                  "💰 Please approve USDC spending in your wallet..."}
                {txStatus.step === "approving" &&
                  txStatus.skipApproval &&
                  "✅ Sufficient allowance exists, proceeding..."}
                {txStatus.step === "approved" &&
                  "✅ USDC approved! Preparing bounty creation..."}
                {txStatus.step === "creating" &&
                  "🏗️ Please confirm bounty creation in your wallet..."}
                {(isApproveConfirming || isCreateConfirming) &&
                  "⏳ Waiting for confirmation..."}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {(uploadStatus.error || txStatus.error) && (
            <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {uploadStatus.error || txStatus.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Wallet Info */}
          {address && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <p>
                <strong>Wallet:</strong> {address.slice(0, 6)}...
                {address.slice(-4)}
              </p>
              {usdcBalance && (
                <p>
                  <strong>USDC Balance:</strong>{" "}
                  {formatUnits(usdcBalance.value, 6)} USDC
                </p>
              )}
              <p>
                <strong>Current Allowance:</strong>{" "}
                {getCurrentAllowanceDisplay()} USDC
              </p>
              {formData.reward && (
                <p
                  className={`text-xs ${
                    hasInsufficientAllowance(formData.reward)
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {hasInsufficientAllowance(formData.reward)
                    ? "⚠️ Approval needed for this reward amount"
                    : "✅ Sufficient allowance for this reward"}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="E.g., Develop Smart Contract for NFT Marketplace"
                className={errors?.title ? "border-red-300" : ""}
                disabled={isProcessing}
              />
              {errors?.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={6}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Provide a detailed description of the bounty requirements..."
                className={errors?.description ? "border-red-300" : ""}
                disabled={isProcessing}
              />
              {errors?.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Tip: Be specific about requirements, deliverables, and
                acceptance criteria.
              </p>
            </div>

            {/* Two column layout for reward and deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reward Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="reward"
                  className="text-sm font-medium text-gray-700"
                >
                  Reward (USDC) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    USDC
                  </span>
                  <Input
                    id="reward"
                    name="reward"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reward}
                    onChange={(e) =>
                      handleInputChange("reward", e.target.value)
                    }
                    className={`pl-14 ${
                      errors?.reward ? "border-red-300" : ""
                    }`}
                    placeholder="0.00"
                    disabled={isProcessing}
                  />
                </div>
                {errors?.reward && (
                  <p className="text-sm text-red-600 mt-1">{errors.reward}</p>
                )}
              </div>

              {/* Deadline Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="deadline"
                  className="text-sm font-medium text-gray-700"
                >
                  Deadline <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      handleInputChange("deadline", e.target.value)
                    }
                    className={errors?.deadline ? "border-red-300" : ""}
                    disabled={isProcessing}
                  />
                  <Calendar className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none h-4 w-4 text-gray-400" />
                </div>
                {errors?.deadline && (
                  <p className="text-sm text-red-600 mt-1">{errors.deadline}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing || isCompleted || !address}
              className="w-full md:w-auto flex items-center justify-center"
            >
              {!address ? (
                "Connect Wallet First"
              ) : isProcessing ? (
                <>
                  <svg
                    className="animate-spin mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {uploadStatus.isUploading && "Uploading to Codex..."}
                  {txStatus.step === "checking" && "Checking Allowance..."}
                  {txStatus.step === "approving" && "Processing Approval..."}
                  {txStatus.step === "creating" && "Creating Bounty..."}
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Bounty Created ✅
                </>
              ) : (
                "Create Bounty"
              )}
            </Button>

            {/* Info about the process */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>🔍 What happens when you click "Create Bounty":</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 space-y-1">
                <li>
                  1. Your bounty metadata gets uploaded to Codex decentralized
                  storage
                </li>
                <li>
                  2. We check your current USDC allowance for the bounty
                  contract
                </li>
                <li>
                  3. If needed, you approve USDC spending (1st transaction)
                </li>
                <li>
                  4. The bounty is created on-chain with your USDC locked as
                  reward (2nd transaction)
                </li>
                <li>5. Your bounty becomes visible to hunters immediately!</li>
              </ol>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
