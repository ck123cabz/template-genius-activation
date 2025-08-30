"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { 
  ContentHypothesis, 
  ContentChangeType, 
  ContentHypothesisStatus 
} from "@/lib/supabase";

// Create Supabase server client
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Create a new content hypothesis before editing journey page content
 * Story 2.1: Pre-Edit Hypothesis Capture Interface
 */
export async function createContentHypothesis(
  journeyPageId: number,
  hypothesis: string,
  changeType: ContentChangeType,
  predictedOutcome?: string,
  confidenceLevel?: number,
  previousContent?: string,
  createdBy?: string
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    // Validate input
    if (!hypothesis?.trim()) {
      return { success: false, error: "Hypothesis is required" };
    }

    if (!['content', 'title', 'both', 'structure'].includes(changeType)) {
      return { success: false, error: "Invalid change type" };
    }

    if (confidenceLevel && (confidenceLevel < 1 || confidenceLevel > 10)) {
      return { success: false, error: "Confidence level must be between 1 and 10" };
    }

    // Verify journey page exists
    const { data: journeyPage, error: pageError } = await supabaseServer
      .from("journey_pages")
      .select("id, title, content")
      .eq("id", journeyPageId)
      .single();

    if (pageError) {
      console.error("Error finding journey page:", pageError);
      return { success: false, error: "Journey page not found" };
    }

    // Store current content as previous content if not provided
    const currentContent = previousContent || JSON.stringify({
      title: journeyPage.title,
      content: journeyPage.content
    });

    const hypothesisData = {
      journey_page_id: journeyPageId,
      hypothesis: hypothesis.trim(),
      change_type: changeType,
      predicted_outcome: predictedOutcome?.trim() || null,
      confidence_level: confidenceLevel || null,
      previous_content: currentContent,
      created_by: createdBy || "admin",
      status: "active" as ContentHypothesisStatus,
      metadata: {
        created_at_timestamp: new Date().toISOString(),
        journey_page_title: journeyPage.title
      }
    };

    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .insert(hypothesisData)
      .select()
      .single();

    if (error) {
      console.error("Error creating content hypothesis:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, hypothesis: data };
  } catch (error) {
    console.error("Unexpected error creating content hypothesis:", error);
    return { success: false, error: "Failed to create content hypothesis" };
  }
}

/**
 * Get content hypotheses for a specific journey page
 */
export async function getContentHypothesesByPage(
  journeyPageId: number
): Promise<{ success: boolean; error?: string; hypotheses?: ContentHypothesis[] }> {
  try {
    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .select("*")
      .eq("journey_page_id", journeyPageId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching content hypotheses:", error);
      return { success: false, error: error.message };
    }

    return { success: true, hypotheses: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching content hypotheses:", error);
    return { success: false, error: "Failed to fetch content hypotheses" };
  }
}

/**
 * Update a content hypothesis with new content or outcome
 */
export async function updateContentHypothesis(
  hypothesisId: number,
  updates: {
    new_content?: string;
    actual_outcome?: string;
    status?: ContentHypothesisStatus;
    conversion_impact?: Record<string, any>;
  }
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.new_content) {
      updateData.new_content = updates.new_content;
    }

    if (updates.actual_outcome) {
      updateData.actual_outcome = updates.actual_outcome;
      updateData.outcome_recorded_at = new Date().toISOString();
    }

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.conversion_impact) {
      updateData.conversion_impact = updates.conversion_impact;
    }

    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .update(updateData)
      .eq("id", hypothesisId)
      .select()
      .single();

    if (error) {
      console.error("Error updating content hypothesis:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, hypothesis: data };
  } catch (error) {
    console.error("Unexpected error updating content hypothesis:", error);
    return { success: false, error: "Failed to update content hypothesis" };
  }
}

/**
 * Enhanced journey page content update with hypothesis tracking
 * Integrates with existing updateJourneyPageContent from journey-actions.ts
 */
export async function updateJourneyPageContentWithHypothesis(
  pageId: number,
  title: string,
  content: string,
  hypothesisId?: number,
  hypothesis?: string
): Promise<{ success: boolean; error?: string; page?: any; hypothesisData?: ContentHypothesis }> {
  try {
    const updateData: any = {
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    // If hypothesis provided, store it in metadata (following existing Epic 1 pattern)
    if (hypothesis && hypothesis.trim()) {
      const { data: currentPage } = await supabaseServer
        .from("journey_pages")
        .select("metadata")
        .eq("id", pageId)
        .single();

      const existingMetadata = currentPage?.metadata || {};
      updateData.metadata = {
        ...existingMetadata,
        edit_hypothesis: hypothesis.trim(),
        last_edit_at: new Date().toISOString()
      };
    }

    // Update the journey page content
    const { data: pageData, error: pageError } = await supabaseServer
      .from("journey_pages")
      .update(updateData)
      .eq("id", pageId)
      .select()
      .single();

    if (pageError) {
      console.error("Error updating journey page content:", pageError);
      return { success: false, error: pageError.message };
    }

    // If hypothesis ID provided, update the hypothesis with new content
    let hypothesisData: ContentHypothesis | undefined;
    if (hypothesisId) {
      const newContentSnapshot = JSON.stringify({
        title: title.trim(),
        content: content.trim()
      });

      const hypothesisResult = await updateContentHypothesis(hypothesisId, {
        new_content: newContentSnapshot,
        status: "active"
      });

      if (hypothesisResult.success) {
        hypothesisData = hypothesisResult.hypothesis;
      }
    }

    revalidatePath("/dashboard");
    return { 
      success: true, 
      page: pageData,
      hypothesisData: hypothesisData
    };
  } catch (error) {
    console.error("Unexpected error updating journey page content with hypothesis:", error);
    return { success: false, error: "Failed to update journey page content with hypothesis" };
  }
}

/**
 * Get latest hypothesis for a journey page (for displaying in editor)
 */
export async function getLatestContentHypothesis(
  journeyPageId: number
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .select("*")
      .eq("journey_page_id", journeyPageId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error fetching latest content hypothesis:", error);
      return { success: false, error: error.message };
    }

    return { success: true, hypothesis: data || undefined };
  } catch (error) {
    console.error("Unexpected error fetching latest content hypothesis:", error);
    return { success: false, error: "Failed to fetch latest content hypothesis" };
  }
}

/**
 * Record outcome for a hypothesis after content changes are implemented
 */
export async function recordHypothesisOutcome(
  hypothesisId: number,
  actualOutcome: string,
  conversionImpact?: Record<string, any>
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    if (!actualOutcome?.trim()) {
      return { success: false, error: "Actual outcome is required" };
    }

    const result = await updateContentHypothesis(hypothesisId, {
      actual_outcome: actualOutcome.trim(),
      status: "validated",
      conversion_impact: conversionImpact || {}
    });

    return result;
  } catch (error) {
    console.error("Unexpected error recording hypothesis outcome:", error);
    return { success: false, error: "Failed to record hypothesis outcome" };
  }
}