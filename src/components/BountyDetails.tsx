import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Tag,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getStatusColor, formatDate, daysRemaining } from "@/lib/utils";
import { BountyDetailsProps } from "@/lib/types";

export default function BountyDetails({
  bounty,
  hasApplied,
  onBack,
  onApply,
}: BountyDetailsProps) {
  if (!bounty) return null;

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
          <div className="flex flex-wrap gap-2 mb-4"></div>

          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{bounty.title}</h1>
            <Badge className="px-4 py-2 text-lg font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
              {bounty.reward} ETH
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Creator</span>
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="bg-indigo-100 text-indigo-800 text-xs">
                    WL
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-700">{bounty.creator}</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Created</span>
              <div className="flex items-center">
                <Calendar className="text-gray-400 mr-2 h-4 w-4" />
                <span className="text-gray-700">
                  {formatDate(bounty.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Deadline</span>
              <div className="flex items-center">
                <Clock className="text-gray-400 mr-2 h-4 w-4" />
                <span className="text-gray-700">
                  {formatDate(bounty.deadline)}
                  <span className="text-indigo-600 ml-2 font-medium">
                    ({daysRemaining(bounty.deadline)} days left)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Description
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl whitespace-pre-line text-gray-700">
              {bounty.longDescription}
            </div>
          </div>

          {bounty.tags && bounty.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {bounty.tags.map((tag) => (
                  <Badge
                    key={tag}
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

          <Separator className="my-6" />

          <div>
            {bounty.status === "open" && (
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

            {bounty.status !== "open" && (
              <div className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg inline-block">
                This bounty is no longer accepting applications
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
