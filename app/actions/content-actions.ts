"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { ActivationContent } from "@/lib/supabase";

export async function updateContent(contentData: {
  title: string;
  subtitle: string;
  benefits: Array<{ title: string; description: string; icon: string }>;
  payment_options: {
    optionA: { title: string; description: string; fee: string };
    optionB: { title: string; description: string; fee: string };
  };
  investment_details: string[];
}): Promise<{ success: boolean; error?: string; content?: ActivationContent }> {
  try {
    // First try to get existing content
    const { data: existingData } = await supabaseServer
      .from("activation_content")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const contentWithTimestamp = {
      ...contentData,
      updated_at: new Date().toISOString(),
    };

    let data, error;

    if (existingData) {
      // Update existing content
      const result = await supabaseServer
        .from("activation_content")
        .update(contentWithTimestamp)
        .eq("id", existingData.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new content
      const result = await supabaseServer
        .from("activation_content")
        .insert(contentWithTimestamp)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error updating content:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/activate/[token]", "page");
    return { success: true, content: data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { success: false, error: "Failed to update content" };
  }
}
