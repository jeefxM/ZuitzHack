"use client";

import { useState, useEffect } from "react";
import {
  ViewType,
  CreateBountyFormData,
  ApplyBountyFormData,
  FormErrors,
} from "@/lib/types";

// Import the real hooks and components
import { useAllBounties, type EnhancedBounty } from "@/hooks/useAllBounties";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BountyList from "@/components/BountyList";
import BountyDetails from "@/components/BountyDetails";
import CreateBountyForm from "@/components/CreateBountyForm";
import ApplyBountyForm from "@/components/ApplyBountyForm";
import MyBounties from "@/components/MyBounties";

export default function BountyApp() {
  // Get real bounty data from blockchain
  const { bounties, totalBounties, stats, isLoading, isLoadingMetadata } =
    useAllBounties();
  console.log("Bounties:", totalBounties);

  // Main state
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.LIST);
  const [selectedBountyId, setSelectedBountyId] = useState<number | null>(null);
  const [appliedBounties, setAppliedBounties] = useState<number[]>([]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");

  // Form states
  const [newBounty, setNewBounty] = useState<CreateBountyFormData>({
    title: "",
    description: "",
    reward: "",
    deadline: "",
    tags: [],
    difficulty: "Intermediate",
  });

  const [application, setApplication] = useState<ApplyBountyFormData>({
    proposal: "",
    experience: "",
    timeline: "",
    questions: "",
    acceptTerms: false,
  });

  // UI states
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Derived state
  const selectedBounty =
    bounties.find((b) => b.id === selectedBountyId) || null;
  const hasApplied = selectedBountyId
    ? appliedBounties.includes(selectedBountyId)
    : false;

  // Filtered bounties for the list view
  const filteredBounties = bounties.filter((bounty) => {
    const matchesSearch =
      searchQuery === "" ||
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bounty.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      filterTag === "" ||
      (bounty.tags &&
        bounty.tags.some(
          (tag) => tag.toLowerCase() === filterTag.toLowerCase()
        ));

    return matchesSearch && matchesTag;
  });

  // All unique tags for filter
  const allTags = [...new Set(bounties.flatMap((b) => b.tags || []))];

  // Navigation functions
  const viewBounties = () => {
    setCurrentView(ViewType.LIST);
    setSelectedBountyId(null);
  };

  const viewMyBounties = () => {
    setCurrentView(ViewType.MY_BOUNTIES);
    setSelectedBountyId(null);
  };

  const viewBountyDetails = (id: number) => {
    setSelectedBountyId(id);
    setCurrentView(ViewType.DETAILS);
  };

  const startCreateBounty = () => {
    setCurrentView(ViewType.CREATE);
    setNewBounty({
      title: "",
      description: "",
      reward: "",
      deadline: "",
      tags: [],
      difficulty: "Intermediate",
    });
    setErrors({});
    setShowSuccess(false);
  };

  const startApplyForBounty = () => {
    setCurrentView(ViewType.APPLY);
    setApplication({
      proposal: "",
      experience: "",
      timeline: "",
      questions: "",
      acceptTerms: false,
    });
    setErrors({});
    setShowSuccess(false);
  };

  // Form handling functions
  const handleBountyFormChange = (
    field: keyof CreateBountyFormData,
    value: string | string[]
  ) => {
    setNewBounty((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplicationChange = (
    field: keyof ApplyBountyFormData,
    value: string | boolean
  ) => {
    setApplication((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagSelection = (tag: string) => {
    setNewBounty((prev) => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter((t) => t !== tag),
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag],
        };
      }
    });
  };

  // Form validation
  const validateBountyForm = (): boolean => {
    let formErrors: FormErrors = {};
    let isValid = true;

    if (!newBounty.title.trim()) {
      formErrors.title = "Title is required";
      isValid = false;
    }

    if (!newBounty.description.trim()) {
      formErrors.description = "Description is required";
      isValid = false;
    }

    if (
      !newBounty.reward ||
      isNaN(parseFloat(newBounty.reward)) ||
      parseFloat(newBounty.reward) <= 0
    ) {
      formErrors.reward = "Valid reward amount is required";
      isValid = false;
    }

    if (!newBounty.deadline) {
      formErrors.deadline = "Deadline is required";
      isValid = false;
    } else {
      const deadlineDate = new Date(newBounty.deadline);
      const today = new Date();
      if (deadlineDate <= today) {
        formErrors.deadline = "Deadline must be in the future";
        isValid = false;
      }
    }

    setErrors(formErrors);
    return isValid;
  };

  const validateApplicationForm = (): boolean => {
    let formErrors: FormErrors = {};
    let isValid = true;

    if (!application.proposal.trim()) {
      formErrors.proposal = "Proposal details are required";
      isValid = false;
    }

    if (!application.timeline.trim()) {
      formErrors.timeline = "Timeline is required";
      isValid = false;
    }

    if (!application.acceptTerms) {
      formErrors.terms = "You must accept the terms to continue";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  // Real bounty submission (handled by CreateBountyForm component)
  const submitBounty = (e: React.FormEvent) => {
    e.preventDefault();
    // The actual submission is handled by the CreateBountyForm component
    // This is just for validation here
    if (!validateBountyForm()) return;
  };

  // Application submission (this would integrate with your backend)
  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateApplicationForm()) return;

    setIsSubmitting(true);

    // TODO: Integrate with your backend to submit application
    // For now, simulate the submission
    setTimeout(() => {
      if (selectedBountyId) {
        // Add to applied bounties
        setAppliedBounties([...appliedBounties, selectedBountyId]);
        console.log("Application submitted for bounty:", selectedBountyId);
        console.log("Application data:", application);
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      // Reset form after showing success
      setTimeout(() => {
        setShowSuccess(false);
        viewBountyDetails(selectedBountyId!);
      }, 2000);
    }, 1500);
  };

  // Filter reset
  const resetFilters = () => {
    setSearchQuery("");
    setFilterTag("");
  };

  // Handle success from CreateBountyForm
  const handleBountyCreated = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      viewBounties();
    }, 2000);
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case ViewType.LIST:
        return (
          <BountyList
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            allTags={allTags}
            resetFilters={resetFilters}
            onViewDetails={viewBountyDetails}
          />
        );

      case ViewType.MY_BOUNTIES:
        return (
          <MyBounties
            onBack={viewBounties}
            onCreateBounty={startCreateBounty}
            onViewDetails={viewBountyDetails}
          />
        );

      case ViewType.DETAILS:
        return (
          <BountyDetails
            bounty={selectedBounty}
            hasApplied={hasApplied}
            onBack={() => {
              // Go back to the previous view (could be LIST or MY_BOUNTIES)
              // For now, default to LIST - you could track previous view if needed
              viewBounties();
            }}
            onApply={startApplyForBounty}
          />
        );

      case ViewType.CREATE:
        return (
          <CreateBountyForm
            formData={newBounty}
            handleInputChange={handleBountyFormChange}
            handleTagSelection={handleTagSelection}
            errors={errors}
            isSubmitting={isSubmitting}
            showSuccess={showSuccess}
            onSubmit={submitBounty}
            onBack={viewBounties}
          />
        );

      case ViewType.APPLY:
        return (
          <ApplyBountyForm
            bounty={selectedBounty}
            formData={application}
            handleInputChange={handleApplicationChange}
            errors={errors}
            isSubmitting={isSubmitting}
            showSuccess={showSuccess}
            onSubmit={submitApplication}
            onBack={() => viewBountyDetails(selectedBountyId!)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onCreateBounty={startCreateBounty}
        onViewBounties={viewBounties}
        onViewMyBounties={viewMyBounties}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show loading state while fetching initial data */}
        {isLoading &&
          (currentView === ViewType.LIST ||
            currentView === ViewType.MY_BOUNTIES) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Loading bounties from blockchain...
              </p>
            </div>
          )}

        {/* Show stats if available and on main list view */}
        {stats && currentView === ViewType.LIST && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Bounties
                </h3>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.total}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Active Bounties
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Completed
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}
