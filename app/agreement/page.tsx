"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { contentService, AgreementContent } from "@/lib/supabase";

export default function AgreementPage() {
  const router = useRouter();
  const [content, setContent] = useState<AgreementContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true);
        const agreementData = await contentService.getAgreementContent();
        setContent(agreementData);
      } catch (error) {
        console.error("Error loading agreement content:", error);
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
          <p className="text-muted-foreground">Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Agreement content not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Activation</span>
        </button>
      </div>

      <div className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Genius%20Logo%20-%20Light%202-gC6g2vyhQtht3shTSIzEBgta6vmSoU.png"
                alt="Genius Logo"
                className="w-10 h-10"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              {content.main_title}
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            {/* Agreement Content */}
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                This Talent Engagement Agreement (the "Agreement") is entered
                into as of the date of signature below (the "Effective Date"),
                by and between:
              </p>

              <p className="text-gray-700 mb-6 leading-relaxed">
                <strong>{content.company_info.legal_name}</strong>{" "}
                {content.company_info.website}, a company organized and existing under the laws
                of Cyprus, with its principal place of business at {content.company_info.address} (hereinafter referred to as "{content.company_info.name}")
              </p>

              <p className="text-gray-700 mb-6 leading-relaxed">
                <strong>and</strong>
              </p>

              <p className="text-gray-700 mb-8 leading-relaxed">
                <strong>Client Company</strong> (hereinafter referred to as the
                "Client")
              </p>

              <p className="text-gray-700 mb-12 leading-relaxed">
                (Each a "Party" and collectively the "Parties")
              </p>

              {/* Section 1 */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-orange-600 mb-8 border-b-2 border-orange-100 pb-3">
                  1. Definitions
                </h2>
                <p className="text-gray-700 mb-8 text-lg leading-relaxed">
                  For the purposes of this Agreement, the following terms shall
                  have the meanings set forth below:
                </p>

                {content.definitions.map((definition, index) => (
                  <div key={index} className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-6 rounded-r-lg">
                    <p className="text-gray-700 leading-relaxed">
                      <strong>1.{index + 1} "{definition.term}"</strong> {definition.definition}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dynamic Sections */}
              {content.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-12">
                  <h2 className="text-2xl font-bold text-orange-600 mb-8 border-b-2 border-orange-100 pb-3">
                    {sectionIndex + 2}. {section.title}
                  </h2>

                  <div className="mb-6">
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-gray-700 mb-6 text-lg leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.subsections && section.subsections.map((subsection, subIndex) => (
                    <div key={subIndex} className={`mb-6 ${
                      subsection.highlight 
                        ? "bg-orange-50 border-2 border-orange-200 rounded-xl p-8" 
                        : ""
                    }`}>
                      {subsection.highlight && (
                        <h3 className="text-xl font-bold text-orange-800 mb-4">
                          {subsection.title}
                        </h3>
                      )}
                      <div className="text-gray-700 text-lg leading-relaxed">
                        {subsection.content.split('\n').map((line, lineIndex) => (
                          <p key={lineIndex} className="mb-2">
                            {line.startsWith('•') ? (
                              <span>
                                {line.includes(':') && line.includes(';') ? (
                                  line
                                ) : (
                                  line
                                )}
                              </span>
                            ) : (
                              line
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="text-center mt-16 pt-8 border-t-2 border-gray-200">
                <p className="text-gray-700 mb-6 text-xl leading-relaxed">
                  {content.footer_text}
                </p>
                <p className="text-gray-700 text-xl leading-relaxed">
                  {content.contact_info.support_text}{" "}
                  <a
                    href={`mailto:${content.contact_info.email}`}
                    className="text-orange-500 hover:text-orange-600 font-bold underline"
                  >
                    {content.contact_info.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
