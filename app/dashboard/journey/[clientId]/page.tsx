"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Mail, User } from "lucide-react";
import { Client, JourneyPage } from "@/lib/supabase";
import { 
  getClientJourneyPages, 
  getClientJourneyPageByType,
  updateClientJourneyPageByType
} from "@/app/actions/journey-actions";
import { getClientById } from "@/app/actions/client-actions";
import ContentEditor from "../../components/ContentEditor";
import JourneyNavigationTabs, { PageType } from "../../components/JourneyNavigationTabs";
import ContentHistoryPanel from "../../components/ContentHistoryPanel";

interface JourneyEditorPageProps {
  params: { clientId: string };
  searchParams: { page?: string };
}

export default function JourneyEditorPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = parseInt(params.clientId as string);
  
  const [client, setClient] = useState<Client | null>(null);
  const [currentPageType, setCurrentPageType] = useState<PageType>('activation');
  const [currentPageData, setCurrentPageData] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load client data on mount
  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const result = await getClientById(clientId);
        if (result.success && result.client) {
          setClient(result.client);
        } else {
          setError(result.error || "Failed to load client");
        }
      } catch (err) {
        setError("Failed to load client");
      } finally {
        setLoading(false);
      }
    };

    if (clientId && !isNaN(clientId)) {
      loadClient();
    } else {
      setError("Invalid client ID");
      setLoading(false);
    }
  }, [clientId]);

  // Load page content when page type changes
  useEffect(() => {
    const loadPageContent = async () => {
      if (!client) return;
      
      try {
        const result = await getClientJourneyPageByType(client.id, currentPageType);
        if (result.success && result.page) {
          // Parse content if it's a string
          let content = result.page.content;
          if (typeof content === 'string') {
            try {
              content = JSON.parse(content);
            } catch {
              // If parsing fails, use as-is
            }
          }
          setCurrentPageData(content);
        } else {
          // No content found, use defaults
          setCurrentPageData(null);
        }
      } catch (err) {
        console.error("Error loading page content:", err);
        setCurrentPageData(null);
      }
    };

    loadPageContent();
  }, [client, currentPageType]);

  const handlePageChange = (pageType: PageType) => {
    setCurrentPageType(pageType);
  };

  const handleContentChange = async (content: any) => {
    if (!client) return;

    try {
      const result = await updateClientJourneyPageByType(
        client.id,
        currentPageType,
        content,
        { 
          last_edit_at: new Date().toISOString(),
          editor: 'admin' 
        }
      );
      
      if (!result.success) {
        console.error("Failed to save content:", result.error);
      }
    } catch (err) {
      console.error("Error saving content:", err);
    }
  };

  const handleUnsavedChange = (hasUnsaved: boolean) => {
    setHasUnsavedChanges(hasUnsaved);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading client journey...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Client not found"}</p>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold">Journey Editor</h1>
            <p className="text-muted-foreground">
              Edit the complete client journey experience
            </p>
          </div>
        </div>
      </div>

      {/* Client Context Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Client Information
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={client.status === 'activated' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {client.token}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{client.company}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{client.contact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Navigation */}
      <JourneyNavigationTabs
        currentPage={currentPageType}
        onPageChange={handlePageChange}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Content Editor - Takes up 2/3 of the space */}
        <div className="xl:col-span-2">
          <ContentEditor
            initialContent={currentPageData}
            clientId={client.id}
            pageType={currentPageType}
            onUnsavedChange={handleUnsavedChange}
            onContentChange={handleContentChange}
          />
        </div>
        
        {/* Content History Panel - Takes up 1/3 of the space */}
        <div className="xl:col-span-1">
          <ContentHistoryPanel
            clientId={client.id}
            pageType={currentPageType}
            journeyHypothesis={"Improve overall client activation rate through personalized content and clear value proposition communication"}
          />
        </div>
      </div>
    </div>
  );
}