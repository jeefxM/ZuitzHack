import { Clock, Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStatusColor, daysRemaining } from "@/lib/utils";
import { BountyCardProps } from "@/lib/types";

export default function BountyCard({ bounty, onViewDetails }: BountyCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2"></div>
          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            {bounty.reward} USDC
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{bounty.title}</h3>

        <p className="text-gray-600 mb-4 line-clamp-2">{bounty.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {bounty.tags &&
            bounty.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-gray-100 text-gray-700 hover:bg-gray-100"
              >
                {tag}
              </Badge>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-1 h-4 w-4" />
            <span>{daysRemaining(bounty.deadline)} days left</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Users className="mr-1 h-4 w-4" />
            <span>
              {bounty.applicants} applicant{bounty.applicants !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Posted by: {bounty.creator}
          </div>
          <Button
            variant="ghost"
            onClick={() => onViewDetails(bounty.id)}
            className="flex items-center text-indigo-600 hover:text-indigo-800"
          >
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
