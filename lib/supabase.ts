import { createClient } from "@supabase/supabase-js";

// Types for our database tables
export interface Client {
  id: number;
  company: string;
  contact: string;
  email: string;
  position: string;
  salary: string;
  hypothesis: string;
  token: string;
  status: "pending" | "activated";
  created_at: string;
  activated_at: string | null;
  logo: string | null;
}

export interface ActivationContent {
  id: number;
  title: string;
  subtitle: string;
  benefits: {
    title: string;
    description: string;
    icon: string;
  }[];
  payment_options: {
    optionA: {
      title: string;
      description: string;
      fee: string;
    };
    optionB: {
      title: string;
      description: string;
      fee: string;
    };
  };
  investment_details: string[];
  updated_at: string;
}

export interface AgreementContent {
  id: number;
  page_title: string;
  main_title: string;
  company_info: {
    name: string;
    legal_name: string;
    website: string;
    address: string;
  };
  definitions: {
    term: string;
    definition: string;
  }[];
  sections: {
    title: string;
    content: string;
    subsections?: {
      title: string;
      content: string;
      highlight?: boolean;
    }[];
  }[];
  contact_info: {
    email: string;
    support_text: string;
  };
  footer_text: string;
  updated_at: string;
}

export interface ConfirmationContent {
  id: number;
  page_title: string;
  success_title: string;
  success_subtitle: string;
  details_section_title: string;
  next_steps_title: string;
  next_steps: {
    step_number: number;
    title: string;
    description: string;
    timeline: string;
  }[];
  contact_section: {
    title: string;
    description: string;
    email: string;
  };
  download_button_text: string;
  updated_at: string;
}

// Mock data for fallback when Supabase is not available
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
  },
];;

const mockContent = {
  id: 1,
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
  payment_options: {
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
  investment_details: [
    "Your $500 activation fee is fully credited towards your placement fee or first month's retainer",
    "No hidden costs or additional fees during the search process",
    "Transparent pricing with clear value delivery milestones",
  ],
  updated_at: "2024-01-15T00:00:00Z",
};

const mockAgreementContent: AgreementContent = {
  id: 1,
  page_title: "Talent Engagement Agreement",
  main_title: "Talent Engagement Agreement",
  company_info: {
    name: "Genius",
    legal_name: "Famelix Ltd, doing business as \"Genius,\"",
    website: "joingenius.com",
    address: "Saphous 5, 6577 Paphos, Cyprus",
  },
  definitions: [
    {
      term: "Candidate",
      definition: "means any professional individual recommended by Genius to the Client for potential engagement.",
    },
    {
      term: "Placement",
      definition: "means the engagement of a Candidate by the Client in any capacity, whether as an employee, contractor, or consultant.",
    },
    {
      term: "Placement Fee",
      definition: "means the compensation payable to Genius upon the Client's hiring of a Candidate, as described in Section 5 of this Agreement.",
    },
    {
      term: "Services",
      definition: "means the talent sourcing and placement services provided by Genius as detailed in Section 2 of this Agreement.",
    },
  ],
  sections: [
    {
      title: "Scope of Services",
      content: "Genius shall provide the following Services to the Client:",
      subsections: [
        {
          title: "Service Items",
          content: "• Sourcing, screening, and evaluating global talent according to the Client's specified requirements;\n• Presenting qualified Candidates to the Client;\n• Facilitating interviews between the Client and selected Candidates;\n• Providing relevant Candidate profiles, qualifications, skills assessments, and other pertinent information;\n• Assisting with the engagement process if the Client chooses to hire a Candidate.",
        },
        {
          title: "Performance Disclaimer",
          content: "Genius does not guarantee the performance or conduct of any Candidate engaged by the Client. While Genius commits to thoroughly vetting all candidates to ensure the best possible match, the Client is solely responsible for making the final decision to engage candidates and for managing the relationship with any engaged Candidate thereafter.",
        },
      ],
    },
    {
      title: "Engagement Process and Exclusivity",
      content: "Upon execution of this Agreement, Genius will begin sourcing Candidates based on the Client's requirements. Genius will present qualified Candidates to the Client within 7-10 business days of receiving complete position requirements.",
      subsections: [
        {
          title: "Exclusivity Period",
          content: "The Client commits to working exclusively with Genius during the candidate search process (7-10 days on average). During this exclusivity period, the Client agrees not to engage any other recruiting services or agencies for the same position(s).",
          highlight: true,
        },
        {
          title: "Client Obligations",
          content: "During the engagement process and for a period of sixty (60) days thereafter, the Client agrees not to:\n• Circumvent Genius by directly hiring or engaging any Candidate introduced by Genius without paying the applicable Placement Fee;\n• Share Candidate information with any third party without Genius's prior written consent;\n• Engage the Candidate through another agency or intermediary to avoid paying the Placement Fee.",
        },
        {
          title: "Breach Consequences",
          content: "Breach of these provisions shall entitle Genius to immediate payment of the full Placement Fee plus any additional damages incurred.",
        },
        {
          title: "Value Exchange",
          content: "This exclusivity commitment is in exchange for Genius providing its Services without any upfront fees or deposits, with compensation contingent solely upon successful placement.",
        },
      ],
    },
  ],
  contact_info: {
    email: "info@joingenius.com",
    support_text: "For questions about this Agreement, contact:",
  },
  footer_text: "This Agreement may be executed electronically and shall be deemed valid when signed through the Priority Access confirmation process.",
  updated_at: "2024-01-15T00:00:00Z",
};

const mockConfirmationContent: ConfirmationContent = {
  id: 1,
  page_title: "Priority Access Activated!",
  success_title: "Priority Access Activated!",
  success_subtitle: "Your search begins now — we're already getting to work",
  details_section_title: "Confirmed Search Details",
  next_steps_title: "What Happens Next",
  next_steps: [
    {
      step_number: 1,
      title: "Dream Candidate Profile",
      description: "You'll receive a detailed candidate specification document within 2-3 hours for your review and approval.",
      timeline: "Today",
    },
    {
      step_number: 2,
      title: "First Qualified Profiles",
      description: "Receive your first batch of pre-vetted, qualified candidates that match your approved specifications.",
      timeline: "5-7 Business Days",
    },
    {
      step_number: 3,
      title: "Progress Updates",
      description: "Regular updates on search progress, candidate pipeline status, and next steps throughout your priority period.",
      timeline: "Every 2-3 Days",
    },
  ],
  contact_section: {
    title: "Questions or Need to Update Requirements?",
    description: "Our team is here to ensure your search success",
    email: "info@joingenius.com",
  },
  download_button_text: "Download Agreement (PDF)",
  updated_at: "2024-01-15T00:00:00Z",
};

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;
let useSupabase = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    useSupabase = true;
  } catch (error) {
    console.warn("Supabase client creation failed, using mock data:", error);
    useSupabase = false;
  }
} else {
  console.warn("Supabase environment variables not found, using mock data");
  useSupabase = false;
}

export { supabase };

// Client operations
export const clientService = {
  async getAll(): Promise<Client[]> {
    if (!useSupabase) {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [...mockClients];
    }

    try {
      const { data, error } = await supabase
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

  async getById(id: string | number): Promise<Client | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    if (!useSupabase) {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockClients.find((client) => client.id === numericId) || null;
    }

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", numericId)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.warn("Supabase query failed, using mock data:", error);
      return mockClients.find((client) => client.id === numericId) || null;
    }
  },

  async create(
    client: Omit<Client, "id" | "created_at" | "activated_at">,
  ): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...client,
        status: "pending",
        created_at: new Date().toISOString(),
        activated_at: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(
    id: number,
    updates: Partial<Omit<Client, "id" | "created_at" | "status">>,
  ): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(
    id: number,
    status: "pending" | "activated",
  ): Promise<Client> {
    const updates: any = { status };
    if (status === "activated") {
      updates.activated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) throw error;
  },
};

// Content operations
export const contentService = {
  // Agreement content operations
  async getAgreementContent(): Promise<AgreementContent | null> {
    if (!useSupabase) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockAgreementContent;
    }

    try {
      const { data, error } = await supabase
        .from("agreement_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return mockAgreementContent;
      return data || mockAgreementContent;
    } catch (error) {
      console.warn("Supabase agreement content query failed, using mock data:", error);
      return mockAgreementContent;
    }
  },

  async updateAgreementContent(content: Partial<AgreementContent>): Promise<AgreementContent> {
    if (!useSupabase) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ...mockAgreementContent, ...content, updated_at: new Date().toISOString() } as AgreementContent;
    }

    try {
      const { data: existingData } = await supabase
        .from("agreement_content")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      const contentWithTimestamp = {
        ...content,
        updated_at: new Date().toISOString(),
      };

      let data, error;

      if (existingData) {
        const result = await supabase
          .from("agreement_content")
          .update(contentWithTimestamp)
          .eq("id", existingData.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("agreement_content")
          .insert(contentWithTimestamp)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn("Supabase agreement content update failed:", error);
      return { ...mockAgreementContent, ...content, updated_at: new Date().toISOString() } as AgreementContent;
    }
  },

  // Confirmation content operations
  async getConfirmationContent(): Promise<ConfirmationContent | null> {
    if (!useSupabase) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockConfirmationContent;
    }

    try {
      const { data, error } = await supabase
        .from("confirmation_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return mockConfirmationContent;
      return data || mockConfirmationContent;
    } catch (error) {
      console.warn("Supabase confirmation content query failed, using mock data:", error);
      return mockConfirmationContent;
    }
  },

  async updateConfirmationContent(content: Partial<ConfirmationContent>): Promise<ConfirmationContent> {
    if (!useSupabase) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { ...mockConfirmationContent, ...content, updated_at: new Date().toISOString() } as ConfirmationContent;
    }

    try {
      const { data: existingData } = await supabase
        .from("confirmation_content")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      const contentWithTimestamp = {
        ...content,
        updated_at: new Date().toISOString(),
      };

      let data, error;

      if (existingData) {
        const result = await supabase
          .from("confirmation_content")
          .update(contentWithTimestamp)
          .eq("id", existingData.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("confirmation_content")
          .insert(contentWithTimestamp)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn("Supabase confirmation content update failed:", error);
      return { ...mockConfirmationContent, ...content, updated_at: new Date().toISOString() } as ConfirmationContent;
    }
  },
  async getCurrent(): Promise<any> {
    // Try localStorage first for cached content
    const localStorageKey = 'activation_content_cache';
    
    if (!useSupabase) {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Check localStorage for saved content (browser only)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const savedContent = localStorage.getItem(localStorageKey);
          if (savedContent) {
            const parsed = JSON.parse(savedContent);
            console.log("Loading content from localStorage");
            return parsed;
          }
        } catch (e) {
          console.warn("Failed to load from localStorage:", e);
        }
      }
      
      // Return default mock data if no localStorage
      return {
        activation: {
          title: mockContent.title,
          subtitle: mockContent.subtitle,
          benefits: mockContent.benefits,
          paymentOptions: mockContent.payment_options,
          investmentDetails: mockContent.investment_details,
          guaranteeInfo: {
            period: "6-month replacement coverage",
            description:
              "Free replacement if hired candidate doesn't work out within 6 months",
          },
          searchPeriod: "14-day priority access",
          activationFee: "$500",
        },
      };
    }

    try {
      const { data, error } = await supabase
        .from("activation_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      
      // Transform Supabase data into expected format
      if (data) {
        return {
          activation: {
            title: data.title || mockContent.title,
            subtitle: data.subtitle || mockContent.subtitle,
            benefits: data.benefits || mockContent.benefits,
            paymentOptions: data.payment_options || mockContent.payment_options,
            investmentDetails: data.investment_details || mockContent.investment_details,
            guaranteeInfo: data.guarantee_info || {
              period: "6-month replacement coverage",
              description:
                "Free replacement if hired candidate doesn't work out within 6 months",
            },
            searchPeriod: data.search_period || "14-day priority access",
            activationFee: data.activation_fee || "$500",
          },
        };
      }
      
      return null;
    } catch (error) {
      console.warn("Supabase content query failed, checking localStorage:", error);
      
      // Try localStorage fallback (browser only)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const savedContent = localStorage.getItem(localStorageKey);
          if (savedContent) {
            const parsed = JSON.parse(savedContent);
            console.log("Loading content from localStorage after Supabase failure");
            return parsed;
          }
        } catch (e) {
          console.warn("Failed to load from localStorage:", e);
        }
      }
      
      // Return mock data in expected format
      return {
        activation: {
          title: mockContent.title,
          subtitle: mockContent.subtitle,
          benefits: mockContent.benefits,
          paymentOptions: mockContent.payment_options,
          investmentDetails: mockContent.investment_details,
          guaranteeInfo: {
            period: "6-month replacement coverage",
            description:
              "Free replacement if hired candidate doesn't work out within 6 months",
          },
          searchPeriod: "14-day priority access",
          activationFee: "$500",
        },
      };
    }
  },

  async update(content: any): Promise<any> {
    const localStorageKey = 'activation_content_cache';
    
    // Always save to localStorage for fallback (browser only)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(content));
        console.log("Content saved to localStorage");
      } catch (e) {
        console.warn("Failed to save to localStorage:", e);
      }
    }
    
    if (!useSupabase) {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Return the updated content in the same format
      return content;
    }

    try {
      // Extract the activation data from the wrapper
      const activationData = content.activation || content;
      
      // Transform camelCase fields to snake_case for database
      const dbContent = {
        title: activationData.title,
        subtitle: activationData.subtitle,
        benefits: activationData.benefits,
        payment_options: activationData.paymentOptions || activationData.payment_options,
        investment_details: activationData.investmentDetails || activationData.investment_details,
        guarantee_info: activationData.guaranteeInfo || activationData.guarantee_info,
        search_period: activationData.searchPeriod || activationData.search_period,
        activation_fee: activationData.activationFee || activationData.activation_fee,
        updated_at: new Date().toISOString(),
      };

      // First try to get existing content
      const { data: existingData } = await supabase
        .from("activation_content")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      let data, error;

      if (existingData) {
        // Update existing content
        const result = await supabase
          .from("activation_content")
          .update(dbContent)
          .eq("id", existingData.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new content
        const result = await supabase
          .from("activation_content")
          .insert(dbContent)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
      // Transform the response back to the UI format
      if (data) {
        const transformedContent = {
          activation: {
            title: data.title,
            subtitle: data.subtitle,
            benefits: data.benefits,
            paymentOptions: data.payment_options,
            investmentDetails: data.investment_details,
            guaranteeInfo: data.guarantee_info || {
              period: "6-month replacement coverage",
              description: "Free replacement if hired candidate doesn't work out within 6 months",
            },
            searchPeriod: data.search_period || "14-day priority access",
            activationFee: data.activation_fee || "$500",
          },
        };
        
        // Update localStorage with successful save (browser only)
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(transformedContent));
            console.log("Content synced to localStorage after Supabase save");
          } catch (e) {
            console.warn("Failed to sync to localStorage:", e);
          }
        }
        
        return transformedContent;
      }
      
      return content;
    } catch (error) {
      console.error("Supabase content update failed, using localStorage:", error);
      // Content is already saved to localStorage at the beginning of this function
      // Return the content to maintain UI state
      return content;
    }
  },
};
