"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";
import { Client } from "@/lib/supabase";

export async function createClient(
  formData: FormData,
): Promise<{ success: boolean; error?: string; client?: Client }> {
  try {
    const client = {
      company: formData.get("company") as string,
      contact: formData.get("contact") as string,
      email: formData.get("email") as string,
      position: formData.get("position") as string,
      salary: formData.get("salary") as string,
      logo: (formData.get("logo") as string) || null,
    };

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
