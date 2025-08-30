"use client";

import { useState, useEffect } from "react";
import { supabase, clientService, contentService, AgreementContent, ConfirmationContent } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Users, FileText } from "lucide-react";
import ClientList from "@/app/dashboard/components/ClientList";

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

export default function DashboardPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [content, setContent] = useState(defaultContent);
  const [editingContent, setEditingContent] = useState(defaultContent);
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  const [agreementContent, setAgreementContent] = useState<AgreementContent | null>(null);
  const [editingAgreementContent, setEditingAgreementContent] = useState<AgreementContent | null>(null);
  const [isEditingAgreement, setIsEditingAgreement] = useState(false);
  
  const [confirmationContent, setConfirmationContent] = useState<ConfirmationContent | null>(null);
  const [editingConfirmationContent, setEditingConfirmationContent] = useState<ConfirmationContent | null>(null);
  const [isEditingConfirmation, setIsEditingConfirmation] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [clientsData, contentData, agreementData, confirmationData] = await Promise.all([
          clientService.getAll(),
          contentService.getCurrent(),
          contentService.getAgreementContent(),
          contentService.getConfirmationContent(),
        ]);

        setClients(clientsData);
        if (contentData) {
          setContent(contentData);
          setEditingContent(contentData);
        } else {
          // Keep using defaultContent if no data from Supabase
          setContent(defaultContent);
          setEditingContent(defaultContent);
        }
        
        if (agreementData) {
          setAgreementContent(agreementData);
          setEditingAgreementContent(agreementData);
        }
        
        if (confirmationData) {
          setConfirmationContent(confirmationData);
          setEditingConfirmationContent(confirmationData);
        }
      } catch (error) {
        console.error("Error loading data from Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Genius%20Logo%20-%20Light%202-gC6g2vyhQtht3shTSIzEBgta6vmSoU.png"
                alt="Genius Logo"
                className="w-8 h-8"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Priority Access Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage client activations and content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client Management
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading from Supabase database...
                  </p>
                </div>
              </div>
            ) : (
              <ClientList initialClients={clients} />
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Content management section - Story 2.2 focuses on outcome marking
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}