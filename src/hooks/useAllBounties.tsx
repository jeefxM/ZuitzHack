import { useReadContract } from "wagmi";
import { useEffect, useState, useRef } from "react";
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
  // We'll keep deadline in the metadata structure even though the contract
  // doesn't track it - it could still be part of the metadata JSON
  deadline?: string;
}

export interface EnhancedBounty {
  id: number;
  title: string;
  description: string;
  reward: string; // Formatted USDC amount
  tags: string[];
  creator: string;
  applicants: number;
  status: number;
  metadataCID: string;
  rawAmount: bigint;
  isLoading?: boolean;
  metadataError?: string;
  deadline?: string; // Optional now since we don't have it in the contract
}

export function useAllBounties() {
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

  // Fetch metadata for each bounty
  useEffect(() => {
    if (rawBounties.length === 0) return;

    const fetchAllMetadata = async () => {
      console.log("📡 Fetching metadata for all bounties...");

      // Create initial enhanced bounties with loading state
      const initialEnhanced: EnhancedBounty[] = rawBounties.map((bounty) => ({
        id: bounty.id,
        title: "Loading...",
        description: "Fetching bounty details...",
        reward: formatUnits(bounty.amount, 6),
        tags: [],
        creator: bounty.creator,
        applicants: 0,
        status: bounty.status,
        metadataCID: bounty.metadataCID,
        rawAmount: bounty.amount,
        isLoading: true,
      }));

      setEnhancedBounties(initialEnhanced);

      // Fetch metadata for each bounty
      const enhanced = await Promise.all(
        rawBounties.map(async (bounty) => {
          const metadata = await fetchMetadata(bounty.metadataCID);

          const enhancedBounty: EnhancedBounty = {
            id: bounty.id,
            title: metadata?.title || `Bounty #${bounty.id}`,
            description: metadata?.description || "No description available",
            reward: formatUnits(bounty.amount, 6), // Format as USDC
            deadline: metadata?.deadline,
            tags: metadata?.tags || [],
            creator: bounty.creator,
            applicants: 0, // We don't have this data from the contract
            status: bounty.status,
            metadataCID: bounty.metadataCID,
            rawAmount: bounty.amount,
            isLoading: false,
            metadataError: metadata ? undefined : "Failed to load metadata",
          };

          return enhancedBounty;
        })
      );

      setEnhancedBounties(enhanced);
      console.log("✅ Enhanced all bounties with metadata");
    };

    fetchAllMetadata();
  }, [rawBounties]);

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
  };
}
