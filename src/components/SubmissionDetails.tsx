import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
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
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSimpleBountyMessaging } from "@/hooks/useWakuBountyMessaging";

interface EnhancedSubmissionDetailsProps {
  bountyId: number;
  bountyTitle: string;
  bountyReward: string;
  bountyDescription: string;
  submission: {
    hunter: string;
    descriptionCID: string;
    submittedAt?: string;
  };
  onBack: () => void;
  onPaymentComplete?: () => void;
}

export default function EnhancedSubmissionDetails({
  bountyId,
  bountyTitle,
  bountyReward,
  bountyDescription,
  submission,
  onBack,
  onPaymentComplete,
}: EnhancedSubmissionDetailsProps) {
  const { address } = useAccount();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Initialize Waku messaging (using the simplified version)
  const {
    messages,
    sendMessage,
    isConnected,
    isLoading: wakuLoading,
    error: wakuError,
  } = useSimpleBountyMessaging({
    bountyId,
    enabled: true,
  });

  // Helper function to format addresses
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper function to format dates
  const formatDate = (timestamp: number | string) => {
    const date =
      typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine if current user is bounty creator (for message styling)
  const isBountyCreator = (messageSender: string) => {
    // You'll need to pass bounty creator address as prop
    // For now, we'll use the current user
    return messageSender.toLowerCase() === address?.toLowerCase();
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(newMessage.trim(), "question");
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      // You might want to show a toast notification here
    } finally {
      setIsSending(false);
    }
  };

  // Auto-send application message when hunter submits
  useEffect(() => {
    if (
      isConnected &&
      submission.hunter.toLowerCase() === address?.toLowerCase()
    ) {
      // Auto-send application message
      const applicationMessage = `Hello! I've submitted my work for this bounty. Let me know if you have any questions!`;

      // Check if we already sent an application message
      const hasApplicationMessage = messages.some(
        (msg) =>
          msg.messageType === "application" &&
          msg.sender.toLowerCase() === address?.toLowerCase()
      );

      if (!hasApplicationMessage && messages.length === 0) {
        // Only send if this is the first time loading and no messages exist
        setTimeout(() => {
          sendMessage(applicationMessage, "application").catch(console.error);
        }, 1000); // Small delay to ensure connection is stable
      }
    }
  }, [isConnected, submission.hunter, address]);

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
          {/* Bounty Info Card */}
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
          </Card>

          {/* Waku Messages Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Messages</CardTitle>
                <div className="flex items-center gap-2">
                  {wakuLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {isConnected ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <Wifi className="h-4 w-4 mr-1" />
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 text-sm">
                      <WifiOff className="h-4 w-4 mr-1" />
                      Disconnected
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {wakuError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>{wakuError}</AlertDescription>
                </Alert>
              )}

              {/* Messages Display */}
              <div className="space-y-4 max-h-80 overflow-y-auto mb-4">
                {wakuLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="ml-2 text-gray-500">
                      Loading messages...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.sender}-${message.timestamp}-${index}`}
                      className={`flex ${
                        message.isFromCurrentUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.isFromCurrentUser
                            ? "bg-indigo-100 text-indigo-900"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <span className="font-medium">
                            {message.isFromCurrentUser
                              ? "You"
                              : formatAddress(message.sender)}
                          </span>
                          {message.messageType === "application" && (
                            <Badge variant="secondary" className="text-xs">
                              Application
                            </Badge>
                          )}
                          {message.messageType === "payment" && (
                            <Badge variant="default" className="text-xs">
                              Payment
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="resize-none"
                  disabled={!isConnected}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected || isSending}
                  className="flex-shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {!isConnected && (
                <p className="text-sm text-gray-500 mt-2">
                  Connecting to decentralized messaging network...
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with submission details */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Hunter:</span>
                  <span className="font-mono text-xs">
                    {formatAddress(submission.hunter)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reward:</span>
                  <span className="font-medium">{bountyReward} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
