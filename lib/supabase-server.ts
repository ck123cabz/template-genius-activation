import { supabase } from "./supabase";
import { Client, ActivationContent } from "./supabase";

// Reuse the existing supabase client for server-side operations
export const supabaseServer = supabase;

// Server-side client operations
export const serverClientService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabaseServer
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
    return data || [];
  },

  async getById(id: number): Promise<Client | null> {
    const { data, error } = await supabaseServer
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching client:", error);
      return null;
    }
    return data;
  },
};

// Server-side content operations
export const serverContentService = {
  async getCurrent(): Promise<ActivationContent | null> {
    const { data, error } = await supabaseServer
      .from("activation_content")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching content:", error);
      return null;
    }
    return data;
  },
};
