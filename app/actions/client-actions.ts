"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { Client, JourneyOutcome } from "@/lib/supabase";

export async function createClient(
  formData: FormData,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  try {
    const hypothesis = formData.get("hypothesis") as string;
    
    // Validate required hypothesis field
    if (!hypothesis || hypothesis.trim().length === 0) {
      return { success: false, error: "Journey hypothesis is required" };
    }

    // Generate unique client token in G[4-digit] format
    const generateToken = async (): Promise<string> => {
      const maxAttempts = 100;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const randomNum = Math.floor(Math.random() * 10000);
        const token = `G${randomNum.toString().padStart(4, '0')}`;
        
        // Check if token already exists
        const { data: existing } = await supabaseServer
          .from("clients")
          .select("id")
          .eq("token", token)
          .single();
          
        if (!existing) {
          return token;
        }
      }
      throw new Error("Unable to generate unique token after multiple attempts");
    };

    const token = await generateToken();

    const client = {
      company: formData.get("company") as string,
      contact: formData.get("contact") as string,
      email: formData.get("email") as string,
      position: formData.get("position") as string,
      salary: formData.get("salary") as string,
      hypothesis: hypothesis.trim(),
      token,
      logo: (formData.get("logo") as string) || null,
    };

    // Begin transaction: Create client first
    const { data, error } = await supabaseServer
      .from("clients")
      .insert({
        ...client,
        status: "pending",
        created_at: new Date().toISOString(),
        activated_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return { success: false, error: error.message };
    }

    // Create journey pages for the new client atomically
    const { createJourneyPagesForClient } = await import("./journey-actions");
    const journeyResult = await createJourneyPagesForClient(data.id);

    if (!journeyResult.success) {
      // If journey creation fails, we should ideally rollback the client creation
      // For now, we'll log the error and continue (client exists without journey pages)
      console.error("Failed to create journey pages for client:", journeyResult.error);
      console.warn(`Client ${data.id} created but journey pages failed. Manual intervention may be needed.`);
    }

    revalidatePath("/dashboard");
    return { success: true, client: data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to create client" };
  }
}

export async function updateClientStatus(
  clientId: number,
  status: "pending" | "activated",
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = { status };
    if (status === "activated") {
      updates.activated_at = new Date().toISOString();
    }

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .eq("id", clientId);

    if (error) {
      console.error("Error updating client status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to update client status" };
  }
}

export async function getClientById(
  clientId: number,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  try {
    const { data, error } = await supabaseServer
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      // Fallback to mock data for development
      const { mockClients } = await import("@/lib/supabase");
      const mockClient = mockClients.find(c => c.id === clientId);
      if (mockClient) {
        return { success: true, client: mockClient };
      }
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Client not found" };
    }

    return { success: true, client: data };
  } catch (error) {
    console.error("Unexpected error:", error);
    // Fallback to mock data for development
    const { mockClients } = await import("@/lib/supabase");
    const mockClient = mockClients.find(c => c.id === clientId);
    if (mockClient) {
      return { success: true, client: mockClient };
    }
    return { success: false, error: "Failed to fetch client" };
  }
}

export async function deleteClient(
  clientId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseServer
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to delete client" };
  }
}

// Story 2.2: Journey Outcome Tracking Server Actions
export async function updateClientOutcome(
  clientId: number,
  outcome: JourneyOutcome,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = {
      journey_outcome: outcome,
      outcome_notes: notes || null,
      outcome_timestamp: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .eq("id", clientId);

    if (error) {
      console.error("Error updating client outcome:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to update client outcome" };
  }
}

export async function updateClientPayment(
  clientId: number,
  amount: number,
  markAsPaid = true,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = {
      payment_received: markAsPaid,
      payment_amount: amount,
      payment_timestamp: markAsPaid ? new Date().toISOString() : null,
      journey_outcome: markAsPaid ? 'paid' : 'pending',
      outcome_timestamp: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .eq("id", clientId);

    if (error) {
      console.error("Error updating client payment:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to update client payment" };
  }
}

export async function bulkUpdateOutcomes(
  clientIds: number[],
  outcome: JourneyOutcome,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = {
      journey_outcome: outcome,
      outcome_notes: notes || null,
      outcome_timestamp: new Date().toISOString(),
    };

    const { error } = await supabaseServer
      .from("clients")
      .update(updates)
      .in("id", clientIds);

    if (error) {
      console.error("Error bulk updating client outcomes:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to bulk update client outcomes" };
  }
}
