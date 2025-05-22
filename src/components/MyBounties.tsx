import { useState, useEffect } from "react";
import {
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Send,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { BountyABI } from "@/lib/BountyABI";

// You'll need to add your contract ABI and address
const CONTRACT_ADDRESS = "";
const CONTRACT_ABI = BountyABI; // Add your contract ABI here

interface Bounty {
  id: bigint;
  creator: string;
  amount: bigint;
  status: number; // 0: Active, 1: Completed, 2: Cancelled
  metadataCID: string;
  deadline: bigint;
  hunter: string;
  createdAt: bigint;
}

interface Submission {
  id: string;
  bountyId: string;
  hunter: string;
  submissionCID: string;
  submittedAt: number;
  message: string;
}

export default function MyBounties() {
  const { address } = useAccount();
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [paymentAddress, setPaymentAddress] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showSubmissions, setShowSubmissions] = useState(false);

  // Read user's bounties
  const { data: userBountyIds, refetch: refetchBountyIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getBountiesByCreator",
    args: [address],
  });

  // Get all bounties to filter user's bounties
  const { data: allBounties, refetch: refetchBounties } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAllBounties",
  });

  // Write contract for paying hunters
  const {
    writeContract,
    data: payHash,
    isPending: isPayPending,
  } = useWriteContract();

  // Wait for payment transaction
  const { isLoading: isPayConfirming, isSuccess: isPaySuccess } =
    useWaitForTransactionReceipt({
      hash: payHash,
    });

  // Filter user's bounties
  const userBounties =
    allBounties?.filter((bounty: Bounty) =>
      userBountyIds?.includes(bounty.id)
    ) || [];

  // Categorize bounties
  const activeBounties = userBounties.filter(
    (bounty: Bounty) => bounty.status === 0
  );
  const completedBounties = userBounties.filter(
    (bounty: Bounty) => bounty.status === 1
  );
  const cancelledBounties = userBounties.filter(
    (bounty: Bounty) => bounty.status === 2
  );

  // Handle payment
  const handlePayHunter = async () => {
    if (!selectedBounty || !paymentAddress) return;

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "payHunter",
        args: [selectedBounty.id, paymentAddress],
      });
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  // Load submissions (this would typically come from IPFS or a backend service)
  const loadSubmissions = async (bountyId: string) => {
    // Placeholder for loading submissions
    // In a real implementation, you'd fetch this from IPFS or your backend
    const mockSubmissions: Submission[] = [
      {
        id: "1",
        bountyId,
        hunter: "0x742d35Cc6489C532bF62E2A40D5dd8C63Cd99E75",
        submissionCID: "QmExampleCID1",
        submittedAt: Date.now() - 86400000, // 1 day ago
        message:
          "Completed the task as requested. Please review the attached files.",
      },
      {
        id: "2",
        bountyId,
        hunter: "0x8ba1f109551bD432803012645Hac136c2f88AC62",
        submissionCID: "QmExampleCID2",
        submittedAt: Date.now() - 43200000, // 12 hours ago
        message: "Here's my solution with additional optimizations.",
      },
    ];

    setSubmissions(mockSubmissions);
  };

  // Refresh data when payment is successful
  useEffect(() => {
    if (isPaySuccess) {
      refetchBounties();
      refetchBountyIds();
      setShowPaymentDialog(false);
      setPaymentAddress("");
      setSelectedBounty(null);
    }
  }, [isPaySuccess, refetchBounties, refetchBountyIds]);

  const formatAmount = (amount: bigint) => {
    return `$${(Number(amount) / 1e6).toLocaleString()}`; // Assuming USDC with 6 decimals
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 1:
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 2:
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const BountyCard = ({ bounty }: { bounty: Bounty }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Bounty #{bounty.id.toString()}
            </CardTitle>
            <p className="text-gray-600 text-sm mt-1">
              Created {formatDate(bounty.createdAt)}
            </p>
          </div>
          <div className="text-right">
            {getStatusBadge(bounty.status)}
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {formatAmount(bounty.amount)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="mr-2 h-4 w-4" />
            {bounty.deadline > 0
              ? `Deadline: ${formatDate(bounty.deadline)}`
              : "No deadline"}
          </div>

          {bounty.status === 1 &&
            bounty.hunter !== "0x0000000000000000000000000000000000000000" && (
              <div className="flex items-center text-sm text-gray-600">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                Paid to: {bounty.hunter.slice(0, 6)}...{bounty.hunter.slice(-4)}
              </div>
            )}

          <div className="flex items-center justify-between">
            <a
              href={`https://ipfs.io/ipfs/${bounty.metadataCID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              View Details
            </a>

            {bounty.status === 0 && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedBounty(bounty);
                    loadSubmissions(bounty.id.toString());
                    setShowSubmissions(true);
                  }}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View Submissions
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedBounty(bounty);
                    setShowPaymentDialog(true);
                  }}
                >
                  <Send className="mr-1 h-4 w-4" />
                  Pay Hunter
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Bounties</h1>
        <p className="text-gray-600 mt-2">
          Manage your created bounties and pay hunters for completed work
        </p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({activeBounties.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedBounties.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledBounties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeBounties.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No active bounties
              </h3>
              <p className="mt-2 text-gray-600">
                Create your first bounty to get started.
              </p>
            </div>
          ) : (
            activeBounties.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedBounties.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No completed bounties
              </h3>
              <p className="mt-2 text-gray-600">
                Completed bounties will appear here.
              </p>
            </div>
          ) : (
            completedBounties.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledBounties.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No cancelled bounties
              </h3>
              <p className="mt-2 text-gray-600">
                Cancelled bounties will appear here.
              </p>
            </div>
          ) : (
            cancelledBounties.map((bounty) => (
              <BountyCard key={bounty.id.toString()} bounty={bounty} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Hunter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Bounty #{selectedBounty?.id.toString()} -{" "}
                {formatAmount(selectedBounty?.amount || 0n)}
              </p>
              <Input
                placeholder="Hunter wallet address (0x...)"
                value={paymentAddress}
                onChange={(e) => setPaymentAddress(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayHunter}
                disabled={!paymentAddress || isPayPending || isPayConfirming}
              >
                {isPayPending || isPayConfirming
                  ? "Processing..."
                  : "Pay Hunter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissions} onOpenChange={setShowSubmissions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Submissions for Bounty #{selectedBounty?.id.toString()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-gray-600">No submissions yet</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">
                          {submission.hunter.slice(0, 6)}...
                          {submission.hunter.slice(-4)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            submission.submittedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setPaymentAddress(submission.hunter);
                          setShowSubmissions(false);
                          setShowPaymentDialog(true);
                        }}
                      >
                        Pay This Hunter
                      </Button>
                    </div>
                    <p className="text-gray-700 mb-2">{submission.message}</p>
                    <a
                      href={`https://ipfs.io/ipfs/${submission.submissionCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      <ExternalLink className="mr-1 h-4 w-4" />
                      View Submission
                    </a>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
