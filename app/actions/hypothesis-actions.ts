"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Content Hypothesis Types
export type ContentChangeType = 'content' | 'title' | 'both' | 'structure';
export type ContentHypothesisStatus = 'active' | 'completed' | 'cancelled';

export interface ContentHypothesis {
  id?: number;
  journey_page_id: number;
  hypothesis: string;
  change_type: ContentChangeType;
  predicted_outcome?: string;
  confidence_level: number; // 1-10
  previous_content?: string;
  new_content?: string;
  created_at?: string;
  created_by?: string;
  status: ContentHypothesisStatus;
  outcome_recorded_at?: string;
  actual_outcome?: string;
  conversion_impact?: Record<string, any>;
  metadata?: Record<string, any>;
}

const supabaseServer = supabase;

/**
 * Creates a new hypothesis for a journey page content change
 */
export async function createHypothesis(
  hypothesisData: Omit<ContentHypothesis, 'id' | 'created_at' | 'status'>
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    const newHypothesis = {
      ...hypothesisData,
      status: 'active' as ContentHypothesisStatus,
      created_at: new Date().toISOString(),
      created_by: 'admin' // TODO: Get from auth context
    };

    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .insert(newHypothesis)
      .select()
      .single();

    if (error) {
      console.error("Error creating hypothesis:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, hypothesis: data };
  } catch (error) {
    console.error("Unexpected error creating hypothesis:", error);
    return { success: false, error: "Failed to create hypothesis" };
  }
}

/**
 * Gets all hypotheses for a specific journey page
 */
export async function getHypothesesByPageId(
  journeyPageId: number
): Promise<{ success: boolean; error?: string; hypotheses?: ContentHypothesis[] }> {
  try {
    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .select("*")
      .eq("journey_page_id", journeyPageId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching hypotheses:", error);
      return { success: false, error: error.message };
    }

    return { success: true, hypotheses: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching hypotheses:", error);
    return { success: false, error: "Failed to fetch hypotheses" };
  }
}

/**
 * Updates a hypothesis with outcome data
 */
export async function updateHypothesisOutcome(
  hypothesisId: number,
  actualOutcome: string,
  conversionImpact?: Record<string, any>
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    const updateData = {
      actual_outcome: actualOutcome,
      outcome_recorded_at: new Date().toISOString(),
      status: 'completed' as ContentHypothesisStatus,
      ...(conversionImpact && { conversion_impact: conversionImpact })
    };

    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .update(updateData)
      .eq("id", hypothesisId)
      .select()
      .single();

    if (error) {
      console.error("Error updating hypothesis outcome:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, hypothesis: data };
  } catch (error) {
    console.error("Unexpected error updating hypothesis outcome:", error);
    return { success: false, error: "Failed to update hypothesis outcome" };
  }
}

/**
 * Gets the most recent active hypothesis for a journey page
 */
export async function getCurrentActiveHypothesis(
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

    if (error) {
      if (error.code === 'PGRST116') {
        // No active hypothesis found
        return { success: true, hypothesis: undefined };
      }
      console.error("Error fetching current active hypothesis:", error);
      return { success: false, error: error.message };
    }

    return { success: true, hypothesis: data };
  } catch (error) {
    console.error("Unexpected error fetching current active hypothesis:", error);
    return { success: false, error: "Failed to fetch current active hypothesis" };
  }
}

/**
 * Cancels a hypothesis (marks as cancelled)
 */
export async function cancelHypothesis(
  hypothesisId: number,
  reason?: string
): Promise<{ success: boolean; error?: string; hypothesis?: ContentHypothesis }> {
  try {
    const updateData = {
      status: 'cancelled' as ContentHypothesisStatus,
      metadata: {
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'User cancelled'
      }
    };

    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .update(updateData)
      .eq("id", hypothesisId)
      .select()
      .single();

    if (error) {
      console.error("Error cancelling hypothesis:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, hypothesis: data };
  } catch (error) {
    console.error("Unexpected error cancelling hypothesis:", error);
    return { success: false, error: "Failed to cancel hypothesis" };
  }
}

/**
 * Gets hypothesis analytics for a journey page
 */
export async function getHypothesisAnalytics(
  journeyPageId: number
): Promise<{ 
  success: boolean; 
  error?: string; 
  analytics?: {
    total_hypotheses: number;
    active_hypotheses: number;
    completed_hypotheses: number;
    cancelled_hypotheses: number;
    average_confidence: number;
    change_type_distribution: Record<ContentChangeType, number>;
  } 
}> {
  try {
    const { data, error } = await supabaseServer
      .from("content_hypotheses")
      .select("status, confidence_level, change_type")
      .eq("journey_page_id", journeyPageId);

    if (error) {
      console.error("Error fetching hypothesis analytics:", error);
      return { success: false, error: error.message };
    }

    const hypotheses = data || [];
    const total_hypotheses = hypotheses.length;
    
    if (total_hypotheses === 0) {
      return { 
        success: true, 
        analytics: {
          total_hypotheses: 0,
          active_hypotheses: 0,
          completed_hypotheses: 0,
          cancelled_hypotheses: 0,
          average_confidence: 0,
          change_type_distribution: {
            content: 0,
            title: 0,
            both: 0,
            structure: 0
          }
        }
      };
    }

    const active_hypotheses = hypotheses.filter(h => h.status === 'active').length;
    const completed_hypotheses = hypotheses.filter(h => h.status === 'completed').length;
    const cancelled_hypotheses = hypotheses.filter(h => h.status === 'cancelled').length;
    
    const average_confidence = hypotheses.reduce((sum, h) => sum + h.confidence_level, 0) / total_hypotheses;
    
    const change_type_distribution = hypotheses.reduce((dist, h) => {
      dist[h.change_type as ContentChangeType] = (dist[h.change_type as ContentChangeType] || 0) + 1;
      return dist;
    }, {} as Record<ContentChangeType, number>);

    return {
      success: true,
      analytics: {
        total_hypotheses,
        active_hypotheses,
        completed_hypotheses,
        cancelled_hypotheses,
        average_confidence: Math.round(average_confidence * 10) / 10,
        change_type_distribution: {
          content: change_type_distribution.content || 0,
          title: change_type_distribution.title || 0,
          both: change_type_distribution.both || 0,
          structure: change_type_distribution.structure || 0
        }
      }
    };
  } catch (error) {
    console.error("Unexpected error calculating hypothesis analytics:", error);
    return { success: false, error: "Failed to calculate hypothesis analytics" };
  }
}