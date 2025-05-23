// components/SubmitBountyForm.tsx
import { useState } from "react";
import { useAccount } from "wagmi";
import { useApplyForBounty } from "@/hooks/useSubmitToBounty";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface SubmitBountyFormProps {
  bounty: {
    id: number;
    title: string;
    reward: string;
    creator: string;
  };
  onBack: () => void;
}

export default function SubmitBountyForm({
  bounty,
  onBack,
}: SubmitBountyFormProps) {
  const { address } = useAccount();
  const { state, applyForBounty, reset } = useApplyForBounty();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Submission title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Submission description is required";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must confirm your submission";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validateForm()) return;

    try {
      await applyForBounty({
        title: formData.title,
        description: formData.description,
        bountyId: bounty.id,
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const handleBack = () => {
    reset();
    onBack();
  };

  const isProcessing =
    state.isUploading || state.isSubmitting || state.isConfirming;

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={handleBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounty
      </Button>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Submit Your Work
          </h1>
          <p className="text-gray-600 mb-6">
            Submit your completed work for: <strong>{bounty.title}</strong>
          </p>

          {/* Success Message */}
          {state.isSuccess && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Submission Successful! 🎉</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-2">
                  Your submission has been stored on Codex and submitted to the
                  smart contract.
                </p>
                {state.cid && (
                  <div className="mt-3">
                    <p className="text-sm">
                      <strong>Submission CID:</strong>
                    </p>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded border block mt-1">
                      {state.cid}
                    </code>
                  </div>
                )}
                {state.txHash && (
                  <div className="mt-3">
                    <p className="text-sm">
                      <strong>Transaction Hash:</strong>
                    </p>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded border block mt-1">
                      {state.txHash}
                    </code>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {state.error && (
            <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 text-blue-500 mr-2 animate-spin" />
                <AlertTitle>
                  {state.isUploading
                    ? "Uploading to Codex..."
                    : state.isSubmitting
                    ? "Submitting to Contract..."
                    : "Waiting for Confirmation..."}
                </AlertTitle>
              </div>
              <AlertDescription>
                {state.isUploading
                  ? "Your submission is being uploaded to Codex storage."
                  : state.isSubmitting
                  ? "Your submission is being recorded on the blockchain."
                  : "Waiting for the transaction to be confirmed."}
              </AlertDescription>
            </Alert>
          )}

          {/* Bounty Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Bounty Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Reward:</span>
                <span className="ml-2 font-medium">{bounty.reward} USDC</span>
              </div>
              <div>
                <span className="text-gray-500">Creator:</span>
                <span className="ml-2 font-mono text-xs">
                  {bounty.creator.slice(0, 6)}...{bounty.creator.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          {!state.isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-gray-700"
                >
                  <FileText className="inline h-4 w-4 mr-1" />
                  Submission Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., 'Smart Contract Implementation for NFT Marketplace'"
                  className={errors.title ? "border-red-300" : ""}
                  disabled={isProcessing}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  <FileText className="inline h-4 w-4 mr-1" />
                  Submission Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={8}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe your completed work, include:
• What you delivered
• How to access/test your work (links, instructions)
• Any relevant documentation
• Technical details or implementation notes"
                  className={errors.description ? "border-red-300" : ""}
                  disabled={isProcessing}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    handleInputChange("acceptTerms", !!checked)
                  }
                  disabled={isProcessing}
                  className={errors.acceptTerms ? "border-red-300" : ""}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I confirm this is my completed work
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    By submitting, you confirm that this work fulfills the
                    bounty requirements and is ready for review.
                  </p>
                  {errors.acceptTerms && (
                    <p className="text-xs text-red-600">{errors.acceptTerms}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isProcessing || !address}
                className="w-full md:w-auto"
              >
                {!address ? (
                  "Connect Wallet First"
                ) : isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {state.isUploading
                      ? "Uploading to Codex..."
                      : state.isSubmitting
                      ? "Submitting to Contract..."
                      : "Waiting for Confirmation..."}
                  </>
                ) : (
                  "Submit Work"
                )}
              </Button>
            </form>
          )}

          {/* Success Navigation */}
          {state.isSuccess && (
            <div className="text-center">
              <Button onClick={handleBack} variant="outline">
                Back to Bounty
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
