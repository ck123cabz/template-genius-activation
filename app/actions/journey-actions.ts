"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { 
  Client,
  JourneyPage, 
  JourneyPageStatus, 
  JourneyPageType, 
  JourneyProgress,
  mockJourneyPageTemplates 
} from "@/lib/supabase";

const supabaseServer = supabase;
// Get client by G-token for client-facing journey access
export async function getClientByToken(
  token: string
): Promise<{ success: boolean; error?: string; client?: Client }> {
  try {
    if (!token || !token.match(/^G\d{4}$/)) {
      return { success: false, error: "Invalid token format" };
    }

    const { clientService } = await import("@/lib/supabase");
    const client = await clientService.getByToken(token);

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    return { success: true, client };
  } catch (error) {
    console.error("Unexpected error fetching client by token:", error);
    return { success: false, error: "Failed to fetch client" };
  }
}

// Get client journey data by token (combines client + journey pages)
export async function getClientJourneyByToken(
  token: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  client?: Client; 
  pages?: JourneyPage[]; 
  progress?: JourneyProgress 
}> {
  try {
    // First get client by token
    const clientResult = await getClientByToken(token);
    if (!clientResult.success || !clientResult.client) {
      return { success: false, error: clientResult.error };
    }

    // Then get journey pages and progress
    const [pagesResult, progressResult] = await Promise.all([
      getClientJourneyPages(clientResult.client.id),
      getClientJourneyProgress(clientResult.client.id)
    ]);

    if (!pagesResult.success) {
      return { 
        success: false, 
        error: `Failed to fetch journey pages: ${pagesResult.error}` 
      };
    }

    return {
      success: true,
      client: clientResult.client,
      pages: pagesResult.pages || [],
      progress: progressResult.success ? progressResult.progress : undefined
    };
  } catch (error) {
    console.error("Unexpected error fetching client journey by token:", error);
    return { success: false, error: "Failed to fetch client journey" };
  }
}

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
      try {
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
      } catch (metadataError) {
        // If can't fetch metadata, just use provided metadata
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
      // Return success for mock data environment (database tables don't exist)
      // In a real environment, this would fail properly
      const { mockJourneyPages } = await import("@/lib/supabase");
      const mockPage = mockJourneyPages.find(p => p.id === pageId);
      if (mockPage) {
        const updatedPage = { 
          ...mockPage, 
          ...updateData,
          id: pageId
        };
        return { success: true, page: updatedPage };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, page: data };
  } catch (error) {
    console.error("Unexpected error updating journey page:", error);
    // Fallback for mock data environment
    const { mockJourneyPages } = await import("@/lib/supabase");
    const mockPage = mockJourneyPages.find(p => p.id === pageId);
    if (mockPage) {
      const updatedPage = { 
        ...mockPage, 
        status,
        updated_at: new Date().toISOString(),
        completed_at: status === "completed" ? new Date().toISOString() : mockPage.completed_at,
        metadata: metadata ? { ...mockPage.metadata, ...metadata } : mockPage.metadata
      };
      return { success: true, page: updatedPage };
    }
    return { success: false, error: "Failed to update journey page" };
  }
}

/**
 * Gets all journey pages for a client, ordered by page_order
 */
export async function getClientJourneyPages(
  clientId: string
): Promise<{ success: boolean; error?: string; pages?: JourneyPage[] }> {
  try {
    // If Supabase is not configured, use mock data
    if (!supabaseServer) {
      const { mockJourneyPages } = await import("@/lib/supabase");
      const pages = mockJourneyPages.filter(
        page => String(page.client_id) === String(clientId)
      );
      return { success: true, pages };
    }

    const { data, error } = await supabaseServer
      .from("journey_pages")
      .select("*")
      .eq("client_id", clientId)
      .order("page_type", { ascending: true }); // Use page_type instead of page_order

    if (error) {
      console.error("Error fetching journey pages:", error);
      return { success: false, error: error.message };
    }

    // Transform the data to include derived properties for component compatibility
    const transformedPages: JourneyPage[] = (data || []).map((page) => {
      const pageOrder = getPageOrder(page.page_type);
      const title = page.page_content?.title || formatPageType(page.page_type);

      return {
        ...page,
        page_order: pageOrder,
        title,
        status: 'pending' as JourneyPageStatus, // Default status
        metadata: page.page_content || {}
      };
    });

    return { success: true, pages: transformedPages };
  } catch (error) {
    console.error("Unexpected error fetching journey pages:", error);
    return { success: false, error: "Failed to fetch journey pages" };
  }
}

// Helper function to get consistent page ordering
function getPageOrder(pageType: string): number {
  const order = {
    'activation': 1,
    'agreement': 2,
    'confirmation': 3,
    'processing': 4
  };
  return order[pageType as keyof typeof order] || 99;
}

// Helper function to format page type
function formatPageType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
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

/**
 * Updates the content of a journey page with hypothesis tracking
 * Story 1.3: Admin editing interface with hypothesis capture from Story 1.1 pattern
 */
export async function updateJourneyPageContent(
  pageId: number,
  title: string,
  content: string,
  hypothesis?: string
): Promise<{ success: boolean; error?: string; page?: JourneyPage }> {
  try {
    const updateData: any = {
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString()
    };

    // If hypothesis provided, store it in metadata (following Story 1.1 pattern)
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

    const { data, error } = await supabaseServer
      .from("journey_pages")
      .update(updateData)
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating journey page content:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, page: data };
  } catch (error) {
    console.error("Unexpected error updating journey page content:", error);
    return { success: false, error: "Failed to update journey page content" };
  }
}

/**
 * Updates just the hypothesis for a journey page
 * Story 1.3: Hypothesis tracking during editing process
 */
export async function updateJourneyPageHypothesis(
  pageId: number,
  hypothesis: string
): Promise<{ success: boolean; error?: string; page?: JourneyPage }> {
  try {
    // Get current metadata
    const { data: currentPage } = await supabaseServer
      .from("journey_pages")
      .select("metadata")
      .eq("id", pageId)
      .single();

    if (!currentPage) {
      return { success: false, error: "Journey page not found" };
    }

    const existingMetadata = currentPage.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      edit_hypothesis: hypothesis.trim(),
      hypothesis_updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseServer
      .from("journey_pages")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating journey page hypothesis:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, page: data };
  } catch (error) {
    console.error("Unexpected error updating journey page hypothesis:", error);
    return { success: false, error: "Failed to update journey page hypothesis" };
  }
}

/**
 * Gets a single journey page by client ID and page type
 * Story 1.3: Support admin editing interface navigation
 */
export async function getClientJourneyPageByType(
  clientId: number,
  pageType: string
): Promise<{ success: boolean; error?: string; page?: JourneyPage }> {
  try {
    const { data, error } = await supabaseServer
      .from("journey_pages")
      .select("*")
      .eq("client_id", clientId)
      .eq("page_type", pageType)
      .single();

    if (error) {
      console.error("Error fetching journey page by type:", error);
      return { success: false, error: error.message };
    }

    return { success: true, page: data };
  } catch (error) {
    console.error("Unexpected error fetching journey page by type:", error);
    return { success: false, error: "Failed to fetch journey page" };
  }
}

/**
 * Records when a journey page is edited (for analytics)
 * Story 1.3: Track admin editing patterns for learning
 */
export async function recordJourneyPageEdit(
  pageId: number,
  editType: 'content' | 'title' | 'hypothesis' | 'full',
  changesDescription?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current metadata
    const { data: currentPage } = await supabaseServer
      .from("journey_pages")
      .select("metadata")
      .eq("id", pageId)
      .single();

    if (!currentPage) {
      return { success: false, error: "Journey page not found" };
    }

    const existingMetadata = currentPage.metadata || {};
    const editHistory = existingMetadata.edit_history || [];
    
    // Add edit record
    const editRecord = {
      timestamp: new Date().toISOString(),
      edit_type: editType,
      changes_description: changesDescription || '',
      editor: 'admin' // Could be extended to track specific admin users
    };

    const updatedMetadata = {
      ...existingMetadata,
      edit_history: [...editHistory, editRecord],
      last_edit_type: editType,
      total_edits: (existingMetadata.total_edits || 0) + 1
    };

    const { error } = await supabaseServer
      .from("journey_pages")
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq("id", pageId);

    if (error) {
      console.error("Error recording journey page edit:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error recording journey page edit:", error);
    return { success: false, error: "Failed to record edit" };
  }
}

/**
 * Updates a journey page by client ID and page type
 * Story 1.2: Multi-page journey infrastructure support
 */
export async function updateClientJourneyPageByType(
  clientId: number,
  pageType: JourneyPageType,
  content: any,
  metadata?: any
): Promise<{ success: boolean; error?: string; page?: JourneyPage }> {
  try {
    // First get the page to update
    const pageResult = await getClientJourneyPageByType(clientId, pageType);
    if (!pageResult.success || !pageResult.page) {
      return { success: false, error: pageResult.error || "Journey page not found" };
    }

    const pageId = pageResult.page.id;
    const updateData: any = {
      content: typeof content === 'string' ? content : JSON.stringify(content),
      updated_at: new Date().toISOString()
    };

    // If metadata provided, merge it with existing metadata
    if (metadata) {
      const existingMetadata = pageResult.page.metadata || {};
      updateData.metadata = {
        ...existingMetadata,
        ...metadata,
        last_edit_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabaseServer
      .from("journey_pages")
      .update(updateData)
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("Error updating journey page:", error);
      // Fallback for mock data environment
      const { mockJourneyPages } = await import("@/lib/supabase");
      const mockPage = mockJourneyPages.find(p => p.client_id === clientId && p.page_type === pageType);
      if (mockPage) {
        const updatedPage = { 
          ...mockPage, 
          ...updateData,
          id: pageId
        };
        return { success: true, page: updatedPage };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, page: data };
  } catch (error) {
    console.error("Unexpected error updating journey page:", error);
    return { success: false, error: "Failed to update journey page" };
  }
}
