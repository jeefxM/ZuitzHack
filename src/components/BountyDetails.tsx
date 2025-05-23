import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Tag,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getStatusColor, formatDate, daysRemaining } from "@/lib/utils";

interface BountyDetailsProps {
  bounty: {
    id: number;
    title: string;
    description: string;
    reward: string; // USDC amount as string
    deadline: string;
    tags: string[];
    creator: string;
    applicants: number;
    status: number; // 0=Active, 1=Completed, 2=Cancelled
    metadataCID: string;
    hunter: string;
    rawAmount: bigint;
    isLoading?: boolean;
    metadataError?: string;
  } | null;
  hasApplied?: boolean;
  onBack: () => void;
  onApply?: () => void;
}

export default function BountyDetails({
  bounty,
  hasApplied = false,
  onBack,
  onApply,
}: BountyDetailsProps) {
  if (!bounty) return null;

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

  const statusInfo = getStatusInfo(bounty.status);

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

  // Show loading state
  if (bounty.isLoading) {
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
                  {formatDeadline(bounty.deadline)}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Applications
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="text-indigo-600 mr-2 h-4 w-4" />
                  <span className="text-gray-700">
                    <b>{bounty.applicants}</b> application
                    {bounty.applicants !== 1 && "s"} submitted
                  </span>
                </div>

                {hasApplied && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span className="font-medium">You have applied</span>
                  </div>
                )}
              </div>
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
          <div>
            {statusInfo.isOpen && (
              <>
                {hasApplied ? (
                  <div className="bg-green-50 text-green-700 px-6 py-3 rounded-lg inline-flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Already Applied
                  </div>
                ) : (
                  <Button onClick={onApply} className="w-full md:w-auto">
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
        </CardContent>
      </Card>
    </div>
  );
}
