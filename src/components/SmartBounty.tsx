import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  FileText,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAllBounties, type EnhancedBounty } from "@/hooks/useAllBounties";
import EnhancedSubmissionDetails from "./SubmissionDetails";

interface SmartBountyCardProps {
  bounty: EnhancedBounty;
  onSubmitClick?: (bountyId: number) => void;
}

export function SmartBountyCard({
  bounty,
  onSubmitClick,
}: SmartBountyCardProps) {
  const {
    canViewSubmissionDetails,
    getUserSubmissionForBounty,
    refreshBountySubmissions,
  } = useAllBounties();

  const [showSubmissionDetails, setShowSubmissionDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get submission status for current user
  const canViewDetails = canViewSubmissionDetails(bounty.id);
  const userSubmission = getUserSubmissionForBounty(bounty.id);

  // Format address helper
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Handle refreshing submission data
  const handleRefreshSubmissions = async () => {
    setIsRefreshing(true);
    try {
      await refreshBountySubmissions(bounty.id);
    } catch (error) {
      console.error("Error refreshing submissions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle viewing submission details
  const handleViewSubmissionDetails = () => {
    if (canViewDetails && userSubmission) {
      setShowSubmissionDetails(true);
    }
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
          setShowSubmissionDetails(false);
          handleRefreshSubmissions();
        }}
      />
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                #{bounty.id}
              </Badge>
              {bounty.hasUserSubmitted && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Applied
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg mb-2">{bounty.title}</CardTitle>
            <p className="text-gray-600 text-sm line-clamp-2">
              {bounty.description}
            </p>
          </div>
          <div className="text-right">
            <Badge className="bg-indigo-100 text-indigo-800 mb-2">
              <DollarSign className="h-3 w-3 mr-1" />
              {bounty.reward} USDC
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tags */}
        {bounty.tags && bounty.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {bounty.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {bounty.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{bounty.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Bounty Info Row */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{formatAddress(bounty.creator)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {bounty.isLoadingSubmissions ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `${bounty.applicants} ${
                    bounty.applicants === 1 ? "applicant" : "applicants"
                  }`
                )}
              </span>
            </div>

            {bounty.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(bounty.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshSubmissions}
            disabled={isRefreshing || bounty.isLoadingSubmissions}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* If user has submitted, show view submission button */}
          {canViewDetails ? (
            <Button
              onClick={handleViewSubmissionDetails}
              className="flex-1 flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Your Submission
            </Button>
          ) : (
            /* If user hasn't submitted, show submit button */
            <Button
              onClick={() => onSubmitClick?.(bounty.id)}
              className="flex-1 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Submit to Bounty
            </Button>
          )}

          {/* Always show view bounty details button */}
          <Button
            variant="outline"
            onClick={() => {
              // Navigate to bounty details page
              console.log(`Navigate to bounty #${bounty.id} details`);
            }}
          >
            View Details
          </Button>
        </div>

        {/* Loading states */}
        {bounty.isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4 animate-spin" />
            Loading bounty metadata...
          </div>
        )}

        {bounty.metadataError && (
          <div className="text-sm text-red-600">⚠️ {bounty.metadataError}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage component
export function BountyGrid() {
  const { bounties, isLoading, stats } = useAllBounties();

  const handleSubmitToBounty = (bountyId: number) => {
    // Handle navigation to submit page or open submit modal
    console.log(`Navigate to submit page for bounty #${bountyId}`);
    // Example: router.push(`/bounties/${bountyId}/submit`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-6 w-6 animate-spin mr-2" />
        Loading bounties...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Bounties</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Bounties</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed Bounties</div>
          </CardContent>
        </Card>
      </div>

      {/* Bounty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bounties.map((bounty) => (
          <SmartBountyCard
            key={bounty.id}
            bounty={bounty}
            onSubmitClick={handleSubmitToBounty}
          />
        ))}
      </div>

      {bounties.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No active bounties found</div>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      )}
    </div>
  );
}
