import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, FileText } from "lucide-react";
import { useAllBounties } from "@/hooks/useAllBounties";
import EnhancedSubmissionDetails from "./SubmissionDetails";

interface BountySubmissionHandlerProps {
  bountyId: number;
}

export function BountySubmissionHandler({
  bountyId,
}: BountySubmissionHandlerProps) {
  const {
    bounties,
    canViewSubmissionDetails,
    getUserSubmissionForBounty,
    refreshBountySubmissions,
  } = useAllBounties();

  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);

  // Find the specific bounty
  const bounty = bounties.find((b) => b.id === bountyId);

  if (!bounty) {
    return <div>Bounty not found</div>;
  }

  // Check if user has submitted and can view submission details
  const canViewDetails = canViewSubmissionDetails(bountyId);
  const userSubmission = getUserSubmissionForBounty(bountyId);

  // Handle viewing submission details
  const handleViewSubmissionDetails = () => {
    if (canViewDetails && userSubmission) {
      setShowSubmissionDetails(true);
    }
  };

  // Handle refreshing submission data
  const handleRefreshSubmissions = async () => {
    await refreshBountySubmissions(bountyId);
  };

  // If showing submission details, render that component
  if (showSubmissionDetails && userSubmission) {
    return (
      <EnhancedSubmissionDetails
        bountyId={bounty.id}
        bountyTitle={bounty.title}
        bountyReward={bounty.reward}
        bountyDescription={bounty.description}
        submission={{
          hunter: userSubmission.hunter,
          descriptionCID: userSubmission.descriptionCID,
        }}
        onBack={() => setShowSubmissionDetails(false)}
        onPaymentComplete={() => {
          // Handle payment completion - maybe refresh the bounty data
          setShowSubmissionDetails(false);
          handleRefreshSubmissions();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Bounty Basic Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bounty.title}</h3>
          <p className="text-gray-600 text-sm">{bounty.description}</p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-800">
          {bounty.reward} USDC
        </Badge>
      </div>

      {/* Submission Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {bounty.isLoadingSubmissions
              ? "Loading submissions..."
              : `${bounty.applicants} ${
                  bounty.applicants === 1 ? "applicant" : "applicants"
                }`}
          </span>
        </div>

        {bounty.hasUserSubmitted && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            You submitted
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Show submission details button if user has submitted */}
        {canViewDetails && (
          <Button
            onClick={handleViewSubmissionDetails}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Your Submission
          </Button>
        )}

        {/* Refresh submissions button */}
        <Button
          onClick={handleRefreshSubmissions}
          variant="ghost"
          size="sm"
          disabled={bounty.isLoadingSubmissions}
        >
          {bounty.isLoadingSubmissions ? "Refreshing..." : "Refresh"}
        </Button>

        {/* Submit to bounty button (if user hasn't submitted) */}
        {!bounty.hasUserSubmitted && (
          <Button
            onClick={() => {
              // Handle submission logic here
              console.log(`Submit to bounty #${bountyId}`);
            }}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Submit to Bounty
          </Button>
        )}
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <ul className="space-y-1">
            <li>Bounty ID: {bounty.id}</li>
            <li>Total Applicants: {bounty.applicants}</li>
            <li>
              User Has Submitted: {bounty.hasUserSubmitted ? "Yes" : "No"}
            </li>
            <li>Can View Details: {canViewDetails ? "Yes" : "No"}</li>
            <li>
              Loading Submissions: {bounty.isLoadingSubmissions ? "Yes" : "No"}
            </li>
            {userSubmission && (
              <li>User Submission CID: {userSubmission.descriptionCID}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Example usage in a bounty list component
export function BountyListWithSubmissions() {
  const { bounties, isLoading } = useAllBounties();

  if (isLoading) {
    return <div>Loading bounties...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Available Bounties</h2>

      {bounties.map((bounty) => (
        <div key={bounty.id} className="border rounded-lg p-4">
          <BountySubmissionHandler bountyId={bounty.id} />
        </div>
      ))}
    </div>
  );
}

// Hook to get submission details for navigation
export function useSubmissionNavigation() {
  const { canViewSubmissionDetails, getUserSubmissionForBounty } =
    useAllBounties();

  /**
   * Check if user should be redirected to submission details page
   * @param bountyId - The bounty ID to check
   * @returns Object with navigation info
   */
  const getSubmissionNavigationInfo = (bountyId: number) => {
    const canView = canViewSubmissionDetails(bountyId);
    const submission = getUserSubmissionForBounty(bountyId);

    return {
      shouldShowSubmissionDetails: canView,
      userSubmission: submission,
      canNavigateToSubmissionDetails: canView && !!submission,
    };
  };

  return {
    getSubmissionNavigationInfo,
  };
}
