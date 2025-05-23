import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useAccount } from "wagmi";
import { useMyBounties } from "@/hooks/useMyBounties";
import { get } from "http";
import SubmissionDetails from "./SubmissionDetails";
// These would normally be imported from your project
// import { useMyBounties } from "@/hooks/useMyBounties";
// import { useAccount } from "wagmi";
// import { formatDate, daysRemaining } from "@/lib/utils";

// Mock functions for demonstration
const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const daysRemaining = (deadline) => {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const diff = deadlineTime - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

interface MyBountiesProps {
  onBack: () => void;
  onCreateBounty: () => void;
  onViewDetails: (id: number) => void;
}

interface Submission {
  hunter: string;
  descriptionCID: string;
  submittedAt?: string;
}

export default function MyBounties({
  onBack,
  onCreateBounty,
  onViewDetails,
}: MyBountiesProps) {
  const { address } = useAccount();
  const {
    myBounties,
    myBountyStats,
    isLoading,
    error,
    handleCancelBounty,
    isCancelPending,
    isCancelConfirming,
    isCancelConfirmed,
    cancelHash,
    cancelError,
    getBountySubmissions,
  } = useMyBounties();

  // State for viewing and managing submissions
  const [cancellingBountyId, setCancellingBountyId] = useState<number | null>(
    null
  );
  const [expandedBounties, setExpandedBounties] = useState<Set<number>>(
    new Set()
  );
  const [loadingSubmissions, setLoadingSubmissions] = useState<Set<number>>(
    new Set()
  );
  const [bountySubmissions, setBountySubmissions] = useState<
    Record<number, Submission[]>
  >({});

  // State to track the selected submission for viewing details
  const [selectedSubmission, setSelectedSubmission] = useState<{
    bountyId: number;
    bountyTitle: string;
    bountyReward: string;
    submission: Submission;
    bountyDescription: string;
  } | null>(null);

  const toggleBountyExpansion = async (bountyId: number) => {
    const newExpanded = new Set(expandedBounties);

    if (expandedBounties.has(bountyId)) {
      newExpanded.delete(bountyId);
    } else {
      newExpanded.add(bountyId);

      // Load submissions if we haven't already
      if (!bountySubmissions[bountyId] && getBountySubmissions) {
        setLoadingSubmissions((prev) => new Set(prev).add(bountyId));
        try {
          const submissions = await getBountySubmissions(bountyId);
          setBountySubmissions((prev) => ({
            ...prev,
            [bountyId]: submissions,
          }));
        } catch (error) {
          console.error("Failed to load submissions:", error);
        } finally {
          setLoadingSubmissions((prev) => {
            const next = new Set(prev);
            next.delete(bountyId);
            return next;
          });
        }
      }
    }

    setExpandedBounties(newExpanded);
  };

  // Function to view submission details
  const handleViewSubmission = (
    bountyId: number,
    bountyTitle: string,
    bountyReward: string,
    submission: Submission,
    bountyDescription: string
  ) => {
    console.log("Opening submission with CID:", submission.descriptionCID);
    setSelectedSubmission({
      bountyId,
      bountyTitle,
      bountyReward,
      submission,
      bountyDescription,
    });
  };

  // Function to go back from submission details
  const handleBackFromSubmission = () => {
    setSelectedSubmission(null);
  };

  // Function to refresh data after payment
  const handlePaymentComplete = async () => {
    // Refresh bounty data or submissions as needed
    if (selectedSubmission && getBountySubmissions) {
      const submissions = await getBountySubmissions(
        selectedSubmission.bountyId
      );
      setBountySubmissions((prev) => ({
        ...prev,
        [selectedSubmission.bountyId]: submissions,
      }));
    }

    // Go back to the main view
    handleBackFromSubmission();
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 1:
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 2:
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatIPFSLink = (cid: string) => {
    return `https://ipfs.io/ipfs/${cid}`;
  };

  const handleCancelClick = async (bountyId: number) => {
    setCancellingBountyId(bountyId);
    try {
      await handleCancelBounty(bountyId);
    } catch (error) {
      console.error("Failed to cancel bounty:", error);
    } finally {
      setCancellingBountyId(null);
    }
  };

  // If a submission is selected, show the SubmissionDetails component
  if (selectedSubmission) {
    return (
      <SubmissionDetails
        bountyId={selectedSubmission.bountyId}
        bountyTitle={selectedSubmission.bountyTitle}
        bountyReward={selectedSubmission.bountyReward}
        bountyDescription={selectedSubmission.bountyDescription}
        submission={selectedSubmission.submission}
        onBack={handleBackFromSubmission}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  if (!address) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounties
        </Button>

        <Card className="text-center py-16">
          <CardContent>
            <p className="text-gray-600 text-lg">
              Please connect your wallet to view your bounties.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounties
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bounties</h1>
          <p className="text-gray-600 mt-1">
            Manage your created bounties and submissions
          </p>
        </div>
        <Button onClick={onCreateBounty} className="flex items-center">
          <Plus className="mr-2 h-4 w-4" />
          Create New Bounty
        </Button>
      </div>

      {/* Success Alert for Cancellation */}
      {isCancelConfirmed && (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Bounty Cancelled Successfully!</AlertTitle>
          <AlertDescription>
            Your bounty has been cancelled and the USDC has been refunded to
            your wallet.
            {cancelHash && (
              <div className="mt-2">
                <a
                  href={`https://sepolia.basescan.org/tx/${cancelHash}`}
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
      )}

      {/* Error Alert */}
      {cancelError && (
        <Alert className="mb-6 bg-red-50 text-red-800 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>Operation Failed</AlertTitle>
          <AlertDescription>
            {cancelError?.message ||
              "Failed to perform operation. Please try again."}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="text-center py-16">
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600">Loading your bounties...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {!isLoading && myBounties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Bounties</p>
                  <p className="text-xl font-bold text-gray-900">
                    {myBountyStats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-xl font-bold text-green-600">
                    {myBountyStats.active}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-xl font-bold text-purple-600">
                    {myBountyStats.totalSubmissions || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-indigo-600">
                  {myBountyStats.totalValue.toFixed(2)} USDC
                </p>
                <p className="text-xs text-gray-500">
                  {myBountyStats.activeValue.toFixed(2)} USDC locked
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && myBounties.length === 0 && (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-gray-600 text-lg mb-4">
              You haven't created any bounties yet.
            </p>
            <Button
              onClick={onCreateBounty}
              className="flex items-center mx-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Bounty
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bounties List */}
      {!isLoading && myBounties.length > 0 && (
        <div className="space-y-4">
          {myBounties.map((bounty) => (
            <Card key={bounty.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(bounty.status)}
                      {bounty.submissionCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          {bounty.submissionCount} submission
                          {bounty.submissionCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {bounty.metadataError
                        ? `Bounty #${bounty.id}`
                        : bounty.title}
                    </h3>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800 ml-4">
                    {bounty.reward} USDC
                  </Badge>
                </div>

                <p className="text-gray-600 mb-4">
                  {bounty.metadataError ? (
                    <span className="text-red-500 text-sm">
                      Failed to load metadata
                    </span>
                  ) : (
                    bounty.description
                  )}
                </p>

                {bounty.tags && bounty.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {bounty.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {bounty.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {daysRemaining(bounty.deadline) > 0
                          ? `${daysRemaining(bounty.deadline)} days left`
                          : "Deadline passed"}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {formatDate(bounty?.createdAt! || new Date())}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {bounty.submissionCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBountyExpansion(bounty.id)}
                        className="gap-1"
                      >
                        {expandedBounties.has(bounty.id) ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Hide Submissions
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            View Submissions
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(bounty.id)}
                    >
                      Check Bounty
                    </Button>

                    {bounty.status === 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={
                              isCancelPending &&
                              cancellingBountyId === bounty.id
                            }
                          >
                            {(isCancelPending || isCancelConfirming) &&
                            cancellingBountyId === bounty.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Bounty</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel this bounty? This
                              will refund the {bounty.reward} USDC to your
                              wallet and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Bounty</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelClick(bounty.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Yes, Cancel Bounty
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {/* Submissions Section */}
                {expandedBounties.has(bounty.id) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Submissions ({bountySubmissions[bounty.id]?.length || 0})
                    </h4>

                    {loadingSubmissions.has(bounty.id) ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bountySubmissions[bounty.id]?.length > 0 ? (
                          bountySubmissions[bounty.id].map(
                            (submission, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="bg-indigo-100 rounded-full p-2">
                                    <User className="h-4 w-4 text-indigo-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {formatAddress(submission.hunter)}
                                    </p>
                                    <a
                                      href={formatIPFSLink(
                                        submission.descriptionCID
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                      View Submission{" "}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>

                                {bounty.status === 0 && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleViewSubmission(
                                          bounty.id,
                                          bounty.title ||
                                            `Bounty #${bounty.id}`,
                                          bounty.reward,
                                          submission,
                                          bounty.description || ""
                                        )
                                      }
                                    >
                                      View Details
                                    </Button>

                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleViewSubmission(
                                          bounty.id,
                                          bounty.title ||
                                            `Bounty #${bounty.id}`,
                                          bounty.reward,
                                          submission,
                                          bounty.description || ""
                                        )
                                      }
                                    >
                                      Pay Hunter
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-center py-8 text-gray-500">
                            No submissions yet
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
