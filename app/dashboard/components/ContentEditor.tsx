"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Save } from "lucide-react";
import { ActivationContent } from "@/lib/supabase";
import { updateContent } from "@/app/actions/content-actions";
import { useFormState } from "react-dom";

interface ContentEditorProps {
  initialContent: ActivationContent | null;
}

export default function ContentEditor({ initialContent }: ContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Initialize form data from initial content or defaults
  const getInitialData = () => {
    if (!initialContent) {
      return {
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
      };
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

  const [updateState, updateAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      const result = await updateContent(contentData);
      if (result.success) {
        setIsEditing(false);
      }
      return result;
    },
    { success: false },
  );

  const handleSave = () => {
    startTransition(() => {
      updateAction(new FormData());
    });
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
            Customize the activation page content
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Content
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
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
            Content updated successfully!
          </p>
        </div>
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
