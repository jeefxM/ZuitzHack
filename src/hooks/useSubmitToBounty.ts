// hooks/useApplyForBounty.ts
import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useReadContract,
} from "wagmi";
import { CodexClient } from "@/lib/codexClient";

// Contract configuration
const CONTRACT_ADDRESS = "0xCbcBF569D75B9C00B2469857c66767bA833FC641";

// ABI for bounty functions
const BOUNTY_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "_bountyId", type: "uint256" },
      { internalType: "string", name: "_descriptionCID", type: "string" },
    ],
    name: "submitToBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_bountyId", type: "uint256" }],
    name: "isActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_bountyId", type: "uint256" },
      { internalType: "address", name: "_hunter", type: "address" },
    ],
    name: "getSubmission",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_bountyId", type: "uint256" }],
    name: "getBounty",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          {
            internalType: "enum ZuitzerlandBountiesUSDC.Status",
            name: "status",
            type: "uint8",
          },
          { internalType: "string", name: "metadataCID", type: "string" },
        ],
        internalType: "struct ZuitzerlandBountiesUSDC.Bounty",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Types
interface SubmissionData {
  title: string;
  description: string;
  bountyId: number;
}

interface SubmissionState {
  isChecking: boolean;
  isUploading: boolean;
  isSubmitting: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error: string | null;
  cid?: string;
  txHash?: string;
  validationMessage?: string;
}

export function useApplyForBounty() {
  // Get account and contract interaction hooks
  const { address } = useAccount();
  const { writeContractAsync, error: writeError } = useWriteContract();
  const publicClient = usePublicClient();

  // State to track the submission process
  const [state, setState] = useState<SubmissionState>({
    isChecking: false,
    isUploading: false,
    isSubmitting: false,
    isConfirming: false,
    isSuccess: false,
    error: null,
  });

  // Track the transaction hash
  const [txHash, setTxHash] = useState<string | undefined>();

  // Use Wagmi's hook to track transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: txFailed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    enabled: !!txHash,
  });

  // Handle transaction errors or success
  useEffect(() => {
    if (txFailed && txError) {
      console.error("Transaction failed:", txError);
      setState((prev) => ({
        ...prev,
        isConfirming: false,
        isSuccess: false,
        error: `Transaction failed: ${
          txError.message || "Check your wallet for details"
        }`,
      }));
    } else if (isConfirmed && !state.isSuccess) {
      // Double-check transaction success by fetching receipt
      checkTransactionSuccess(txHash as `0x${string}`);
    }
  }, [txFailed, isConfirmed, txError, txHash, state.isSuccess]);

  // Manually check if transaction was successful
  const checkTransactionSuccess = async (hash: `0x${string}`) => {
    if (!publicClient) return;

    try {
      const receipt = await publicClient.getTransactionReceipt({ hash });

      // Check if transaction was successful (status = 1)
      if (receipt && receipt.status === "success") {
        setState((prev) => ({
          ...prev,
          isConfirming: false,
          isSuccess: true,
        }));
      } else {
        // Transaction was mined but failed
        setState((prev) => ({
          ...prev,
          isConfirming: false,
          isSuccess: false,
          error:
            "Transaction was processed but failed. Check your wallet for details.",
        }));
      }
    } catch (error) {
      console.error("Error checking transaction receipt:", error);
    }
  };

  // Reset the state
  const reset = () => {
    setState({
      isChecking: false,
      isUploading: false,
      isSubmitting: false,
      isConfirming: false,
      isSuccess: false,
      error: null,
    });
    setTxHash(undefined);
  };

  // Pre-check if the user can submit to this bounty
  const checkBountySubmissionEligibility = async (
    bountyId: number
  ): Promise<boolean> => {
    if (!address || !publicClient) return false;

    setState((prev) => ({
      ...prev,
      isChecking: true,
      validationMessage: "Checking bounty eligibility...",
    }));

    try {
      // 1. Check if contract exists
      const code = await publicClient.getBytecode({
        address: CONTRACT_ADDRESS as `0x${string}`,
      });

      if (!code || code === "0x") {
        setState((prev) => ({
          ...prev,
          isChecking: false,
          error: `Contract not found at address ${CONTRACT_ADDRESS}`,
        }));
        return false;
      }

      // 2. Check if bounty is active
      try {
        const isActive = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: BOUNTY_ABI,
          functionName: "isActive",
          args: [BigInt(bountyId)],
        });

        if (!isActive) {
          setState((prev) => ({
            ...prev,
            isChecking: false,
            error: `Bounty #${bountyId} is not active`,
          }));
          return false;
        }
      } catch (error) {
        console.error("Error checking if bounty is active:", error);
        setState((prev) => ({
          ...prev,
          isChecking: false,
          error: `Failed to check if bounty #${bountyId} is active`,
        }));
        return false;
      }

      // 3. Get bounty details to check if user is creator
      try {
        const bounty = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: BOUNTY_ABI,
          functionName: "getBounty",
          args: [BigInt(bountyId)],
        });

        // Check if user is bounty creator
        if (
          bounty &&
          bounty.creator &&
          bounty.creator.toLowerCase() === address.toLowerCase()
        ) {
          setState((prev) => ({
            ...prev,
            isChecking: false,
            error: "You cannot submit to your own bounty",
          }));
          return false;
        }
      } catch (error) {
        console.error("Error getting bounty details:", error);
      }

      // 4. Check if user has already submitted
      try {
        const existingSubmission = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: BOUNTY_ABI,
          functionName: "getSubmission",
          args: [BigInt(bountyId), address],
        });

        if (
          existingSubmission &&
          typeof existingSubmission === "string" &&
          existingSubmission !== ""
        ) {
          setState((prev) => ({
            ...prev,
            isChecking: false,
            error: "You have already submitted to this bounty",
          }));
          return false;
        }
      } catch (error) {
        console.error("Error checking existing submission:", error);
      }

      setState((prev) => ({
        ...prev,
        isChecking: false,
        validationMessage: "Eligible to submit",
      }));
      return true;
    } catch (error) {
      console.error("Error checking bounty eligibility:", error);
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error: "Failed to check bounty eligibility",
      }));
      return false;
    }
  };

  // Main function to apply for a bounty
  const applyForBounty = async (data: SubmissionData) => {
    // Check if wallet is connected
    if (!address) {
      setState((prev) => ({
        ...prev,
        error: "Please connect your wallet first",
      }));
      return;
    }

    try {
      // Reset the state
      reset();

      // Check if user can submit to this bounty
      const canSubmit = await checkBountySubmissionEligibility(data.bountyId);
      if (!canSubmit) {
        return; // Error already set in state by checkBountySubmissionEligibility
      }

      // Step 1: Upload metadata to Codex
      setState((prev) => ({
        ...prev,
        isUploading: true,
      }));

      const submissionData = {
        title: data.title.trim(),
        description: data.description.trim(),
        submitterAddress: address,
        bountyId: data.bountyId,
      };

      const uploadResult = await CodexClient.uploadSubmissionMetadata(
        submissionData
      );

      if (!uploadResult.success || !uploadResult.cid) {
        throw new Error(
          uploadResult.error || "Failed to upload metadata to Codex"
        );
      }

      // Step 2: Submit to smart contract
      setState((prev) => ({
        ...prev,
        isUploading: false,
        isSubmitting: true,
        cid: uploadResult.cid,
      }));

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BOUNTY_ABI,
        functionName: "submitToBounty",
        args: [BigInt(data.bountyId), uploadResult.cid],
      });

      // Step 3: Wait for confirmation
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isConfirming: true,
        txHash: hash,
      }));
      setTxHash(hash);
    } catch (error) {
      console.error("Error applying for bounty:", error);
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";

      setState((prev) => ({
        ...prev,
        isChecking: false,
        isUploading: false,
        isSubmitting: false,
        isConfirming: false,
        error: message,
      }));
    }
  };

  // Combine state with confirmation status from Wagmi
  const currentState = {
    ...state,
    isConfirming: state.isConfirming || isConfirming,
  };

  return {
    state: currentState,
    applyForBounty,
    reset,
  };
}
