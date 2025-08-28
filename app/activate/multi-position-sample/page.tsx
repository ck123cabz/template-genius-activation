"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, Users, CheckCircle, Building2 } from "lucide-react";
import Link from "next/link";

export default function MultiPositionSamplePage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (!agreed || !fullName) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      router.push("/processing");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Genius%20Logo%20-%20Light%202-gC6g2vyhQtht3shTSIzEBgta6vmSoU.png"
              alt="Genius Logo"
              className="w-10 h-10"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Activate Priority Access
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Get first access to top talent and enhanced recruitment support
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="flex items-start space-x-4 p-4">
            <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Priority Talent Access
              </h3>
              <p className="text-gray-600 leading-relaxed">
                First look at pre-vetted candidates from our premium pool
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Accelerated Timeline
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Dedicated 14-day search period with faster results
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dedicated Support
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Personal talent specialist and enhanced screening
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4">
            <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Committed Search
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Focused 14-day search period for optimal results
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-10 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-3 bg-orange-50 rounded-xl">
                <Building2 className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  TechCorp
                </h3>
                <p className="text-gray-600 text-lg">
                  Contact: Sarah Johnson (CEO)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10 bg-white border-2 border-orange-100 shadow-md">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-8 text-gray-900">
              Your Priority Search Details
            </h2>
            <div className="space-y-1">
              {/* Multiple Positions - Enhanced to handle multiple positions */}
              <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                    <span className="text-gray-600 font-medium text-lg">
                      Positions
                    </span>
                  </div>
                  <div className="text-right max-w-md space-y-3">
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        Senior Frontend Developer
                      </div>
                      <div className="text-sm text-gray-500">
                        React, TypeScript, Next.js
                      </div>
                    </div>
                    <div className="border-l-2 border-orange-200 pl-4">
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        Full Stack Developer
                      </div>
                      <div className="text-sm text-gray-500">
                        Node.js, PostgreSQL, AWS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Range - Enhanced with better formatting for multiple positions */}
              <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
                    <span className="text-gray-600 font-medium text-lg">
                      Salary Range
                    </span>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        $2,000 - $3,000
                      </div>
                      <div className="text-sm text-gray-500">
                        Frontend • per month
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        $2,500 - $3,500
                      </div>
                      <div className="text-sm text-gray-500">
                        Full Stack • per month
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Period - Enhanced with status indicator */}
              <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 font-medium text-lg">
                      Search Period
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-600 text-lg flex items-center space-x-2">
                      <span>14 Days Priority Access</span>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Both positions • Exclusive window
                    </div>
                  </div>
                </div>
              </div>

              {/* Commitment - Enhanced with visual emphasis */}
              <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                    <span className="text-gray-600 font-medium text-lg">
                      Commitment
                    </span>
                  </div>
                  <div className="text-right max-w-md">
                    <div className="font-bold text-gray-900 text-lg mb-1">
                      Exclusive Partnership
                    </div>
                    <div className="text-sm text-gray-500">
                      14-day dedicated search for both roles with Genius
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional metadata row for enhanced information */}
              <div className="group hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4 -m-2 border-t border-gray-100 mt-6 pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-600 font-medium text-lg">
                      Priority Level
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <Star className="w-3 h-3 mr-1" />
                      Premium Access • 2 Positions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10 bg-gray-50 border border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-700">
              Agreement & Key Terms
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-orange-400 text-xs">•</span>
                <div>
                  <span className="font-medium">Exclusivity:</span> 14-day
                  exclusive search period; no other agencies for these roles
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-400 text-xs">•</span>
                <div>
                  <span className="font-medium">Placement Fee:</span> 25% of
                  first-year compensation per hire, due within 3 days of each
                  hire
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-400 text-xs">•</span>
                <div>
                  <span className="font-medium">No Upfront Fees:</span> Payment
                  only if you hire Genius-introduced candidates
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-400 text-xs">•</span>
                <div>
                  <span className="font-medium">Replacement Guarantee:</span>{" "}
                  6-month replacement guarantee for each hire if conditions are
                  met
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-400 text-xs">•</span>
                <div>
                  <span className="font-medium">Confidentiality:</span> Keep
                  profiles confidential; 60-day non-circumvention period
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/agreement"
                className="text-orange-500 hover:text-orange-600 text-sm font-medium underline"
              >
                View Full Talent Engagement Agreement →
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Digital Signature section header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                Digital Signature
              </h3>
              <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                <span className="text-gray-400 text-xs font-bold">?</span>
              </div>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Please provide your full name and consent to complete the
              activation process.
            </p>
          </div>

          <div>
            <label
              htmlFor="fullName"
              className="block text-lg font-semibold text-gray-900 mb-3"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-14 text-lg border-2 border-gray-200 focus:border-orange-500"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-200 transition-colors">
              <Checkbox
                id="agreement"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1 w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
              />
              <div className="flex-1">
                <label
                  htmlFor="agreement"
                  className="text-lg font-medium text-gray-900 cursor-pointer"
                >
                  I agree to the terms and conditions{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-gray-600 mt-2 leading-relaxed">
                  By checking this box, I confirm that I have read, understood,
                  and agree to be bound by the terms and conditions of this
                  agreement. I acknowledge that this constitutes a legal
                  signature and I have the authority to bind TechCorp to this
                  agreement.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleActivate}
            disabled={!agreed || !fullName || isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed h-16 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? "Processing..." : "Start Priority Search"}
          </Button>
        </div>
      </div>
    </div>
  );
}
