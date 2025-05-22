// View type constants
export const ViewType = {
  LIST: "list",
  DETAILS: "details",
  CREATE: "create",
  APPLY: "apply",
};

// Initial mock data
export const initialBounties = [
  {
    id: "1",
    title: "Develop Smart Contract for NFT Marketplace",
    description:
      "Looking for a developer to create a secure smart contract for an NFT marketplace with support for royalties and auctions.",
    longDescription:
      "Looking for a developer to create a secure smart contract for an NFT marketplace with support for royalties and auctions.\n\nRequirements:\n- ERC-721 and ERC-1155 support\n- Royalty mechanism for creators (EIP-2981)\n- Dutch and English auction capability\n- Lazy minting option\n- Gas optimization\n- Full test coverage",
    reward: "0.5",
    creator: "0x1234...5678",
    createdAt: "2023-05-20",
    deadline: "2023-06-10",
    status: "open",
    applicants: 2,
    tags: ["Smart Contract", "NFT", "Solidity"],
    difficulty: "Advanced",
  },
  {
    id: "2",
    title: "Design DeFi Dashboard UI",
    description:
      "Need a clean, intuitive UI design for a DeFi dashboard that displays user portfolio, yield farming stats, and transaction history.",
    longDescription:
      "Need a clean, intuitive UI design for a DeFi dashboard that displays user portfolio, yield farming stats, and transaction history. Looking for modern design with clear data visualization and mobile responsiveness.",
    reward: "0.3",
    creator: "0xabcd...ef12",
    createdAt: "2023-05-18",
    deadline: "2023-06-05",
    status: "open",
    applicants: 1,
    tags: ["Design", "UI/UX", "Dashboard"],
    difficulty: "Intermediate",
  },
  {
    id: "3",
    title: "Create Tutorial for Web3 Authentication",
    description:
      "Create a comprehensive tutorial explaining how to implement web3 authentication in a Next.js application using wagmi and ethers.js.",
    longDescription:
      "Create a comprehensive tutorial explaining how to implement web3 authentication in a Next.js application using wagmi and ethers.js. Should include code examples and step-by-step instructions.",
    reward: "0.2",
    creator: "0x7890...abcd",
    createdAt: "2023-05-15",
    deadline: "2023-05-30",
    status: "open",
    applicants: 0,
    tags: ["Tutorial", "Web3", "Authentication"],
    difficulty: "Beginner",
  },
];

// Available tags for form selection
export const availableTags = [
  "Smart Contract",
  "NFT",
  "DeFi",
  "DAO",
  "Layer 2",
  "Frontend",
  "Backend",
  "Design",
  "UI/UX",
  "Solidity",
  "Web3",
  "Documentation",
  "Tutorial",
  "Research",
  "Testing",
];

// Difficulty options
export const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];
