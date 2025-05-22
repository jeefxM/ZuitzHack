import { ArrowLeft, AlertTriangle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ApplyBountyFormProps } from "@/lib/types";

export default function ApplyBountyForm({
  bounty,
  formData,
  handleInputChange,
  errors,
  isSubmitting,
  showSuccess,
  onSubmit,
  onBack,
}: ApplyBountyFormProps) {
  if (!bounty) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to bounty details
      </Button>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b border-gray-100 bg-gray-50 px-8 py-4">
          <div className="flex items-center">
            <Badge className="mr-3 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
              {bounty.reward} ETH
            </Badge>
            <h1 className="text-xl font-semibold text-gray-900">
              Apply for: {bounty.title}
            </h1>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {showSuccess && (
            <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Application Submitted Successfully!</AlertTitle>
              <AlertDescription>
                Your application has been received. You'll be notified if the
                bounty creator has any questions or updates.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Application Tips</AlertTitle>
            <AlertDescription>
              Be specific about your experience, proposed solution, and
              timeline. Quality applications stand out from the competition.
            </AlertDescription>
          </Alert>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Proposal Details */}
            <div className="space-y-2">
              <Label
                htmlFor="proposal"
                className="text-sm font-medium text-gray-700"
              >
                Proposal Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="proposal"
                name="proposal"
                rows={6}
                value={formData.proposal}
                onChange={(e) => handleInputChange("proposal", e.target.value)}
                placeholder="Describe how you plan to approach this bounty and your proposed solution..."
                className={errors.proposal ? "border-red-300" : ""}
              />
              {errors.proposal && (
                <p className="text-sm text-red-600 mt-1">{errors.proposal}</p>
              )}
              <p className="text-xs text-gray-500">
                Be specific about your approach, technology choices, and
                methodology.
              </p>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label
                htmlFor="experience"
                className="text-sm font-medium text-gray-700"
              >
                Relevant Experience
              </Label>
              <Textarea
                id="experience"
                name="experience"
                rows={4}
                value={formData.experience}
                onChange={(e) =>
                  handleInputChange("experience", e.target.value)
                }
                placeholder="Describe your relevant experience, skills, and past projects..."
              />
              <p className="text-xs text-gray-500">
                Highlight previous work related to this bounty's requirements.
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label
                htmlFor="timeline"
                className="text-sm font-medium text-gray-700"
              >
                Proposed Timeline <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="timeline"
                name="timeline"
                rows={3}
                value={formData.timeline}
                onChange={(e) => handleInputChange("timeline", e.target.value)}
                placeholder="Outline your expected timeline with key milestones..."
                className={errors.timeline ? "border-red-300" : ""}
              />
              {errors.timeline && (
                <p className="text-sm text-red-600 mt-1">{errors.timeline}</p>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-2">
              <Label
                htmlFor="questions"
                className="text-sm font-medium text-gray-700"
              >
                Questions for Bounty Creator
              </Label>
              <Textarea
                id="questions"
                name="questions"
                rows={3}
                value={formData.questions}
                onChange={(e) => handleInputChange("questions", e.target.value)}
                placeholder="Any questions about the requirements or scope?"
              />
            </div>

            {/* Terms */}
            <div className="pt-4">
              <div className="flex items-start">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    handleInputChange("acceptTerms", checked as boolean)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="acceptTerms"
                  className="ml-3 text-sm text-gray-700"
                >
                  I agree to the{" "}
                  <a href="#" className="text-indigo-600 hover:text-indigo-800">
                    terms and conditions
                  </a>{" "}
                  and understand that my wallet address will be visible to the
                  bounty creator.
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600 mt-1">{errors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <Separator className="my-6" />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
