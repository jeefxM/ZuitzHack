import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BountyCard from "@/components/BountyCard";
import { BountyListProps } from "@/lib/types";

export default function BountyList({
  bounties,
  searchQuery,
  setSearchQuery,
  filterTag,
  setFilterTag,
  allTags,
  resetFilters,
  onViewDetails,
}: BountyListProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Bounties</h1>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search bounties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* <Select
            value={filterTag}
            onValueChange={(value) => setFilterTag(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
        </div>
      </div>

      {bounties?.length! === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-gray-600 text-lg">
              No bounties match your search criteria.
            </p>
            <Button onClick={resetFilters} variant="ghost" className="mt-4">
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bounties?.map((bounty) => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
