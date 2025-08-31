import { supabase } from "./supabase";
import { Client, ActivationContent } from "./supabase";

// Reuse the existing supabase client for server-side operations
export const supabaseServer = supabase;

// Mock data for server-side fallback (same as client-side mock data)
const mockClients: Client[] = [
  {
    id: 1,
    company: "TechCorp Solutions",
    contact: "John Smith",
    email: "john@techcorp.com",
    position: "Senior Software Engineer",
    salary: "$120,000 - $150,000",
    hypothesis: "John's current role lacks growth opportunities and he values work-life balance and remote flexibility. Our premium placement service should emphasize career advancement and flexible work arrangements to drive conversion.",
    token: "G1001",
    status: "pending",
    created_at: "2024-01-15T00:00:00Z",
    activated_at: null,
    logo: "/techcorp-logo.png",
    // Story 2.2: Journey Outcome Tracking
    journey_outcome: "responded",
    outcome_notes: "Client responded positively to proposal and requested additional information about timeline. Showing strong interest in premium service package.",
    outcome_timestamp: "2024-01-17T14:30:00Z",
    payment_received: false,
    payment_amount: null,
    payment_timestamp: null,
  },
];

const mockContent = {
  activation: {
    title: "Activate Priority Access",
    subtitle: "Get first access to top talent and enhanced recruitment support",
    benefits: [
      {
        title: "Priority Talent Access",
        description: "First look at pre-vetted candidates from our premium pool",
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

// Server-side client operations
export const serverClientService = {
  async getAll(): Promise<Client[]> {
    try {
      const { data, error } = await supabaseServer
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("Supabase query failed, using mock data:", error);
      return [...mockClients];
    }
  },

  async getById(id: number): Promise<Client | null> {
    try {
      const { data, error } = await supabaseServer
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn("Supabase query failed, using mock data:", error);
      return mockClients.find((client) => client.id === id) || null;
    }
  },
};

// Server-side content operations
export const serverContentService = {
  async getCurrent(): Promise<any> {
    try {
      const { data, error } = await supabaseServer
        .from("activation_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn("Supabase content query failed, using mock data:", error);
      return mockContent;
    }
  },
};
