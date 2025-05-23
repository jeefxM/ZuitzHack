import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { useAccount } from "wagmi";
import { useMemo, useCallback, useEffect, useState } from "react";
import { formatUnits } from "viem";
import { BountyABI } from "@/lib/BountyABI";
import { useAllBounties, type EnhancedBounty } from "@/hooks/useAllBounties";

// Contract configuration - MAKE SURE THIS MATCHES YOUR DEPLOYED CONTRACT
const CONTRACT_ADDRESS = "0xCbcBF569D75B9C00B2469857c66767bA833FC641"; // Updated to match the address in your script

// Types
interface Submission {
  hunter: string;
  descriptionCID: string;
}

interface BountyWithSubmissions extends EnhancedBounty {
  submissionCount: number;
  submissions: Submission[];
  isLoadingSubmissions?: boolean;
}

export function useMyBounties() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { bounties: allBounties, isLoading: isLoadingAll } = useAllBounties();
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Cancel bounty functionality
  const {
    writeContract: cancelBounty,
    data: cancelHash,
    isPending: isCancelPending,
    error: cancelError,
  } = useWriteContract();

  const {
    isLoading: isCancelConfirming,
    isSuccess: isCancelConfirmed,
    error: cancelReceiptError,
  } = useWaitForTransactionReceipt({
    hash: cancelHash,
  });

  // Get submission count using contract function (much more reliable)
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

  // Get all submissions using contract function (much more reliable)
  const getBountySubmissions = useCallback(
    async (bountyId: number): Promise<Submission[]> => {
      if (!publicClient) {
        console.log("No publicClient available");
        return [];
      }

      try {
        console.log(`Fetching submissions for bounty #${bountyId}...`);

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
          `Error fetching submissions for bounty #${bountyId}:`,
          error
        );

        // Fallback to individual calls if getAllSubmissions fails
        console.log(`Trying fallback method for bounty #${bountyId}...`);
        return await getBountySubmissionsFallback(bountyId);
      }
    },
    [publicClient]
  );

  // Fallback method using getBountySubmitters + getSubmission
  const getBountySubmissionsFallback = useCallback(
    async (bountyId: number): Promise<Submission[]> => {
      if (!publicClient) return [];

      try {
        console.log(`Using fallback method for bounty #${bountyId}...`);

        // Get list of submitters
        const submitters = (await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: BountyABI,
          functionName: "getBountySubmitters",
          args: [BigInt(bountyId)],
        })) as string[];

        console.log(
          `Found ${submitters.length} submitters for bounty #${bountyId}`
        );

        // Get submission for each submitter
        const submissions: Submission[] = [];
        for (const hunter of submitters) {
          try {
            const descriptionCID = (await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: BountyABI,
              functionName: "getSubmission",
              args: [BigInt(bountyId), hunter],
            })) as string;

            if (descriptionCID && descriptionCID !== "") {
              submissions.push({
                hunter,
                descriptionCID,
              });
            }
          } catch (error) {
            console.error(`Error fetching submission from ${hunter}:`, error);
          }
        }

        console.log(
          `Retrieved ${submissions.length} valid submissions for bounty #${bountyId}`
        );
        return submissions;
      } catch (error) {
        console.error(`Fallback method failed for bounty #${bountyId}:`, error);
        return [];
      }
    },
    [publicClient]
  );

  // State to track bounties with submissions
  const [myBounties, setMyBounties] = useState<BountyWithSubmissions[]>([]);

  // Get my bounties (created by current user)
  const myFilteredBounties = useMemo(() => {
    if (!address || !allBounties.length) return [];

    console.log(
      `Filtering ${allBounties.length} bounties for creator: ${address}`
    );

    // Filter bounties where creator matches connected address
    const filtered = allBounties.filter(
      (bounty) => bounty.creator.toLowerCase() === address.toLowerCase()
    );

    console.log(`Found ${filtered.length} bounties created by current user`);
    return filtered;
  }, [allBounties, address]);

  // Effect to load submissions for user's bounties
  useEffect(() => {
    if (!myFilteredBounties.length || !publicClient) {
      setMyBounties([]);
      return;
    }

    async function loadBountiesWithSubmissions() {
      console.log(
        `Loading submissions for ${myFilteredBounties.length} bounties...`
      );
      setIsLoadingSubmissions(true);

      const bountiesWithSubmissions: BountyWithSubmissions[] = [];

      for (const bounty of myFilteredBounties) {
        console.log(`Processing bounty #${bounty.id}...`);

        try {
          // Get submission count and submissions in parallel
          const [submissionCount, submissions] = await Promise.all([
            getSubmissionCount(bounty.id),
            getBountySubmissions(bounty.id),
          ]);

          const bountyWithSubmissions: BountyWithSubmissions = {
            ...bounty,
            submissionCount,
            submissions,
            isLoadingSubmissions: false,
          };

          bountiesWithSubmissions.push(bountyWithSubmissions);

          // Update state progressively so user sees data as it loads
          setMyBounties([...bountiesWithSubmissions]);
        } catch (error) {
          console.error(`Error processing bounty #${bounty.id}:`, error);

          // Add bounty with empty submissions on error
          bountiesWithSubmissions.push({
            ...bounty,
            submissionCount: 0,
            submissions: [],
            isLoadingSubmissions: false,
          });
        }
      }

      setIsLoadingSubmissions(false);
      console.log(`Finished loading submissions for all bounties`);
    }

    loadBountiesWithSubmissions();
  }, [
    myFilteredBounties,
    publicClient,
    getBountySubmissions,
    getSubmissionCount,
  ]);

  // Bounty statistics for the user
  const myBountyStats = useMemo(() => {
    const stats = {
      total: myBounties.length,
      active: 0,
      completed: 0,
      cancelled: 0,
      totalValue: 0,
      activeValue: 0,
      totalSubmissions: 0,
    };

    myBounties.forEach((bounty) => {
      const valueInUSDC = parseFloat(bounty.reward);
      stats.totalValue += valueInUSDC;
      stats.totalSubmissions += bounty.submissionCount || 0;

      switch (bounty.status) {
        case 0: // Active
          stats.active++;
          stats.activeValue += valueInUSDC;
          break;
        case 1: // Completed
          stats.completed++;
          break;
        case 2: // Cancelled
          stats.cancelled++;
          break;
      }
    });

    return stats;
  }, [myBounties]);

  // Cancel bounty function
  const handleCancelBounty = async (bountyId: number) => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const bountyToCancel = myBounties.find((b) => b.id === bountyId);
    if (!bountyToCancel) {
      throw new Error(`Bounty #${bountyId} not found in your bounties`);
    }

    if (bountyToCancel.status !== 0) {
      throw new Error(
        `Cannot cancel bounty #${bountyId} - status is ${bountyToCancel.status} (not active)`
      );
    }

    if (bountyToCancel.creator.toLowerCase() !== address.toLowerCase()) {
      throw new Error(
        `Cannot cancel bounty #${bountyId} - you are not the creator`
      );
    }

    return cancelBounty({
      address: CONTRACT_ADDRESS,
      abi: BountyABI,
      functionName: "cancelBounty",
      args: [BigInt(bountyId)],
    });
  };

  // Function to refresh submissions for a specific bounty
  const refreshBountySubmissions = async (bountyId: number) => {
    if (!publicClient) return;

    console.log(`Manually refreshing submissions for bounty #${bountyId}...`);

    // Mark this bounty as loading
    setMyBounties((current) =>
      current.map((b) =>
        b.id === bountyId ? { ...b, isLoadingSubmissions: true } : b
      )
    );

    try {
      // Get fresh submission data
      const [submissionCount, submissions] = await Promise.all([
        getSubmissionCount(bountyId),
        getBountySubmissions(bountyId),
      ]);

      console.log(
        `Refreshed: ${submissions.length} submissions for bounty #${bountyId}`
      );

      // Update the bounty with new submission data
      setMyBounties((current) =>
        current.map((b) =>
          b.id === bountyId
            ? {
                ...b,
                submissions,
                submissionCount,
                isLoadingSubmissions: false,
              }
            : b
        )
      );
    } catch (error) {
      console.error(
        `Error refreshing submissions for bounty #${bountyId}:`,
        error
      );

      // Mark as not loading even on error
      setMyBounties((current) =>
        current.map((b) =>
          b.id === bountyId ? { ...b, isLoadingSubmissions: false } : b
        )
      );
    }
  };

  const isLoading = isLoadingAll;

  return {
    myBounties,
    myBountyStats,
    isLoading,
    isLoadingSubmissions,

    // Cancel functionality
    handleCancelBounty,
    isCancelPending,
    isCancelConfirming,
    isCancelConfirmed,
    cancelHash,
    cancelError: cancelError || cancelReceiptError,

    // Submission functionality
    getBountySubmissions,
    getSubmissionCount,
    refreshBountySubmissions,
  };
}
