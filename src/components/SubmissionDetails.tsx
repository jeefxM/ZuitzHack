// components/SubmissionDetails.tsx
import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  ExternalLink,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CodexClient } from "@/lib/codexClient";

// Contract address for paying hunters
const CONTRACT_ADDRESS = "0xCbcBF569D75B9C00B2469857c66767bA833FC641";

// ABI for the payHunter function
const PAY_HUNTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_bountyId", type: "uint256" },
      { internalType: "address", name: "_hunter", type: "address" },
    ],
    name: "payHunter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Mock function for fetching submission metadata from Codex
const fetchSubmissionMetadata = async (cid: string) => {
  try {
    console.log("Fetching metadata for CID:", cid);

    // In a real implementation, this would use CodexClient to fetch the data
    // For now, we'll simulate a delay and return mock data
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      title: "Implementation of Smart Contract Features",
      description:
        "I've completed the requested features for the bounty:\n\n- Added support for ERC-721 tokens\n- Implemented royalty distribution mechanism\n- Created unit tests for all functionality\n- Deployed to Sepolia testnet for verification\n\nAll code is available in the GitHub repository: https://github.com/user/repo\n\nLooking forward to your feedback!",
      submittedAt: new Date().toISOString(),
      files: [
        {
          name: "implementation.sol",
          url: "https://github.com/user/repo/blob/main/implementation.sol",
        },
        {
          name: "tests.js",
          url: "https://github.com/user/repo/blob/main/tests.js",
        },
      ],
    };

    // In a real implementation, you would fetch the actual data from Codex:
    // return await CodexClient.getSubmissionMetadata(cid);
  } catch (error) {
    console.error("Error fetching submission metadata:", error);
    throw error;
  }
};

// Mock function for formatting dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Message interface
interface Message {
  id: string;
  sender: "hunter" | "creator";
  text: string;
  timestamp: string;
}

interface SubmissionDetailsProps {
  bountyId: number;
  bountyTitle: string;
  bountyReward: string;
  bountyDescription: string; // Added bounty description
  submission: {
    hunter: string; // Hunter's address
    descriptionCID: string; // CID containing submission details
    submittedAt?: string; // When the submission was made
  };
  onBack: () => void;
  onPaymentComplete?: () => void;
}

export default function SubmissionDetails({
  bountyId,
  bountyTitle,
  bountyReward,
  bountyDescription,
  submission,
  onBack,
  onPaymentComplete,
}: SubmissionDetailsProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  // Payment state
  const [paymentState, setPaymentState] = useState({
    isPending: false,
    isSuccess: false,
    error: null as string | null,
    txHash: null as string | null,
  });

  // Messages state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "hunter",
      text: "Hello! I've submitted my work for this bounty. Let me know if you have any questions!",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Contract interaction hooks
  const { writeContractAsync } = useWriteContract();
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: paymentTxHash as `0x${string}`,
  });

  const fetchSubmissionMetadata = async () => {
    if (!submission.descriptionCID) {
      setError("No CID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`📡 Fetching metadata for CID: ${submission.descriptionCID}`);

      const response = await fetch(
        `/api/codex/getMetadata?cid=${submission.descriptionCID}`
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch metadata");
      }

      console.log(
        `✅ Successfully fetched metadata for ${submission.descriptionCID}:`,
        result.data
      );
      setMetadata(result.data);
    } catch (err) {
      console.error(
        `❌ Error fetching metadata for ${submission.descriptionCID}:`,
        err
      );
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionMetadata();
  }, [submission.descriptionCID]);

  console.log("metadata", metadata);

  // Handle payment transaction success
  useEffect(() => {
    if (isConfirmed && paymentTxHash) {
      setPaymentState({
        isPending: false,
        isSuccess: true,
        error: null,
        txHash: paymentTxHash,
      });

      // Call the callback if provided
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    }
  }, [isConfirmed, paymentTxHash, onPaymentComplete]);

  // Handle payment errors
  useEffect(() => {
    if (txError) {
      setPaymentState((prev) => ({
        ...prev,
        isPending: false,
        error: txError.message || "Transaction failed",
      }));
    }
  }, [txError]);

  const handlePayHunter = async () => {
    if (!address) {
      setPaymentState((prev) => ({
        ...prev,
        error: "Please connect your wallet",
      }));
      return;
    }

    try {
      setPaymentState({
        isPending: true,
        isSuccess: false,
        error: null,
        txHash: null,
      });

      console.log("Paying hunter for bounty:", {
        bountyId,
        hunterAddress: submission.hunter,
        contractAddress: CONTRACT_ADDRESS,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PAY_HUNTER_ABI,
        functionName: "payHunter",
        args: [BigInt(bountyId), submission.hunter as `0x${string}`],
      });

      setPaymentTxHash(hash);

      // Add a system message about payment
      const systemMsg: Message = {
        id: Date.now().toString(),
        sender: "creator",
        text: `Payment initiated with transaction: ${hash}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, systemMsg]);
    } catch (error) {
      console.error("Error paying hunter:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      setPaymentState((prev) => ({
        ...prev,
        isPending: false,
        error: errorMessage,
      }));
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: "creator",
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  // Helper function to format addresses
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounty
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main submission details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="mb-2">{`Bounty #${bountyId}`}</Badge>
                  <CardTitle className="text-2xl">{bountyTitle}</CardTitle>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800">
                  {bountyReward} USDC
                </Badge>
              </div>
              {bountyDescription && (
                <p className="text-gray-600 mt-2 text-sm">
                  {bountyDescription}
                </p>
              )}
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 rounded-full p-2.5">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">Submitted by</p>
                      <p className="text-gray-600">
                        {formatAddress(submission.hunter)}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {submission.submittedAt
                        ? formatDate(metadata.submittedAt)
                        : metadata?.submittedAt
                        ? formatDate(metadata.submittedAt)
                        : "Unknown date"}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {submissionData?.title || "Submission"}
                    </h3>

                    <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                      {metadata?.description || "No description provided."}
                    </div>
                  </div>

                  {submissionData?.files && submissionData.files.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Files & Resources</h4>
                      <div className="space-y-2">
                        {submissionData.files.map(
                          (file: any, index: number) => (
                            <div key={index} className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-500" />
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                              >
                                {file.name}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "creator"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === "creator"
                          ? "bg-indigo-100 text-indigo-900"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="text-sm mb-1">
                        {message.sender === "creator" ? "You" : "Hunter"}
                      </div>
                      <p>{message.text}</p>
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {paymentState.isSuccess ? (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Payment Successful!</AlertTitle>
                  <AlertDescription>
                    You have successfully paid this hunter.
                    {paymentState.txHash && (
                      <div className="mt-2">
                        <a
                          href={`https://sepolia.basescan.org/tx/${paymentState.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Transaction <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={paymentState.isPending || isConfirming}
                    >
                      {paymentState.isPending || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Pay Hunter
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Pay Hunter</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to pay this hunter {bountyReward}{" "}
                        USDC for their submission? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePayHunter}>
                        Confirm Payment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {paymentState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Failed</AlertTitle>
                  <AlertDescription>{paymentState.error}</AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Submission Details</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bounty ID:</span>
                    <span className="font-medium">{bountyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hunter:</span>
                    <span className="font-mono">
                      {formatAddress(submission.hunter)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reward:</span>
                    <span className="font-medium">{bountyReward} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Submission CID:</span>
                    <span
                      className="font-mono text-xs truncate max-w-[150px]"
                      title={submission.descriptionCID}
                    >
                      {submission.descriptionCID}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Hunter Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-mono text-xs break-all">
                    {submission.hunter}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    window.open(
                      `https://sepolia.basescan.org/address/${submission.hunter}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View on Basescan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
