"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Edit3,
  FileText,
  Route
} from "lucide-react";
import { Client, JourneyPage } from "@/lib/supabase";
import { updateJourneyPageContent, updateJourneyPageHypothesis } from "@/app/actions/journey-actions";
import { updateJourneyPageContentWithHypothesis } from "@/app/actions/hypothesis-actions";
import { JourneyNavigation } from "./JourneyNavigation";
import { PageConsistencyChecker } from "./PageConsistencyChecker";
import { HypothesisModal } from "@/components/ui/HypothesisModal";
import { HypothesisHistory } from "@/components/ui/HypothesisHistory";

interface JourneyPageEditorProps {
  client: Client;
  pages: JourneyPage[];
  currentPage: JourneyPage;
  pageType: string;
}

export function JourneyPageEditor({
  client,
  pages,
  currentPage,
  pageType
}: JourneyPageEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Editor state
  const [title, setTitle] = useState(currentPage.title);
  const [content, setContent] = useState(currentPage.content);
  const [hypothesis, setHypothesis] = useState(currentPage.metadata?.edit_hypothesis || "");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  
  // Story 2.1: Hypothesis Modal state
  const [showHypothesisModal, setShowHypothesisModal] = useState(false);
  const [currentHypothesisId, setCurrentHypothesisId] = useState<number | null>(null);
  const [editingMode, setEditingMode] = useState(false);

  // Track changes
  const markAsChanged = () => {
    if (!hasChanges) {
      setHasChanges(true);
      setSaveStatus('idle');
    }
  };

  // Story 2.1: Enhanced handlers with mandatory hypothesis capture (AC 2.1.1)
  const handleTitleChange = (value: string) => {
    if (!editingMode && !hasChanges) {
      // First edit attempt - mandatory hypothesis modal
      setShowHypothesisModal(true);
      return;
    }
    
    setTitle(value);
    markAsChanged();
  };

  const handleContentChange = (value: string) => {
    if (!editingMode && !hasChanges) {
      // First edit attempt - mandatory hypothesis modal
      setShowHypothesisModal(true);
      return;
    }
    
    setContent(value);
    markAsChanged();
  };

  // Prevent any content editing without hypothesis (AC 2.1.1)
  const handleFieldFocus = () => {
    if (!editingMode && !hasChanges) {
      setShowHypothesisModal(true);
    }
  };

  const handleHypothesisChange = (value: string) => {
    setHypothesis(value);
    markAsChanged();
  };

  // Story 2.1: Hypothesis modal handlers
  const handleHypothesisSuccess = (hypothesisId: number) => {
    setCurrentHypothesisId(hypothesisId);
    setEditingMode(true);
    setShowHypothesisModal(false);
  };

  const handleHypothesisClose = () => {
    setShowHypothesisModal(false);
  };

  const handleStartEditing = () => {
    if (!editingMode && !hasChanges) {
      setShowHypothesisModal(true);
    }
  };

  // Save changes with enhanced hypothesis tracking
  const handleSave = async () => {
    if (!hasChanges) return;

    setSaveStatus('saving');
    setErrorMessage("");

    try {
      // Story 2.1: Use enhanced save with hypothesis tracking
      if (currentHypothesisId) {
        const result = await updateJourneyPageContentWithHypothesis(
          currentPage.id,
          title,
          content,
          currentHypothesisId,
          hypothesis
        );

        if (result.success) {
          setSaveStatus('saved');
          setHasChanges(false);
          // Auto-clear success status after 3 seconds
          setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        } else {
          setSaveStatus('error');
          setErrorMessage(result.error || "Failed to save changes");
        }
      } else {
        // Fallback to original save method for backward compatibility
        const result = await updateJourneyPageContent(
          currentPage.id,
          title,
          content,
          hypothesis
        );

        if (result.success) {
          setSaveStatus('saved');
          setHasChanges(false);
          setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        } else {
          setSaveStatus('error');
          setErrorMessage(result.error || "Failed to save changes");
        }
      }
    } catch (error) {
      setSaveStatus('error');
      setErrorMessage("An unexpected error occurred while saving");
    }
  };

  // Preview page
  const handlePreview = () => {
    const previewUrl = getPagePreviewUrl(currentPage.page_type, client.token);
    window.open(previewUrl, '_blank');
  };

  const getPagePreviewUrl = (pageType: string, token: string) => {
    switch (pageType) {
      case 'activation':
        return `/activate/${token}`;
      case 'agreement':
        return `/agreement?token=${token}`;
      case 'confirmation':
        return `/confirmation?token=${token}`;
      case 'processing':
        return `/processing?token=${token}`;
      default:
        return `/activate/${token}`;
    }
  };

  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "skipped":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              {formatPageType(pageType)} Page Editor
            </h1>
            <Badge className={getStatusColor(currentPage.status)}>
              {formatPageType(currentPage.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Editing journey page for {client.company} ({client.token})
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!editingMode && (
            <Button
              variant="outline"
              onClick={() => setShowHypothesisModal(true)}
              className="bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Capture Hypothesis
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isPending}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isPending || saveStatus === 'saving' || !editingMode}
            className={editingMode ? "" : "opacity-50 cursor-not-allowed"}
            title={!editingMode ? "Must capture hypothesis before saving changes" : ""}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'saved' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Changes Saved</AlertTitle>
          <AlertDescription className="text-green-700">
            Your changes have been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Save Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Page Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Page Content
                {!editingMode && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Hypothesis Required
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {!editingMode ? (
                  <span className="text-orange-700">
                    <strong>Story 2.1:</strong> You must capture your hypothesis before making content changes. 
                    This builds conversion intelligence from every edit.
                  </span>
                ) : (
                  "Edit the title and content that will be displayed to clients"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onFocus={handleFieldFocus}
                  placeholder={editingMode ? "Enter page title" : "Click to start editing (hypothesis required)"}
                  className={`font-medium ${!editingMode ? 'cursor-pointer bg-orange-50 border-orange-200 hover:bg-orange-100' : ''}`}
                  readOnly={!editingMode}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Page Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onFocus={handleFieldFocus}
                  placeholder={editingMode ? "Enter page content (supports HTML)" : "Click to start editing (hypothesis required)"}
                  rows={12}
                  className={`font-mono text-sm ${!editingMode ? 'cursor-pointer bg-orange-50 border-orange-200 hover:bg-orange-100' : ''}`}
                  readOnly={!editingMode}
                />
                <p className="text-xs text-muted-foreground">
                  {editingMode ? (
                    "HTML tags are supported. Use semantic markup for best results."
                  ) : (
                    "🔒 Editing locked until hypothesis is captured. This ensures we learn from every change."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Hypothesis Capture - Story 2.1 Enhanced */}
          <Card className={`${editingMode ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${editingMode ? 'text-green-900' : 'text-orange-900'}`}>
                <Edit3 className="h-5 w-5" />
                {editingMode ? 'Active Hypothesis' : 'Hypothesis Required'}
                {editingMode && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                    Editing Enabled
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className={editingMode ? 'text-green-700' : 'text-orange-700'}>
                {editingMode ? (
                  "Current hypothesis guiding your edits. Update as needed to reflect your reasoning."
                ) : (
                  "⚠️ You must capture your hypothesis before making content changes. Click any field above to start."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={hypothesis}
                onChange={(e) => handleHypothesisChange(e.target.value)}
                placeholder={editingMode ? "Update your hypothesis as your reasoning evolves..." : "Your hypothesis will appear here after capture"}
                rows={4}
                className={`${editingMode ? 'bg-white border-green-200 focus:border-green-300 text-green-900' : 'bg-white border-orange-200 focus:border-orange-300 text-orange-900'}`}
                readOnly={!editingMode}
              />
              <div className={`text-xs mt-2 ${editingMode ? 'text-green-600' : 'text-orange-600'}`}>
                {editingMode ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>Hypothesis captured! This tracks what changes drive conversion and what doesn't.</span>
                  </div>
                ) : (
                  "Revenue Intelligence: Each hypothesis becomes organizational learning that improves future decisions."
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Journey Navigation */}
          <JourneyNavigation
            pages={pages}
            currentPage={currentPage}
            client={client}
            hasUnsavedChanges={hasChanges}
          />

          {/* Page Consistency Checker */}
          <PageConsistencyChecker
            pages={pages}
            currentPage={currentPage}
          />

          {/* Hypothesis Learning History - Story 2.1 AC 2.1.5 */}
          <HypothesisHistory
            journeyPageId={currentPage.id}
            pageType={currentPage.page_type}
          />

          {/* Page Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Page Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Page Order:</span>
                <span className="font-medium">{currentPage.page_order}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className={getStatusColor(currentPage.status)}>
                  {formatPageType(currentPage.status)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {new Date(currentPage.updated_at).toLocaleDateString()}
                </span>
              </div>
              {currentPage.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium">
                    {new Date(currentPage.completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Story 2.1: Hypothesis Modal */}
      <HypothesisModal
        isOpen={showHypothesisModal}
        onClose={handleHypothesisClose}
        onSuccess={handleHypothesisSuccess}
        journeyPageId={currentPage.id}
        currentTitle={currentPage.title}
        currentContent={currentPage.content || ""}
        pageType={currentPage.page_type}
      />
    </div>
  );
}