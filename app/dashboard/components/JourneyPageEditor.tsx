"use client";

import { useState, useTransition, useEffect } from "react";
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
import { ContentHypothesis, getCurrentActiveHypothesis } from "@/app/actions/hypothesis-actions";
import { HypothesisModal } from "@/components/ui/HypothesisModal";
import { JourneyNavigation } from "./JourneyNavigation";
import { PageConsistencyChecker } from "./PageConsistencyChecker";
import { HypothesisHistory } from "./HypothesisHistory";

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
  
  // Hypothesis-first workflow state
  const [editingMode, setEditingMode] = useState(false);
  const [showHypothesisModal, setShowHypothesisModal] = useState(false);
  const [currentHypothesisId, setCurrentHypothesisId] = useState<number | null>(null);
  const [currentHypothesis, setCurrentHypothesis] = useState<ContentHypothesis | null>(null);
  const [originalContent, setOriginalContent] = useState({ title: currentPage.title, content: currentPage.content });

  // Load current active hypothesis on mount
  useEffect(() => {
    loadCurrentHypothesis();
  }, [currentPage.id]);

  const loadCurrentHypothesis = async () => {
    try {
      const result = await getCurrentActiveHypothesis(currentPage.id);
      if (result.success && result.hypothesis) {
        setCurrentHypothesis(result.hypothesis);
        setCurrentHypothesisId(result.hypothesis.id || null);
        setEditingMode(true); // If there's an active hypothesis, editing is allowed
      }
    } catch (error) {
      console.error("Error loading current hypothesis:", error);
    }
  };

  // Track changes
  const markAsChanged = () => {
    if (!hasChanges) {
      setHasChanges(true);
      setSaveStatus('idle');
    }
  };

  // Hypothesis-first edit enforcement
  const handleFirstEditAttempt = () => {
    if (!editingMode && !currentHypothesisId) {
      setShowHypothesisModal(true);
      return false; // Block edit until hypothesis captured
    }
    return true; // Allow edit
  };

  const handleHypothesisComplete = (hypothesis?: ContentHypothesis) => {
    if (hypothesis) {
      setCurrentHypothesis(hypothesis);
      setCurrentHypothesisId(hypothesis.id || null);
      setEditingMode(true);
      setShowHypothesisModal(false);
    } else {
      // Cancelled - reset any attempted changes
      setTitle(originalContent.title);
      setContent(originalContent.content);
      setHasChanges(false);
      setShowHypothesisModal(false);
    }
  };

  const handleTitleChange = (value: string) => {
    if (!handleFirstEditAttempt()) {
      // Store attempted change but don't apply it yet
      return;
    }
    setTitle(value);
    markAsChanged();
  };

  const handleContentChange = (value: string) => {
    if (!handleFirstEditAttempt()) {
      // Store attempted change but don't apply it yet
      return;
    }
    setContent(value);
    markAsChanged();
  };

  const handleHypothesisChange = (value: string) => {
    setHypothesis(value);
    markAsChanged();
  };

  // Save changes
  const handleSave = async () => {
    if (!hasChanges) return;

    setSaveStatus('saving');
    setErrorMessage("");

    try {
      // Update content
      const result = await updateJourneyPageContent(
        currentPage.id,
        title,
        content,
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
        return `/journey/${token}`;
      case 'agreement':
        return `/agreement?token=${token}`;
      case 'confirmation':
        return `/confirmation?token=${token}`;
      case 'processing':
        return `/processing?token=${token}`;
      default:
        return `/journey/${token}`;
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
            disabled={!hasChanges || isPending || saveStatus === 'saving'}
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
              </CardTitle>
              <CardDescription>
                Edit the title and content that will be displayed to clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter page title"
                  className="font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Page Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter page content (supports HTML)"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  HTML tags are supported. Use semantic markup for best results.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Hypothesis Display */}
          {currentHypothesis ? (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Edit3 className="h-5 w-5" />
                  Active Hypothesis
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Current learning hypothesis for this editing session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-blue-200 rounded">
                    <p className="text-sm text-blue-900 font-medium">
                      {currentHypothesis.hypothesis}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {currentHypothesis.change_type}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {currentHypothesis.confidence_level}/10
                      </Badge>
                    </div>
                    <span className="text-blue-600">
                      {currentHypothesis.created_at && 
                        new Date(currentHypothesis.created_at).toLocaleDateString()
                      }
                    </span>
                  </div>
                  {currentHypothesis.predicted_outcome && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs font-medium text-blue-800">Expected Outcome:</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {currentHypothesis.predicted_outcome}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <Edit3 className="h-5 w-5" />
                  Hypothesis Required
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Create a hypothesis before editing to capture learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-sm text-orange-800 mb-3">
                    To edit this page, you'll need to create a hypothesis about what you expect your changes to accomplish.
                  </p>
                  <Button
                    onClick={() => setShowHypothesisModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Create Hypothesis to Start Editing
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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

          {/* Hypothesis History */}
          <HypothesisHistory
            journeyPageId={currentPage.id}
            onHypothesisSelect={(hypothesis) => {
              // Could implement hypothesis context viewing here
              console.log("Selected hypothesis:", hypothesis);
            }}
          />

          {/* Page Consistency Checker */}
          <PageConsistencyChecker
            pages={pages}
            currentPage={currentPage}
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

      {/* Hypothesis Modal */}
      <HypothesisModal
        isOpen={showHypothesisModal}
        onClose={handleHypothesisComplete}
        journeyPageId={currentPage.id}
        pageTitle={`${formatPageType(pageType)} Page`}
        previousContent={JSON.stringify({ title: originalContent.title, content: originalContent.content })}
        canBypass={false} // Enforce hypothesis requirement
      />
    </div>
  );
}