import { useReadContract } from "wagmi";
import { useAccount, usePublicClient } from "wagmi";
import { useEffect, useState, useRef, useCallback } from "react";
import { formatUnits } from "viem";
import { BountyABI } from "@/lib/BountyABI";

// Contract configuration
const CONTRACT_ADDRESS = "0xCbcBF569D75B9C00B2469857c66767bA833FC641";

interface RawBounty {
  id: number;
  creator: string;
  amount: bigint;
  status: number;
  metadataCID: string;
}

interface BountyMetadata {
  title: string;
  description: string;
  tags: string[];
  deadline?: string;
}

interface Submission {
  hunter: string;
  descriptionCID: string;
}

export interface EnhancedBounty {
  id: number;
  title: string;
  description: string;
  reward: string; // Formatted USDC amount
  tags: string[];
  creator: string;
  applicants: number; // Now actual count from contract
  status: number;
  metadataCID: string;
  rawAmount: bigint;
  isLoading?: boolean;
  metadataError?: string;
  deadline?: string;
  // New fields for submission tracking
  hasUserSubmitted?: boolean; // Whether current user has submitted
  userSubmission?: Submission; // Current user's submission if they submitted
  isLoadingSubmissions?: boolean;
}

export function useAllBounties() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [enhancedBounties, setEnhancedBounties] = useState<EnhancedBounty[]>(
    []
  );
  const [rawBounties, setRawBounties] = useState<RawBounty[]>([]);
  const hasLoggedInitial = useRef(false);
  const metadataCache = useRef<Map<string, BountyMetadata | null>>(new Map());

  // Fetch total bounty count
  const {
    data: bountyCount,
    error: countError,
    isLoading: countLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BountyABI,
    functionName: "bountyCount",
  });

  // Fetch active bounty IDs
  const {
    data: activeBountyIds,
    error: idsError,
    isLoading: idsLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BountyABI,
    functionName: "getAllActiveBountyIds",
  });

  // Fetch all active bounties details
  const {
    data: activeBountiesData,
    error: activeBountiesError,
    isLoading: activeLoading,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BountyABI,
    functionName: "getAllActiveBounties",
  });

  // Get submission count for a bounty
  const getSubmissionCount = useCallback(
    async (bountyId: number): Promise<number> => {
      if (!publicClient) return 0;

      try {
        console.log(`Fetching submission count for bounty #${bountyId}...`);

        const count = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BountyABI,
          functionName: "getSubmissionCount",
          args: [BigInt(bountyId)],
        })) as bigint;

        const countNumber = Number(count);
        console.log(`Bounty #${bountyId} has ${countNumber} submissions`);
        return countNumber;
      } catch (error) {
        console.error(
          `Error fetching submission count for bounty #${bountyId}:`,
          error
        );
        return 0;
      }
    },
    [publicClient]
  );

  // Get user's submission for a bounty (if any)
  const getUserSubmission = useCallback(
    async (
      bountyId: number,
      userAddress: string
    ): Promise<Submission | null> => {
      if (!publicClient || !userAddress) return null;

      try {
        console.log(
          `Checking if user ${userAddress} submitted to bounty #${bountyId}...`
        );

        const descriptionCID = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BountyABI,
          functionName: "getSubmission",
          args: [BigInt(bountyId), userAddress],
        })) as string;

        if (descriptionCID && descriptionCID !== "") {
          console.log(`User has submitted to bounty #${bountyId}`);
          return {
            hunter: userAddress,
            descriptionCID,
          };
        }

        return null;
      } catch (error) {
        console.error(
          `Error checking user submission for bounty #${bountyId}:`,
          error
        );
        return null;
      }
    },
    [publicClient]
  );

  // Function to fetch metadata through our API route
  const fetchMetadata = async (cid: string): Promise<BountyMetadata | null> => {
    // Check cache first
    if (metadataCache.current.has(cid)) {
      return metadataCache.current.get(cid) || null;
    }

    try {
      console.log(`📡 Fetching metadata for CID: ${cid}`);
      const response = await fetch(
        `/api/codex/getMetadata?cid=${encodeURIComponent(cid)}`
      );

      if (!response.ok) {
        console.error(
          `❌ Failed to fetch metadata for ${cid}:`,
          response.status
        );
        metadataCache.current.set(cid, null);
        return null;
      }

      const result = await response.json();

      if (!result.success) {
        console.error(`❌ API error for ${cid}:`, result.error);
        metadataCache.current.set(cid, null);
        return null;
      }

      console.log(`✅ Fetched metadata for ${cid}:`, result.data);

      // Cache the result
      metadataCache.current.set(cid, result.data);
      return result.data;
    } catch (error) {
      console.error(`❌ Error fetching metadata for ${cid}:`, error);
      metadataCache.current.set(cid, null);
      return null;
    }
  };

  // Process raw bounty data when available
  useEffect(() => {
    if (!hasLoggedInitial.current) {
      console.log("🔍 Fetching bounties from contract:", CONTRACT_ADDRESS);
      hasLoggedInitial.current = true;
    }

    // Check if we have the active bounties data and it's structured correctly
    if (
      activeBountiesData &&
      Array.isArray(activeBountiesData) &&
      activeBountiesData.length >= 4
    ) {
      // The contract returns parallel arrays: [ids[], creators[], amounts[], metadataCIDs[]]
      const [ids, creators, amounts, metadataCIDs] = activeBountiesData;

      // Make sure all arrays have the same length
      if (
        ids.length === creators.length &&
        ids.length === amounts.length &&
        ids.length === metadataCIDs.length
      ) {
        console.log("✅ Found", ids.length, "active bounties");

        // Convert parallel arrays to an array of objects
        const foundBounties: RawBounty[] = ids.map((id, index) => ({
          id: Number(id),
          creator: creators[index],
          amount: amounts[index],
          status: 0, // Active status is 0 in the enum
          metadataCID: metadataCIDs[index],
        }));

        if (
          foundBounties.length > 0 &&
          foundBounties.length !== rawBounties.length
        ) {
          setRawBounties(foundBounties);
          console.log(
            "📋 Updated raw bounty list with",
            foundBounties.length,
            "bounties"
          );
        }
      }
    }
  }, [activeBountiesData, rawBounties.length]);

  // Fetch metadata and submission data for each bounty
  useEffect(() => {
    if (rawBounties.length === 0) return;

    const fetchAllBountyData = async () => {
      console.log(
        "📡 Fetching metadata and submission data for all bounties..."
      );

      // Create initial enhanced bounties with loading state
      const initialEnhanced: EnhancedBounty[] = rawBounties.map((bounty) => ({
        id: bounty.id,
        title: "Loading...",
        description: "Fetching bounty details...",
        reward: formatUnits(bounty.amount, 6),
        tags: [],
        creator: bounty.creator,
        applicants: 0, // Will be updated when submission count is fetched
        status: bounty.status,
        metadataCID: bounty.metadataCID,
        rawAmount: bounty.amount,
        isLoading: true,
        isLoadingSubmissions: true,
        hasUserSubmitted: false,
      }));

      setEnhancedBounties(initialEnhanced);

      // Process each bounty
      const enhanced = await Promise.all(
        rawBounties.map(async (bounty) => {
          // Fetch metadata and submission data in parallel
          const [metadata, submissionCount, userSubmission] = await Promise.all(
            [
              fetchMetadata(bounty.metadataCID),
              getSubmissionCount(bounty.id),
              address
                ? getUserSubmission(bounty.id, address)
                : Promise.resolve(null),
            ]
          );

          const enhancedBounty: EnhancedBounty = {
            id: bounty.id,
            title: metadata?.title || `Bounty #${bounty.id}`,
            description: metadata?.description || "No description available",
            reward: formatUnits(bounty.amount, 6), // Format as USDC
            deadline: metadata?.deadline,
            tags: metadata?.tags || [],
            creator: bounty.creator,
            applicants: submissionCount, // Now actual count from contract
            status: bounty.status,
            metadataCID: bounty.metadataCID,
            rawAmount: bounty.amount,
            isLoading: false,
            isLoadingSubmissions: false,
            metadataError: metadata ? undefined : "Failed to load metadata",
            hasUserSubmitted: !!userSubmission,
            userSubmission: userSubmission || undefined,
          };

          return enhancedBounty;
        })
      );

      setEnhancedBounties(enhanced);
      console.log("✅ Enhanced all bounties with metadata and submission data");
    };

    fetchAllBountyData();
  }, [
    rawBounties,
    address,
    publicClient,
    getSubmissionCount,
    getUserSubmission,
  ]);

  // Function to refresh submission data for a specific bounty
  const refreshBountySubmissions = useCallback(
    async (bountyId: number) => {
      if (!publicClient) return;

      console.log(`Refreshing submission data for bounty #${bountyId}...`);

      // Mark this bounty as loading submissions
      setEnhancedBounties((current) =>
        current.map((b) =>
          b.id === bountyId ? { ...b, isLoadingSubmissions: true } : b
        )
      );

      try {
        // Get fresh submission data
        const [submissionCount, userSubmission] = await Promise.all([
          getSubmissionCount(bountyId),
          address
            ? getUserSubmission(bountyId, address)
            : Promise.resolve(null),
        ]);

        console.log(
          `Refreshed: ${submissionCount} submissions for bounty #${bountyId}, user submitted: ${!!userSubmission}`
        );

        // Update the bounty with new submission data
        setEnhancedBounties((current) =>
          current.map((b) =>
            b.id === bountyId
              ? {
                  ...b,
                  applicants: submissionCount,
                  hasUserSubmitted: !!userSubmission,
                  userSubmission: userSubmission || undefined,
                  isLoadingSubmissions: false,
                }
              : b
          )
        );
      } catch (error) {
        console.error(
          `Error refreshing submission data for bounty #${bountyId}:`,
          error
        );

        // Mark as not loading even on error
        setEnhancedBounties((current) =>
          current.map((b) =>
            b.id === bountyId ? { ...b, isLoadingSubmissions: false } : b
          )
        );
      }
    },
    [publicClient, getSubmissionCount, getUserSubmission, address]
  );

  // Function to check if user can view submission details for a bounty
  const canViewSubmissionDetails = useCallback(
    (bountyId: number): boolean => {
      const bounty = enhancedBounties.find((b) => b.id === bountyId);
      if (!bounty || !address) return false;

      // User can view submission details if:
      // 1. They have submitted to the bounty, OR
      // 2. They are the bounty creator
      const hasUserSubmitted = !!(
        bounty.hasUserSubmitted && bounty.userSubmission
      );
      const isBountyCreator =
        bounty.creator.toLowerCase() === address.toLowerCase();

      return hasUserSubmitted || isBountyCreator;
    },
    [enhancedBounties, address]
  );

  // Get all submissions for a bounty (for bounty creators)
  const getAllSubmissionsForBounty = useCallback(
    async (bountyId: number): Promise<Submission[]> => {
      if (!publicClient) return [];

      try {
        console.log(`Fetching all submissions for bounty #${bountyId}...`);

        // Use the contract's getAllSubmissions function
        const submissions = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BountyABI,
          functionName: "getAllSubmissions",
          args: [BigInt(bountyId)],
        })) as Array<{ hunter: string; descriptionCID: string }>;

        console.log(
          `Found ${submissions.length} submissions for bounty #${bountyId}`
        );

        // Convert to our Submission type
        const formattedSubmissions: Submission[] = submissions.map((sub) => ({
          hunter: sub.hunter,
          descriptionCID: sub.descriptionCID,
        }));

        return formattedSubmissions;
      } catch (error) {
        console.error(
          `Error fetching all submissions for bounty #${bountyId}:`,
          error
        );
        return [];
      }
    },
    [publicClient]
  );

  // Function to get user's submission for a specific bounty
  const getUserSubmissionForBounty = useCallback(
    (bountyId: number): Submission | undefined => {
      const bounty = enhancedBounties.find((b) => b.id === bountyId);
      return bounty?.userSubmission;
    },
    [enhancedBounties]
  );

  // Function to check if current user is bounty creator
  const isBountyCreator = useCallback(
    (bountyId: number): boolean => {
      const bounty = enhancedBounties.find((b) => b.id === bountyId);
      return !!(
        bounty &&
        address &&
        bounty.creator.toLowerCase() === address.toLowerCase()
      );
    },
    [enhancedBounties, address]
  );

  // Calculate basic stats
  const totalBounties = bountyCount ? Number(bountyCount) : 0;
  const activeBountiesCount = rawBounties.length;
  const completedBounties = totalBounties - activeBountiesCount;

  const isLoading = countLoading || idsLoading || activeLoading;

  return {
    bounties: enhancedBounties,
    rawBounties,
    totalBounties: totalBounties,
    stats: {
      total: totalBounties,
      active: activeBountiesCount,
      completed: completedBounties,
    },
    isLoading,
    isLoadingMetadata: enhancedBounties.some((b) => b.isLoading),
    isLoadingSubmissions: enhancedBounties.some((b) => b.isLoadingSubmissions),

    // New submission-related functions
    refreshBountySubmissions,
    canViewSubmissionDetails,
    getUserSubmissionForBounty,
    getAllSubmissionsForBounty,
    isBountyCreator,
  };
}
