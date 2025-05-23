// View type enum
export enum ViewType {
  LIST = "list",
  DETAILS = "details",
  CREATE = "create",
  APPLY = "apply",
}

// Bounty status and difficulty types
export type BountyStatus = "open" | "closed";
export type BountyDifficulty = "Beginner" | "Intermediate" | "Advanced";

// Bounty interface
export interface Bounty {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  reward: string;
  creator: string;
  createdAt: string;
  deadline: string;
  status: BountyStatus;
  applicants: number;
  tags: string[];
  difficulty: BountyDifficulty;
}

// Form state interfaces
export interface CreateBountyFormData {
  title: string;
  description: string;
  reward: string;
  deadline: string;
  tags: string[];
  difficulty: BountyDifficulty;
}

export interface ApplyBountyFormData {
  proposal: string;
  experience: string;
  timeline: string;
  questions: string;
  acceptTerms: boolean;
}

// Error state interface
export interface FormErrors {
  title?: string;
  description?: string;
  reward?: string;
  deadline?: string;
  proposal?: string;
  timeline?: string;
  terms?: string;
  [key: string]: string | undefined;
}

// Component prop interfaces
export interface HeaderProps {
  onCreateBounty: () => void;
  onViewBounties: () => void;
  onViewMyBounties: () => void; // Add this prop
}

export interface BountyListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterTag: string;
  setFilterTag: (tag: string) => void;
  allTags: string[];
  resetFilters: () => void;
  onViewDetails: (id: number) => void; // Changed from string to number
}

export interface BountyCardProps {
  bounty: Bounty;
  onViewDetails: (id: string) => void;
}

export interface BountyDetailsProps {
  bounty: Bounty | null;
  hasApplied: boolean;
  onBack: () => void;
  onApply: () => void;
}

export interface CreateBountyFormProps {
  formData: CreateBountyFormData;
  handleInputChange: (
    field: keyof CreateBountyFormData,
    value: string | string[]
  ) => void;
  handleTagSelection: (tag: string) => void;
  errors: FormErrors;
  isSubmitting: boolean;
  showSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export interface ApplyBountyFormProps {
  bounty: Bounty | null;
  formData: ApplyBountyFormData;
  handleInputChange: (
    field: keyof ApplyBountyFormData,
    value: string | boolean
  ) => void;
  errors: FormErrors;
  isSubmitting: boolean;
  showSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}
