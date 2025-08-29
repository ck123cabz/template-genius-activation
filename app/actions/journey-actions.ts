"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { 
  JourneyPage, 
  JourneyPageStatus, 
  JourneyPageType, 
  JourneyProgress,
  mockJourneyPageTemplates 
} from "@/lib/supabase";

const supabaseServer = supabase;

/**
 * Creates journey pages for a client using the default templates
 * Called when a new client is created to set up their 4-page journey
 */
export async function createJourneyPagesForClient(
  clientId: number
): Promise<{ success: boolean; error?: string; pages?: JourneyPage[] }> {
  try {
    // Check if journey pages already exist for this client
    const { data: existingPages } = await supabaseServer
      .from("journey_pages")
      .select("id")
      .eq("client_id", clientId);

    if (existingPages && existingPages.length > 0) {
      return { success: false, error: "Journey pages already exist for this client" };
    }

    // Create journey pages from templates
    const journeyPagesToCreate = mockJourneyPageTemplates.map((template, index) => ({
      client_id: clientId,
      page_type: template.page_type,
      page_order: template.page_order,
      title: template.title,
      content: template.content,
      status: template.status,
      metadata: template.metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null
    }));

    const { data, error } = await supabaseServer
      .from("journey_pages")
      .insert(journeyPagesToCreate)
      .select();

    if (error) {
      console.error("Error creating journey pages:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, pages: data };
  } catch (error) {
    console.error("Unexpected error creating journey pages:", error);
    return { success: false, error: "Failed to create journey pages" };
  }
}

/**
 * Updates the status of a journey page
 */
export async function updateJourneyPageStatus(
  pageId: number,
  status: JourneyPageStatus,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; page?: JourneyPage }> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // If completing the page, set completed_at timestamp
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    // If metadata provided, merge it with existing metadata
    if (metadata) {
      const { data: currentPage } = await supabaseServer
        .from("journey_pages")
        .select("metadata")
        .eq("id", pageId)
        .single();

      if (currentPage) {
        updateData.metadata = {
          ...(currentPage.metadata || {}),
          ...metadata
        };
      } else {
        updateData.metadata = metadata;
      }
    }

    const { data, error } = await supabaseServer
      .from("journey_pages")
      .update(updateData)
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating journey page status:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, page: data };
  } catch (error) {
    console.error("Unexpected error updating journey page:", error);
    return { success: false, error: "Failed to update journey page" };
  }
}

/**
 * Gets all journey pages for a client, ordered by page_order
 */
export async function getClientJourneyPages(
  clientId: number
): Promise<{ success: boolean; error?: string; pages?: JourneyPage[] }> {
  try {
    const { data, error } = await supabaseServer
      .from("journey_pages")
      .select("*")
      .eq("client_id", clientId)
      .order("page_order", { ascending: true });

    if (error) {
      console.error("Error fetching journey pages:", error);
      return { success: false, error: error.message };
    }

    return { success: true, pages: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching journey pages:", error);
    return { success: false, error: "Failed to fetch journey pages" };
  }
}

/**
 * Calculates journey progress for a client
 */
export async function getClientJourneyProgress(
  clientId: number
): Promise<{ success: boolean; error?: string; progress?: JourneyProgress }> {
  try {
    const result = await getClientJourneyPages(clientId);
    
    if (!result.success || !result.pages) {
      return { success: false, error: result.error || "Failed to fetch journey pages" };
    }

    const pages = result.pages;
    const totalPages = pages.length;
    const completedPages = pages.filter(page => page.status === "completed").length;
    const activePage = pages.find(page => page.status === "active") || null;
    const progressPercentage = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
    
    // Current step is the order of the active page, or next incomplete page
    let currentStep = 1;
    if (activePage) {
      currentStep = activePage.page_order;
    } else {
      const nextIncompleteePage = pages.find(page => page.status === "pending");
      if (nextIncompleteePage) {
        currentStep = nextIncompleteePage.page_order;
      } else if (completedPages === totalPages) {
        currentStep = totalPages; // All completed
      }
    }

    const progress: JourneyProgress = {
      total_pages: totalPages,
      completed_pages: completedPages,
      active_page: activePage,
      progress_percentage: progressPercentage,
      current_step: currentStep
    };

    return { success: true, progress };
  } catch (error) {
    console.error("Unexpected error calculating journey progress:", error);
    return { success: false, error: "Failed to calculate journey progress" };
  }
}

/**
 * Advances a client to the next page in their journey
 * Marks current active page as completed and sets next page as active
 */
export async function advanceClientJourney(
  clientId: number,
  completionMetadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; nextPage?: JourneyPage }> {
  try {
    const result = await getClientJourneyPages(clientId);
    
    if (!result.success || !result.pages) {
      return { success: false, error: result.error || "Failed to fetch journey pages" };
    }

    const pages = result.pages;
    const activePage = pages.find(page => page.status === "active");
    const nextPendingPage = pages
      .filter(page => page.status === "pending")
      .sort((a, b) => a.page_order - b.page_order)[0];

    // Complete the current active page if it exists
    if (activePage) {
      const completeResult = await updateJourneyPageStatus(
        activePage.id,
        "completed",
        completionMetadata
      );
      if (!completeResult.success) {
        return { success: false, error: completeResult.error };
      }
    }

    // Set next pending page as active
    if (nextPendingPage) {
      const activateResult = await updateJourneyPageStatus(
        nextPendingPage.id,
        "active",
        { activated_at: new Date().toISOString() }
      );
      if (!activateResult.success) {
        return { success: false, error: activateResult.error };
      }
      return { success: true, nextPage: activateResult.page };
    }

    // No more pages to advance to
    return { success: true, nextPage: undefined };
  } catch (error) {
    console.error("Unexpected error advancing client journey:", error);
    return { success: false, error: "Failed to advance client journey" };
  }
}

/**
 * Starts a client's journey by setting the first page as active
 */
export async function startClientJourney(
  clientId: number
): Promise<{ success: boolean; error?: string; firstPage?: JourneyPage }> {
  try {
    const result = await getClientJourneyPages(clientId);
    
    if (!result.success || !result.pages) {
      return { success: false, error: result.error || "Failed to fetch journey pages" };
    }

    const pages = result.pages;
    const firstPage = pages.find(page => page.page_order === 1);

    if (!firstPage) {
      return { success: false, error: "No first page found for client journey" };
    }

    // Set first page as active if it's still pending
    if (firstPage.status === "pending") {
      const activateResult = await updateJourneyPageStatus(
        firstPage.id,
        "active",
        { 
          journey_started_at: new Date().toISOString(),
          activated_at: new Date().toISOString()
        }
      );
      if (!activateResult.success) {
        return { success: false, error: activateResult.error };
      }
      return { success: true, firstPage: activateResult.page };
    }

    return { success: true, firstPage };
  } catch (error) {
    console.error("Unexpected error starting client journey:", error);
    return { success: false, error: "Failed to start client journey" };
  }
}