"use client";

import { useState, useEffect } from "react";
import { contentService } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Clock,
  Users,
  CheckCircle,
  Building2,
  Briefcase,
  DollarSign,
  CreditCard,
  Shield,
  Award,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const defaultContent = {
  activation: {
    title: "Activate Priority Access",
    subtitle: "Get first access to top talent and enhanced recruitment support",
    benefits: [
      {
        title: "Priority Talent Access",
        description:
          "First look at pre-vetted candidates from our premium pool",
        icon: "star",
      },
      {
        title: "Accelerated Timeline",
        description: "Dedicated 14-day search period with faster results",
        icon: "clock",
      },
      {
        title: "Dedicated Support",
        description: "Personal talent specialist and enhanced screening",
        icon: "users",
      },
      {
        title: "Committed Search",
        description: "Focused 14-day search period for optimal results",
        icon: "check",
      },
    ],
    paymentOptions: {
      optionA: {
        title: "Traditional Placement",
        description: "25% placement fee upon successful hire",
        fee: "$500",
        details: "Activation fee credited towards placement fee when you hire",
        additionalInfo: "+ 25% placement fee (activation fee credited)",
      },
      optionB: {
        title: "Monthly Retainer",
        description:
          "Monthly retainer acts as placement fee with future buyout option",
        fee: "$500",
        details: "Activation fee credited towards first month's retainer",
        additionalInfo: "+ $1,200/month retainer (acts as placement fee)",
        popular: true,
      },
    },
    investmentDetails: [
      "Your $500 activation fee is fully credited towards your placement fee or first month's retainer",
      "No hidden costs or additional fees during the search process",
      "Transparent pricing with clear value delivery milestones",
    ],
    guaranteeInfo: {
      period: "6-month replacement coverage",
      description:
        "Free replacement if hired candidate doesn't work out within 6 months",
    },
    searchPeriod: "14-day priority access",
    activationFee: "$500",
  },
};

export default function PreviewActivationPage() {
  const [content, setContent] = useState(defaultContent);
  const [isLoading, setIsLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        const contentData = await contentService.getCurrent();
        if (contentData) {
          setContent(contentData);
        } else {
          // Keep default content if no data from Supabase
          setContent(defaultContent);
        }
      } catch (error) {
        console.error("Error loading content:", error);
        // Use default content on error
        setContent(defaultContent);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "star":
        return <Star className="w-4 h-4 text-orange-600" />;
      case "clock":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "users":
        return <Users className="w-4 h-4 text-orange-600" />;
      case "check":
        return <CheckCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Star className="w-4 h-4 text-orange-600" />;
    }
  };

  if (isLoading || !content?.activation) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading preview...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Preview Header */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium text-sm">
                  Preview Mode
                </span>
              </div>
              <Link
                href="/dashboard?tab=content"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Editor
              </Link>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              This is a preview of your activation page with current content
              settings
            </p>
          </div>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Genius%20Logo%20-%20Light%202-gC6g2vyhQtht3shTSIzEBgta6vmSoU.png"
              alt="Genius Logo"
              className="w-10 h-10"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {content.activation.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {content.activation.subtitle}
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="w-4 h-4" />
              <span>6-Month Guarantee</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>{content.activation.searchPeriod}</span>
            </div>
          </div>
        </div>

        <Card className="mb-8 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 p-3 bg-orange-50 rounded-xl">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Preview Company
                </h3>
                <p className="text-gray-600">Contact: Preview User (CEO)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Investment
              </h2>
              <p className="text-gray-700">
                Select the engagement model that works best for your hiring
                needs
              </p>
            </div>

            <div className="space-y-4">
              {/* Option A */}
              <div
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedOption === "A"
                    ? "border-orange-500 bg-white shadow-lg"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() => setSelectedOption("A")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === "A"
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedOption === "A" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {content.activation.paymentOptions.optionA.title}
                      </h4>
                      <span className="text-2xl font-bold text-orange-600">
                        {content.activation.paymentOptions.optionA.fee}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {content.activation.paymentOptions.optionA.details}
                    </p>
                    <div className="text-xs text-gray-500">
                      {content.activation.paymentOptions.optionA.additionalInfo}
                    </div>
                  </div>
                </div>
              </div>

              {/* Option B */}
              <div
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedOption === "B"
                    ? "border-orange-500 bg-white shadow-lg"
                    : "border-gray-200 bg-white hover:border-orange-300"
                }`}
                onClick={() => setSelectedOption("B")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedOption === "B"
                            ? "border-orange-500 bg-orange-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedOption === "B" && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">
                        {content.activation.paymentOptions.optionB.title}
                      </h4>
                      {content.activation.paymentOptions.optionB.popular && (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                          Popular
                        </span>
                      )}
                      <span className="text-2xl font-bold text-orange-600">
                        {content.activation.paymentOptions.optionB.fee}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {content.activation.paymentOptions.optionB.details}
                    </p>
                    <div className="text-xs text-gray-500">
                      {content.activation.paymentOptions.optionB.additionalInfo}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-5 text-gray-900">
              Your Priority Search Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Position</span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  Preview Position
                </span>
              </div>

              <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    Salary Range
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  $2,000 - $3,000/month
                </span>
              </div>

              <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-150 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    Search Period
                  </span>
                </div>
                <span className="font-bold text-orange-600 text-lg">
                  {content.activation.searchPeriod}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-5 text-gray-900">
              What You Get
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {content.activation.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getIconComponent(benefit.icon)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">
                Investment Details
              </h3>
              <Link
                href="/agreement"
                className="text-orange-500 hover:text-orange-600 text-sm font-medium underline"
              >
                View Full Agreement →
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Activation Fee:</span>
                <span className="font-semibold text-gray-900">
                  {content.activation.activationFee} (credited towards final
                  fee)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Search Period:</span>
                <span className="font-semibold text-gray-900">
                  {content.activation.searchPeriod}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Guarantee:</span>
                <span className="font-semibold text-gray-900">
                  {content.activation.guaranteeInfo.period}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="space-y-1">
                {content.activation.investmentDetails.map((detail, index) => (
                  <p key={index} className="text-xs text-gray-600">
                    • {detail}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-lg font-semibold text-gray-900 mb-2"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-12 text-base border-2 border-gray-200 focus:border-orange-500"
              placeholder="Enter your full name"
            />
          </div>

          <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
            <Checkbox
              id="agreement"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1 w-4 h-4 border-2 border-gray-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <div className="flex-1">
              <label
                htmlFor="agreement"
                className="text-base font-medium text-gray-900 cursor-pointer"
              >
                I agree to the terms and conditions{" "}
                <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">
                I have the authority to bind Preview Company to this agreement
                and understand the payment terms.
              </p>
            </div>
          </div>

          <Button
            disabled={!agreed || !fullName || !selectedOption}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed h-14 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {`Activate & Pay ${content.activation.activationFee}`}
          </Button>

          <div className="text-center text-xs text-gray-500">
            <p className="flex items-center justify-center space-x-2">
              <CreditCard className="w-3 h-3" />
              <span>Secure payment powered by Stripe • SSL encrypted</span>
            </p>
            <p className="mt-2 text-orange-600 font-medium">
              ⚠️ Preview Mode - Payment functionality is disabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
