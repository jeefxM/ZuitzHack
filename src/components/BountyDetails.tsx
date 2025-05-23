import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Tag,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  FileText,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusColor, formatDate, daysRemaining } from "@/lib/utils";
import { useAllBounties } from "@/hooks/useAllBounties";
import EnhancedSubmissionDetails from "./SubmissionDetails"; // Keep your existing import path

interface BountyDetailsProps {
  bountyId: number;
  onBack: () => void;
  onApply?: (bountyId: number) => void;
}

export default function BountyDetails({
  bountyId,
  onBack,
  onApply,
}: BountyDetailsProps) {
  const {
    bounties,
    isLoading,
    canViewSubmissionDetails,
    getUserSubmissionForBounty,
    getAllSubmissionsForBounty,
    isBountyCreator,
    refreshBountySubmissions,
  } = useAllBounties();

  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<{
    hunter: string;
    descriptionCID: string;
  } | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<
    Array<{
      hunter: string;
      descriptionCID: string;
    }>
  >([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Find the specific bounty
  const bounty = bounties.find((b) => b.id === bountyId);

  // Get submission status for current user
  const canViewDetails = canViewSubmissionDetails(bountyId);
  const userSubmission = getUserSubmissionForBounty(bountyId);
  const hasUserSubmitted = !!userSubmission;
  const isCreator = isBountyCreator(bountyId);

  console.log("Debug BountyDetails:", {
    bountyId,
    canViewDetails,
    userSubmission,
    hasUserSubmitted,
    isCreator,
    allSubmissions: allSubmissions.length,
  });

  // Auto-refresh submissions when component mounts
  useEffect(() => {
    if (bounty && !bounty.isLoadingSubmissions) {
      refreshBountySubmissions(bountyId);
    }
  }, [bountyId, bounty?.isLoadingSubmissions]);

  // Load all submissions if user is bounty creator
  useEffect(() => {
    if (isCreator && bounty && canViewDetails) {
      loadAllSubmissions();
    }
  }, [isCreator, bounty?.id, canViewDetails]);

  const loadAllSubmissions = async () => {
    if (!isCreator) return;

    setLoadingSubmissions(true);
    try {
      const submissions = await getAllSubmissionsForBounty(bountyId);
      setAllSubmissions(submissions);
      console.log(
        `Loaded ${submissions.length} submissions for bounty creator`
      );
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return {
          text: "Active",
          color: "bg-green-100 text-green-800",
          isOpen: true,
        };
      case 1:
        return {
          text: "Completed",
          color: "bg-blue-100 text-blue-800",
          isOpen: false,
        };
      case 2:
        return {
          text: "Cancelled",
          color: "bg-gray-100 text-gray-800",
          isOpen: false,
        };
      default:
        return {
          text: "Unknown",
          color: "bg-gray-100 text-gray-800",
          isOpen: false,
        };
    }
  };

  const formatCreatorAddress = (address: string) => {
    return `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return "No deadline set";
    try {
      const date = new Date(deadline);
      return formatDate(date.toISOString());
    } catch {
      return deadline; // Return as-is if not a valid date
    }
  };

  const calculateDaysRemaining = (deadline: string) => {
    if (!deadline) return "No deadline";
    try {
      const days = daysRemaining(deadline);
      return days > 0
        ? `${days} days left`
        : days === 0
        ? "Due today"
        : "Overdue";
    } catch {
      return "Invalid date";
    }
  };

  // Handle refreshing submission data
  const handleRefreshSubmissions = async () => {
    setIsRefreshing(true);
    try {
      await refreshBountySubmissions(bountyId);
      // If user is bounty creator, also refresh all submissions
      if (isCreator) {
        await loadAllSubmissions();
      }
    } catch (error) {
      console.error("Error refreshing submissions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle viewing submission details
  const handleViewSubmissionDetails = (submission?: {
    hunter: string;
    descriptionCID: string;
  }) => {
    if (isCreator && submission) {
      // Bounty creator viewing a specific submission
      console.log("Creator viewing submission:", submission);
      setSelectedSubmission(submission);
      setShowSubmissionDetails(true);
    } else if (hasUserSubmitted && userSubmission) {
      // Hunter viewing their own submission
      console.log("Hunter viewing own submission:", userSubmission);
      setSelectedSubmission(userSubmission);
      setShowSubmissionDetails(true);
    }
  };

  // If showing submission details, render that component
  if (showSubmissionDetails && selectedSubmission && bounty) {
    return (
      <EnhancedSubmissionDetails
        bountyId={bounty.id}
        bountyTitle={bounty.title}
        bountyReward={bounty.reward}
        bountyDescription={bounty.description}
        submission={selectedSubmission}
        onBack={() => {
          setShowSubmissionDetails(false);
          setSelectedSubmission(null);
        }}
        onPaymentComplete={() => {
          setShowSubmissionDetails(false);
          setSelectedSubmission(null);
          handleRefreshSubmissions();
        }}
      />
    );
  }

  // Show loading state while fetching bounties
  if (isLoading || !bounty) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounties
        </Button>

        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(bounty.status);

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounties
      </Button>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-8">
          {/* Status Badge */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={statusInfo.color}>{statusInfo.text}</Badge>
            {hasUserSubmitted && !isCreator && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                You Applied
              </Badge>
            )}
            {isCreator && (
              <Badge className="bg-blue-100 text-blue-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Your Bounty
              </Badge>
            )}
          </div>

          {/* Title and Reward */}
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {bounty.metadataError ? `Bounty #${bounty.id}` : bounty.title}
            </h1>
            <Badge className="px-4 py-2 text-lg font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
              {bounty.reward} USDC
            </Badge>
          </div>

          {/* Metadata Error Alert */}
          {bounty.metadataError && (
            <Alert className="mb-6 bg-orange-50 text-orange-800 border-orange-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load bounty metadata. Some details may be incomplete.
                <br />
                <span className="text-xs">CID: {bounty.metadataCID}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Bounty Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Creator</span>
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="bg-indigo-100 text-indigo-800 text-xs">
                    {bounty.creator.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-700">
                  {formatCreatorAddress(bounty.creator)}
                  {isCreator && (
                    <span className="ml-2 text-blue-600 font-medium">
                      (You)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Bounty ID</span>
              <div className="flex items-center">
                <Calendar className="text-gray-400 mr-2 h-4 w-4" />
                <span className="text-gray-700">#{bounty.id}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Deadline</span>
              <div className="flex items-center">
                <Clock className="text-gray-400 mr-2 h-4 w-4" />
                <span className="text-gray-700">
                  {formatDeadline(bounty?.deadline!)}
                  {bounty.deadline && (
                    <span className="text-indigo-600 ml-2 font-medium">
                      ({calculateDaysRemaining(bounty.deadline)})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Description
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl whitespace-pre-line text-gray-700">
              {bounty.description || "No description available"}
            </div>
          </div>

          {/* Tags */}
          {bounty.tags && bounty.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {bounty.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-100"
                  >
                    <Tag className="mr-1.5 h-4 w-4 text-gray-500" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Applications
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshSubmissions}
                disabled={
                  isRefreshing ||
                  bounty.isLoadingSubmissions ||
                  loadingSubmissions
                }
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isRefreshing || loadingSubmissions ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="text-indigo-600 mr-2 h-4 w-4" />
                  <span className="text-gray-700">
                    {bounty.isLoadingSubmissions ? (
                      <span className="animate-pulse">
                        Loading submissions...
                      </span>
                    ) : (
                      <>
                        <b>{bounty.applicants}</b> application
                        {bounty.applicants !== 1 && "s"} submitted
                      </>
                    )}
                  </span>
                </div>

                {hasUserSubmitted && !isCreator && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="font-medium">You have applied</span>
                  </div>
                )}
              </div>

              {/* Show submission list for bounty creators */}
              {isCreator && allSubmissions.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Submissions:</h4>
                  {loadingSubmissions ? (
                    <div className="animate-pulse space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allSubmissions.map((submission, index) => (
                        <div
                          key={`${submission.hunter}-${index}`}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-indigo-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-indigo-100 text-indigo-800 text-xs">
                                {submission.hunter.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {formatCreatorAddress(submission.hunter)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Hunter
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleViewSubmissionDetails(submission)
                            }
                            className="flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Show empty state for bounty creators with no submissions */}
              {isCreator &&
                allSubmissions.length === 0 &&
                !loadingSubmissions &&
                !bounty.isLoadingSubmissions && (
                  <div className="mt-4 text-center text-gray-500 py-4">
                    No submissions yet. Share your bounty to attract hunters!
                  </div>
                )}
            </div>
          </div>

          {/* Metadata CID */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Metadata
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Content ID (CID)</p>
                  <code className="text-xs bg-white px-2 py-1 rounded border text-gray-800">
                    {bounty.metadataCID}
                  </code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      `https://ipfs.io/ipfs/${bounty.metadataCID}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on IPFS
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            {statusInfo.isOpen && (
              <>
                {isCreator ? (
                  /* Bounty Creator Actions */
                  <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-lg inline-flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    You are the bounty creator - View submissions above
                  </div>
                ) : hasUserSubmitted ? (
                  /* Hunter who has submitted */
                  <>
                    {canViewDetails && (
                      <Button
                        onClick={() => handleViewSubmissionDetails()}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Your Submission
                      </Button>
                    )}

                    <div className="bg-green-50 text-green-700 px-6 py-3 rounded-lg inline-flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Already Applied - Application Submitted
                    </div>
                  </>
                ) : (
                  /* Hunter who hasn't submitted */
                  <Button
                    onClick={() => onApply?.(bountyId)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Apply for this Bounty
                  </Button>
                )}
              </>
            )}

            {!statusInfo.isOpen && (
              <div className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg inline-block">
                This bounty is {statusInfo.text.toLowerCase()} and no longer
                accepting applications
              </div>
            )}
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">
                Debug Info:
              </h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>Bounty ID: {bounty.id}</div>
                <div>Is Bounty Creator: {isCreator ? "Yes" : "No"}</div>
                <div>Has User Submitted: {hasUserSubmitted ? "Yes" : "No"}</div>
                <div>
                  Can View Submission Details: {canViewDetails ? "Yes" : "No"}
                </div>
                <div>
                  User Submission CID:{" "}
                  {userSubmission?.descriptionCID || "None"}
                </div>
                <div>All Submissions Count: {allSubmissions.length}</div>
                <div>
                  Loading Submissions:{" "}
                  {bounty.isLoadingSubmissions ? "Yes" : "No"}
                </div>
                <div>
                  Loading All Submissions: {loadingSubmissions ? "Yes" : "No"}
                </div>
                <div>Total Applicants: {bounty.applicants}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
