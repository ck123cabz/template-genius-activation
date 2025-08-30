"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit3, Save, AlertCircle, Lightbulb } from "lucide-react";
import { ActivationContent } from "@/lib/supabase";
import { updateContent } from "@/app/actions/content-actions";
import { updateClientJourneyPageByType } from "@/app/actions/journey-actions";
import { useFormState } from "react-dom";

interface ContentEditorProps {
  initialContent?: ActivationContent | null;
  clientId?: number;
  pageType?: 'activation' | 'agreement' | 'confirmation' | 'processing';
  onUnsavedChange?: (hasUnsaved: boolean) => void;
  onContentChange?: (content: any) => void;
}

// Common hypothesis options for dropdown
const COMMON_HYPOTHESES = [
  { value: "readability", label: "Improved readability will increase engagement" },
  { value: "urgency", label: "Adding urgency will drive faster decisions" },
  { value: "social_proof", label: "Social proof will build trust and credibility" },
  { value: "value_proposition", label: "Clearer value proposition will improve conversions" },
  { value: "risk_reduction", label: "Reducing perceived risk will increase completion" },
  { value: "simplification", label: "Simplifying the process will reduce drop-off" },
  { value: "personalization", label: "More personalized content will increase relevance" },
  { value: "benefits_focus", label: "Emphasizing benefits over features will convert better" },
  { value: "custom", label: "Custom hypothesis..." }
];

export default function ContentEditor({ 
  initialContent, 
  clientId,
  pageType = 'activation',
  onUnsavedChange,
  onContentChange
}: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Hypothesis capture state
  const [hypothesis, setHypothesis] = useState("");
  const [selectedHypothesis, setSelectedHypothesis] = useState("");
  const [customHypothesis, setCustomHypothesis] = useState("");
  const [showHypothesisError, setShowHypothesisError] = useState(false);

  // Get page-specific template data
  const getPageTemplate = (pageType: string) => {
    const templates = {
      activation: {
        title: "Activate Your Priority Access",
        subtitle: "Complete your activation to unlock exclusive opportunities",
        benefits: [
          {
            title: "Priority Access",
            description: "Get first access to exclusive opportunities",
            icon: "Crown",
          },
          {
            title: "Expert Network",
            description: "Connect with industry leaders",
            icon: "Users",
          },
          {
            title: "Premium Support",
            description: "24/7 dedicated support",
            icon: "Shield",
          },
        ],
        payment_options: {
          optionA: {
            title: "One-Time Activation",
            description: "Single payment",
            fee: "$2,500",
          },
          optionB: {
            title: "Monthly Plan",
            description: "Spread over 12 months",
            fee: "$250/month",
          },
        },
        investment_details: [
          "Minimum investment starting at $10,000",
          "Diversified portfolio management",
          "Quarterly performance reports",
          "Access to private equity opportunities",
        ],
      },
      agreement: {
        title: "Service Agreement",
        subtitle: "Review and accept our terms of service",
        benefits: [
          {
            title: "Legal Protection",
            description: "Comprehensive legal coverage",
            icon: "Shield",
          },
          {
            title: "Clear Terms",
            description: "Transparent agreement terms",
            icon: "FileText",
          },
          {
            title: "Dispute Resolution",
            description: "Fair dispute resolution process",
            icon: "Scale",
          },
        ],
        payment_options: {
          optionA: {
            title: "Standard Agreement",
            description: "Our standard terms",
            fee: "Included",
          },
          optionB: {
            title: "Custom Agreement",
            description: "Customized terms available",
            fee: "Contact us",
          },
        },
        investment_details: [
          "Terms and conditions apply",
          "30-day notice period for changes",
          "Legal compliance guaranteed",
          "Professional liability coverage",
        ],
      },
      confirmation: {
        title: "Confirm Your Details",
        subtitle: "Please confirm your information is correct",
        benefits: [
          {
            title: "Data Accuracy",
            description: "Ensure all details are correct",
            icon: "CheckCircle",
          },
          {
            title: "Quick Processing",
            description: "Faster processing with accurate data",
            icon: "Zap",
          },
          {
            title: "Easy Updates",
            description: "Update information anytime",
            icon: "Edit",
          },
        ],
        payment_options: {
          optionA: {
            title: "Confirm Details",
            description: "Proceed with current information",
            fee: "No charge",
          },
          optionB: {
            title: "Update Information",
            description: "Make changes before proceeding",
            fee: "No charge",
          },
        },
        investment_details: [
          "Review all information carefully",
          "Contact details will be used for communication",
          "Financial information secured with encryption",
          "Data processing in compliance with regulations",
        ],
      },
      processing: {
        title: "Processing Your Request",
        subtitle: "Your application is being processed",
        benefits: [
          {
            title: "Status Updates",
            description: "Real-time processing updates",
            icon: "Bell",
          },
          {
            title: "Fast Processing",
            description: "Quick turnaround time",
            icon: "Clock",
          },
          {
            title: "Secure Handling",
            description: "Secure data processing",
            icon: "Lock",
          },
        ],
        payment_options: {
          optionA: {
            title: "Standard Processing",
            description: "3-5 business days",
            fee: "Included",
          },
          optionB: {
            title: "Express Processing",
            description: "1-2 business days",
            fee: "$100",
          },
        },
        investment_details: [
          "Processing typically takes 2-3 business days",
          "You will receive email confirmation",
          "Status updates available in your dashboard",
          "Support available during processing",
        ],
      },
    };

    return templates[pageType as keyof typeof templates] || templates.activation;
  };

  // Initialize form data from initial content or defaults
  const getInitialData = () => {
    if (!initialContent) {
      return getPageTemplate(pageType);
    }

    return {
      title: initialContent.title,
      subtitle: initialContent.subtitle,
      benefits: Array.isArray(initialContent.benefits)
        ? initialContent.benefits
        : [],
      payment_options: initialContent.payment_options || {
        optionA: { title: "", description: "", fee: "" },
        optionB: { title: "", description: "", fee: "" },
      },
      investment_details: Array.isArray(initialContent.investment_details)
        ? initialContent.investment_details
        : [],
    };
  };

  const [contentData, setContentData] = useState(getInitialData());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData] = useState(getInitialData());

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(contentData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
    onUnsavedChange?.(hasChanges);
  }, [contentData, originalData, onUnsavedChange]);

  // Notify parent of content changes
  useEffect(() => {
    onContentChange?.(contentData);
  }, [contentData, onContentChange]);

  const [updateState, updateAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      // Get final hypothesis value (custom or selected)
      const finalHypothesis = selectedHypothesis === 'custom' ? customHypothesis : 
        COMMON_HYPOTHESES.find(h => h.value === selectedHypothesis)?.label || hypothesis;
      
      // Validate hypothesis is provided
      if (!finalHypothesis || finalHypothesis.trim() === '') {
        setShowHypothesisError(true);
        return { success: false, error: "Page hypothesis is required before saving content changes" };
      }
      
      setShowHypothesisError(false);
      
      // Use the new journey page update action with hypothesis tracking
      if (clientId && pageType) {
        const result = await updateClientJourneyPageByType(
          clientId, 
          pageType as any, 
          contentData,
          { 
            edit_hypothesis: finalHypothesis,
            hypothesis_type: selectedHypothesis || 'custom',
            content_update_reason: finalHypothesis
          }
        );
        
        if (result.success) {
          setIsEditing(false);
          // Reset hypothesis fields after successful save
          setHypothesis("");
          setSelectedHypothesis("");
          setCustomHypothesis("");
        }
        return result;
      } else {
        // Fallback to original content update if no clientId/pageType
        const result = await updateContent(contentData);
        if (result.success) {
          setIsEditing(false);
        }
        return result;
      }
    },
    { success: false },
  );

  const handleSave = () => {
    // Get final hypothesis value
    const finalHypothesis = selectedHypothesis === 'custom' ? customHypothesis : 
      COMMON_HYPOTHESES.find(h => h.value === selectedHypothesis)?.label || hypothesis;
    
    // Show error if no hypothesis provided
    if (!finalHypothesis || finalHypothesis.trim() === '') {
      setShowHypothesisError(true);
      return;
    }
    
    setShowHypothesisError(false);
    startTransition(() => {
      updateAction(new FormData());
    });
  };
  
  // Handle hypothesis selection change
  const handleHypothesisChange = (value: string) => {
    setSelectedHypothesis(value);
    if (value !== 'custom') {
      setCustomHypothesis("");
      const selectedOption = COMMON_HYPOTHESES.find(h => h.value === value);
      if (selectedOption) {
        setHypothesis(selectedOption.label);
      }
    } else {
      setHypothesis("");
    }
    setShowHypothesisError(false);
  };

  const updateBenefit = (
    index: number,
    field: "title" | "description" | "icon",
    value: string,
  ) => {
    const newBenefits = [...contentData.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setContentData({ ...contentData, benefits: newBenefits });
  };

  const updateInvestmentDetail = (index: number, value: string) => {
    const newDetails = [...contentData.investment_details];
    newDetails[index] = value;
    setContentData({ ...contentData, investment_details: newDetails });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">
            Customize the {pageType} page content
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Content
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => {
              setIsEditing(false);
              // Reset hypothesis fields on cancel
              setHypothesis("");
              setSelectedHypothesis("");
              setCustomHypothesis("");
              setShowHypothesisError(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="w-4 h-4 mr-2" />
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {updateState?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{updateState.error}</p>
        </div>
      )}

      {updateState?.success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">
            Content updated successfully with hypothesis tracking!
          </p>
        </div>
      )}
      
      {/* Hypothesis Capture Section - Only shown when editing */}
      {isEditing && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              Page Hypothesis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Explain why you believe these content changes will improve conversion outcomes.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hypothesis Dropdown */}
            <div>
              <Label htmlFor="hypothesis-select">Common Hypothesis Types</Label>
              <Select value={selectedHypothesis} onValueChange={handleHypothesisChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a common hypothesis or choose custom..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_HYPOTHESES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom Hypothesis Entry */}
            {selectedHypothesis === 'custom' ? (
              <div>
                <Label htmlFor="custom-hypothesis">Custom Hypothesis</Label>
                <Textarea
                  id="custom-hypothesis"
                  placeholder="Describe your hypothesis for why these changes will improve conversions..."
                  value={customHypothesis}
                  onChange={(e) => {
                    setCustomHypothesis(e.target.value);
                    setHypothesis(e.target.value);
                    setShowHypothesisError(false);
                  }}
                  rows={3}
                  className="w-full"
                />
              </div>
            ) : selectedHypothesis && (
              <div>
                <Label>Selected Hypothesis</Label>
                <div className="p-3 bg-blue-50 rounded border text-sm text-blue-700">
                  {COMMON_HYPOTHESES.find(h => h.value === selectedHypothesis)?.label}
                </div>
              </div>
            )}
            
            {/* Alternative Manual Entry */}
            {!selectedHypothesis && (
              <div>
                <Label htmlFor="manual-hypothesis">Or Enter Hypothesis Manually</Label>
                <Textarea
                  id="manual-hypothesis"
                  placeholder="Describe your hypothesis for why these changes will improve conversions..."
                  value={hypothesis}
                  onChange={(e) => {
                    setHypothesis(e.target.value);
                    setShowHypothesisError(false);
                  }}
                  rows={3}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Hypothesis Required Error */}
            {showHypothesisError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Page hypothesis is required before saving content changes. Please select or enter your hypothesis about why these changes will improve conversions.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Content */}
        <Card>
          <CardHeader>
            <CardTitle>Header Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={contentData.title}
                onChange={(e) =>
                  setContentData({ ...contentData, title: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={contentData.subtitle}
                onChange={(e) =>
                  setContentData({ ...contentData, subtitle: e.target.value })
                }
                disabled={!isEditing}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium">Option A</h4>
              <Input
                placeholder="Title"
                value={contentData.payment_options.optionA.title}
                onChange={(e) =>
                  setContentData({
                    ...contentData,
                    payment_options: {
                      ...contentData.payment_options,
                      optionA: {
                        ...contentData.payment_options.optionA,
                        title: e.target.value,
                      },
                    },
                  })
                }
                disabled={!isEditing}
              />
              <Textarea
                placeholder="Description"
                value={contentData.payment_options.optionA.description}
                onChange={(e) =>
                  setContentData({
                    ...contentData,
                    payment_options: {
                      ...contentData.payment_options,
                      optionA: {
                        ...contentData.payment_options.optionA,
                        description: e.target.value,
                      },
                    },
                  })
                }
                disabled={!isEditing}
                rows={2}
              />
              <Input
                placeholder="Fee"
                value={contentData.payment_options.optionA.fee}
                onChange={(e) =>
                  setContentData({
                    ...contentData,
                    payment_options: {
                      ...contentData.payment_options,
                      optionA: {
                        ...contentData.payment_options.optionA,
                        fee: e.target.value,
                      },
                    },
                  })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Option B</h4>
              <Input
                placeholder="Title"
                value={contentData.payment_options.optionB.title}
                onChange={(e) =>
                  setContentData({
                    ...contentData,
                    payment_options: {
                      ...contentData.payment_options,
                      optionB: {
                        ...contentData.payment_options.optionB,
                        title: e.target.value,
                      },
                    },
                  })
                }
                disabled={!isEditing}
              />
              <Textarea
                placeholder="Description"
                value={contentData.payment_options.optionB.description}
                onChange={(e) =>
                  setContentData({
                    ...contentData,
                    payment_options: {
                      ...contentData.payment_options,
                      optionB: {
                        ...contentData.payment_options.optionB,
                        description: e.target.value,
                      },
                    },
                  })
                }
                disabled={!isEditing}
                rows={2}
              />
              <Input
                placeholder="Fee"
                value={contentData.payment_options.optionB.fee}
                onChange={(e) =>
                  setContentData({
                    ...contentData,
                    payment_options: {
                      ...contentData.payment_options,
                      optionB: {
                        ...contentData.payment_options.optionB,
                        fee: e.target.value,
                      },
                    },
                  })
                }
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contentData.benefits.map((benefit, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <Input
                  placeholder={`Benefit ${index + 1} title`}
                  value={benefit.title}
                  onChange={(e) =>
                    updateBenefit(index, "title", e.target.value)
                  }
                  disabled={!isEditing}
                />
                <Textarea
                  placeholder="Description"
                  value={benefit.description}
                  onChange={(e) =>
                    updateBenefit(index, "description", e.target.value)
                  }
                  disabled={!isEditing}
                  rows={2}
                />
                <Input
                  placeholder="Icon name (e.g., Crown, Users, Shield)"
                  value={benefit.icon}
                  onChange={(e) => updateBenefit(index, "icon", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contentData.investment_details.map((detail, index) => (
              <Textarea
                key={index}
                placeholder={`Investment detail ${index + 1}`}
                value={detail}
                onChange={(e) => updateInvestmentDetail(index, e.target.value)}
                disabled={!isEditing}
                rows={2}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
