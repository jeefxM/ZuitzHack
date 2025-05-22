"use client";

import { useState, useEffect } from "react";
import {
  ViewType,
  Bounty,
  CreateBountyFormData,
  ApplyBountyFormData,
  FormErrors,
} from "@/lib/types"; // Updated import path
import { initialBounties } from "@/lib/constants";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BountyList from "@/components/BountyList";
import BountyDetails from "@/components/BountyDetails";
import CreateBountyForm from "@/components/CreateBountyForm";
import ApplyBountyForm from "@/components/ApplyBountyForm";

export default function BountyApp() {
  // Main state
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.LIST);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>(initialBounties); // Initialize with mock data
  const [appliedBounties, setAppliedBounties] = useState<string[]>([]);

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

  const viewBountyDetails = (id: string) => {
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

  // Form submission handlers
  const submitBounty = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBountyForm()) return;

    setIsSubmitting(true);

    // Create new bounty
    const bountyToAdd: Bounty = {
      id: (bounties.length + 1).toString(),
      title: newBounty.title,
      description: newBounty.description,
      longDescription: newBounty.description,
      reward: newBounty.reward,
      creator: "0x1234...5678", // This would be the connected wallet address
      createdAt: new Date().toISOString().split("T")[0],
      deadline: newBounty.deadline,
      status: "open",
      applicants: 0,
      tags: newBounty.tags,
    };

    // Simulate transaction delay
    setTimeout(() => {
      setBounties([...bounties, bountyToAdd]);
      setIsSubmitting(false);
      setShowSuccess(true);

      // Reset form after showing success
      setTimeout(() => {
        setShowSuccess(false);
        viewBounties();
      }, 2000);
    }, 1500);
  };

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateApplicationForm()) return;

    setIsSubmitting(true);

    // Simulate transaction delay
    setTimeout(() => {
      if (selectedBountyId) {
        // Add to applied bounties
        setAppliedBounties([...appliedBounties, selectedBountyId]);

        // Update application count
        setBounties(
          bounties.map((bounty) =>
            bounty.id === selectedBountyId
              ? { ...bounty, applicants: bounty.applicants + 1 }
              : bounty
          )
        );
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

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case ViewType.LIST:
        return (
          <BountyList
            bounties={filteredBounties}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            allTags={allTags}
            resetFilters={resetFilters}
            onViewDetails={viewBountyDetails}
          />
        );

      case ViewType.DETAILS:
        return (
          <BountyDetails
            bounty={selectedBounty}
            hasApplied={hasApplied}
            onBack={viewBounties}
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
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}
