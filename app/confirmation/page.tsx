"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { contentService, ConfirmationContent } from "@/lib/supabase";

export default function ConfirmationPage() {
  const [content, setContent] = useState<ConfirmationContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        const confirmationData = await contentService.getConfirmationContent();
        setContent(confirmationData);
      } catch (error) {
        console.error("Error loading confirmation content:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadContent();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Confirmation content not found.</p>
        </div>
      </div>
    );
  }

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

          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {content.success_title}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            {content.success_subtitle}
          </p>
        </div>

        <Card className="mb-10 bg-white border-2 border-green-100 shadow-md">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {content.details_section_title}
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-600 font-medium text-lg">
                    Company
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  TechCorp
                </span>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-gray-600 font-medium text-lg">
                    Position
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  Senior React Developer
                </span>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-600 font-medium text-lg">
                    Salary Range
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  $3,500 - $4,500/month
                </span>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-gray-600 font-medium text-lg">
                    Search Period
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-orange-600 text-lg block">
                    10 Days Exclusive
                  </span>
                  <span className="text-sm text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
                    Priority Access
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-600 font-medium text-lg">
                    Status
                  </span>
                </div>
                <span className="font-bold text-green-600 text-lg flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-gray-600 font-medium text-lg">
                    Started
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-lg">
                  August 22, 2025
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10 bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {content.next_steps_title}
            </h2>
            <div className="space-y-8">
              {content.next_steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {step.step_number}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      {step.title} ({step.timeline})
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-10 bg-orange-50 border-2 border-orange-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-orange-800 mb-4">
              {content.contact_section.title}
            </h3>
            <p className="text-orange-700 mb-6 text-lg leading-relaxed">
              {content.contact_section.description}
            </p>
            <p className="text-orange-700 text-lg">
              Email:{" "}
              <a
                href={`mailto:${content.contact_section.email}`}
                className="font-bold underline hover:text-orange-800"
              >
                {content.contact_section.email}
              </a>
            </p>
          </CardContent>
        </Card>

        <Button className="w-full bg-gray-800 hover:bg-gray-900 text-white py-6 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 h-16 rounded-xl">
          {content.download_button_text}
        </Button>
      </div>
    </div>
  );
}
