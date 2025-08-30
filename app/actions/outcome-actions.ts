"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface JourneyOutcome {
  id: number;
  client_id: number;
  journey_outcome: 'paid' | 'ghosted' | 'pending' | 'negotiating' | 'declined';
  outcome_notes?: string;
  revenue_amount?: number;
  recorded_at: string;
  recorded_by?: string;
  journey_duration_days?: number;
  pages_viewed?: number;
  last_page_viewed?: string;
  conversion_funnel_data?: any;
  original_hypothesis?: string;
  hypothesis_accuracy?: 'accurate' | 'partially_accurate' | 'inaccurate' | 'unknown';
  content_hypothesis_ids?: number[];
  content_changes_impact?: any;
  conversion_factors?: string;
  missed_opportunities?: string;
  next_time_improvements?: string;
  confidence_in_analysis?: number;
  metadata?: any;
}

export interface OutcomeFormState {
  success: boolean;
  error?: string;
  outcome?: JourneyOutcome;
}

/**
 * Create or update a journey outcome
 * Story 2.2: Journey Outcome Marking System
 */
export async function recordJourneyOutcome(
  prevState: OutcomeFormState,
  formData: FormData
): Promise<OutcomeFormState> {
  try {
    const clientId = parseInt(formData.get("client_id") as string);
    const journeyOutcome = formData.get("journey_outcome") as string;
    const outcomeNotes = formData.get("outcome_notes") as string;
    const revenueAmountStr = formData.get("revenue_amount") as string;
    const conversionFactors = formData.get("conversion_factors") as string;
    const missedOpportunities = formData.get("missed_opportunities") as string;
    const nextTimeImprovements = formData.get("next_time_improvements") as string;
    const confidenceStr = formData.get("confidence_in_analysis") as string;
    const hypothesisAccuracy = formData.get("hypothesis_accuracy") as string;

    // Story 2.3: Extract new detailed notes fields
    const timelineNotes = formData.get("timeline_notes") as string;
    const behaviorObservations = formData.get("behavior_observations") as string;
    const revenueIntelligence = formData.get("revenue_intelligence") as string;
    const competitiveNotes = formData.get("competitive_notes") as string;
    const actionableInsights = formData.get("actionable_insights") as string;
    const outcomeTags = formData.get("outcome_tags") as string;
    const learningPriority = formData.get("learning_priority") as string;

    // Validate required fields
    if (!clientId || !journeyOutcome) {
      return { success: false, error: "Client ID and outcome are required" };
    }

    // Parse optional numeric fields
    const revenueAmount = revenueAmountStr ? parseFloat(revenueAmountStr) : null;
    const confidence = confidenceStr ? parseInt(confidenceStr) : null;

    // Get client data for correlation
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return { success: false, error: "Client not found" };
    }

    // Calculate journey duration
    const journeyDurationDays = Math.floor(
      (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Prepare outcome data with Story 2.3 enhancements
    const outcomeData = {
      client_id: clientId,
      journey_outcome: journeyOutcome,
      outcome_notes: outcomeNotes || null,
      revenue_amount: revenueAmount,
      recorded_by: "admin", // In a real app, this would be the current user
      journey_duration_days: journeyDurationDays,
      original_hypothesis: client.hypothesis,
      hypothesis_accuracy: hypothesisAccuracy || 'unknown',
      conversion_factors: conversionFactors || null,
      missed_opportunities: missedOpportunities || null,
      next_time_improvements: nextTimeImprovements || null,
      confidence_in_analysis: confidence,
      
      // Story 2.3: Rich notes fields for deep learning
      timeline_notes: timelineNotes || null,
      behavior_observations: behaviorObservations || null,
      revenue_intelligence: revenueIntelligence || null,
      competitive_notes: competitiveNotes || null,
      actionable_insights: actionableInsights || null,
      outcome_tags: outcomeTags || null,
      learning_priority: learningPriority || 'medium',
      
      metadata: {
        recorded_from: "dashboard",
        client_status_at_recording: client.status,
        notes_version: "2.3", // Track Story 2.3 implementation
        has_detailed_notes: !!(timelineNotes || behaviorObservations || revenueIntelligence || competitiveNotes || actionableInsights),
        tags_array: outcomeTags ? outcomeTags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      },
    };

    // Insert outcome record
    const { data: outcome, error: insertError } = await supabase
      .from("journey_outcomes")
      .insert(outcomeData)
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return { success: false, error: "Failed to record outcome" };
    }

    // Revalidate dashboard to show updated data
    revalidatePath("/dashboard");

    return { 
      success: true, 
      outcome: outcome as JourneyOutcome 
    };
  } catch (error) {
    console.error("Error recording journey outcome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing journey outcome
 */
export async function updateJourneyOutcome(
  outcomeId: number,
  updateData: Partial<JourneyOutcome>
): Promise<OutcomeFormState> {
  try {
    const { data: outcome, error } = await supabase
      .from("journey_outcomes")
      .update(updateData)
      .eq("id", outcomeId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: "Failed to update outcome" };
    }

    revalidatePath("/dashboard");
    return { success: true, outcome: outcome as JourneyOutcome };
  } catch (error) {
    console.error("Error updating journey outcome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get journey outcome for a client
 */
export async function getJourneyOutcome(
  clientId: number
): Promise<{ success: boolean; outcome?: JourneyOutcome; error?: string }> {
  try {
    const { data: outcome, error } = await supabase
      .from("journey_outcomes")
      .select("*")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
      console.error("Database error:", error);
      return { success: false, error: "Failed to fetch outcome" };
    }

    return { success: true, outcome: outcome as JourneyOutcome || undefined };
  } catch (error) {
    console.error("Error fetching journey outcome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get all journey outcomes for analytics
 */
export async function getAllJourneyOutcomes(): Promise<{
  success: boolean;
  outcomes?: JourneyOutcome[];
  error?: string;
}> {
  try {
    const { data: outcomes, error } = await supabase
      .from("journey_outcomes")
      .select(`
        *,
        clients!inner(company, contact, email, hypothesis)
      `)
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: "Failed to fetch outcomes" };
    }

    return { success: true, outcomes: outcomes as JourneyOutcome[] };
  } catch (error) {
    console.error("Error fetching journey outcomes:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get outcome analytics
 */
export async function getOutcomeAnalytics(): Promise<{
  success: boolean;
  analytics?: any;
  error?: string;
}> {
  try {
    const { data: analytics, error } = await supabase
      .from("journey_outcome_analytics")
      .select("*");

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: "Failed to fetch analytics" };
    }

    return { success: true, analytics };
  } catch (error) {
    console.error("Error fetching outcome analytics:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete a journey outcome
 */
export async function deleteJourneyOutcome(
  outcomeId: number
): Promise<OutcomeFormState> {
  try {
    const { error } = await supabase
      .from("journey_outcomes")
      .delete()
      .eq("id", outcomeId);

    if (error) {
      console.error("Database error:", error);
      return { success: false, error: "Failed to delete outcome" };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting journey outcome:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}