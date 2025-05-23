// hooks/useBountyContract.ts
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useAccount,
} from "wagmi";
import { parseUnits, type Address } from "viem";

// Contract addresses - update these for your deployment
export const CONTRACTS = {
  SIMPLE_BOUNTIES: "0xCbcBF569D75B9C00B2469857c66767bA833FC641" as Address,
  USDC: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as Address,
};

// Contract ABIs
export const SIMPLE_BOUNTIES_ABI = [
  {
    inputs: [
      { name: "_amount", type: "uint256" },
      { name: "_metadataCID", type: "string" },
    ],
    name: "createBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_bountyId", type: "uint256" },
      { name: "_hunter", type: "address" },
    ],
    name: "payHunter",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_bountyId", type: "uint256" }],
    name: "cancelBounty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveBounties",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "metadataCID", type: "string" },
          { name: "hunter", type: "address" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { name: "total", type: "uint256" },
      { name: "active", type: "uint256" },
      { name: "completed", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "BountyCreated",
    type: "event",
  },
] as const;

export const USDC_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Hook for USDC operations
export function useUSDC() {
  const {
    writeContract: approveUSDC,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const { data: balanceData } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: ["0x0000000000000000000000000000000000000000"], // Will be replaced by actual address
  });

  const approveForBounty = async (amount: string) => {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    return approveUSDC({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACTS.SIMPLE_BOUNTIES, amountWei],
    });
  };

  return {
    approveForBounty,
    approveHash,
    isApprovePending,
    balance: balanceData,
  };
}

// Hook for bounty operations
export function useBounty() {
  const {
    writeContract: createBountyWrite,
    data: createBountyHash,
    isPending: isCreatePending,
    error: createError,
  } = useWriteContract();

  const {
    isLoading: isCreateConfirming,
    isSuccess: isCreateConfirmed,
    data: createReceipt,
  } = useWaitForTransactionReceipt({
    hash: createBountyHash,
  });

  const createBounty = async (amount: string, metadataCID: string) => {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    return createBountyWrite({
      address: CONTRACTS.SIMPLE_BOUNTIES,
      abi: SIMPLE_BOUNTIES_ABI,
      functionName: "createBounty",
      args: [amountWei, metadataCID],
    });
  };

  // Get active bounties
  const { data: activeBounties, refetch: refetchBounties } = useReadContract({
    address: CONTRACTS.SIMPLE_BOUNTIES,
    abi: SIMPLE_BOUNTIES_ABI,
    functionName: "getActiveBounties",
  });

  // Get stats
  const { data: stats } = useReadContract({
    address: CONTRACTS.SIMPLE_BOUNTIES,
    abi: SIMPLE_BOUNTIES_ABI,
    functionName: "getStats",
  });

  return {
    createBounty,
    createBountyHash,
    isCreatePending,
    isCreateConfirming,
    isCreateConfirmed,
    createReceipt,
    createError,
    activeBounties,
    refetchBounties,
    stats,
  };
}

// Combined hook for the full bounty creation flow with allowance checking
export function useCreateBountyFlow() {
  const { address } = useAccount();

  const {
    writeContract: approveWrite,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const {
    writeContract: createWrite,
    data: createBountyHash,
    isPending: isCreatePending,
    error: createError,
  } = useWriteContract();

  // Check current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "allowance",
      args: address ? [address, CONTRACTS.SIMPLE_BOUNTIES] : undefined,
      query: {
        enabled: !!address,
      },
    }
  );

  // Simplified transaction receipt handling - remove problematic options
  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
    data: approveReceipt,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const {
    isLoading: isCreateConfirming,
    isSuccess: isCreateConfirmed,
    data: createReceipt,
  } = useWaitForTransactionReceipt({
    hash: createBountyHash,
  });

  const checkAndApproveForBounty = async (amount: string) => {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    console.log("🔍 Checking current allowance...");
    console.log("Required amount:", amountWei.toString());
    console.log("Current allowance:", currentAllowance?.toString() || "0");

    // Check if we need approval
    if (currentAllowance && currentAllowance >= amountWei) {
      console.log("✅ Sufficient allowance already exists, skipping approval");
      return { needsApproval: false, hash: null };
    }

    console.log(
      "🔓 Approving USDC for amount:",
      amount,
      "Wei:",
      amountWei.toString()
    );

    const hash = await approveWrite({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACTS.SIMPLE_BOUNTIES, amountWei],
    });

    return { needsApproval: true, hash };
  };

  const createBounty = async (amount: string, metadataCID: string) => {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    console.log("🚀 Creating bounty with CID:", metadataCID, "Amount:", amount);

    return createWrite({
      address: CONTRACTS.SIMPLE_BOUNTIES,
      abi: SIMPLE_BOUNTIES_ABI,
      functionName: "createBounty",
      args: [amountWei, metadataCID],
    });
  };

  // Helper function to check if allowance is sufficient
  const hasInsufficientAllowance = (amount: string) => {
    if (!currentAllowance) return true;
    const amountWei = parseUnits(amount, 6);
    return currentAllowance < amountWei;
  };

  return {
    // Approval
    approveForBounty: checkAndApproveForBounty,
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveHash,
    approveReceipt,
    approveReceiptError,

    // Creation
    createBounty,
    isCreatePending,
    isCreateConfirming,
    isCreateConfirmed,
    createBountyHash,
    createReceipt,
    createError,

    // Allowance helpers
    currentAllowance,
    refetchAllowance,
    hasInsufficientAllowance,
  };
}
