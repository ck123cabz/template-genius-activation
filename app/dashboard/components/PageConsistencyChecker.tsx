"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  FileText,
  Palette
} from "lucide-react";
import { JourneyPage } from "@/lib/supabase";

interface PageConsistencyCheckerProps {
  pages: JourneyPage[];
  currentPage: JourneyPage;
}

interface ConsistencyCheck {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  details?: string;
}

export function PageConsistencyChecker({ pages, currentPage }: PageConsistencyCheckerProps) {
  const checks = useMemo(() => {
    const consistencyChecks: ConsistencyCheck[] = [];
    
    // Check 1: Title consistency
    const titleLengths = pages.map(p => p.title.length);
    const avgTitleLength = titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length;
    const currentTitleLength = currentPage.title.length;
    const titleVariance = Math.abs(currentTitleLength - avgTitleLength);
    
    consistencyChecks.push({
      id: 'title-length',
      title: 'Title Length Consistency',
      description: 'Page titles should be similar in length for visual consistency',
      status: titleVariance > 20 ? 'warning' : 'pass',
      details: titleVariance > 20 
        ? `Current: ${currentTitleLength} chars, Average: ${Math.round(avgTitleLength)} chars`
        : `${currentTitleLength} characters (within normal range)`
    });

    // Check 2: Content structure
    const htmlTagPattern = /<[^>]*>/g;
    const currentTags = (currentPage.content.match(htmlTagPattern) || []).length;
    const avgTags = pages.reduce((sum, p) => sum + (p.content.match(htmlTagPattern) || []).length, 0) / pages.length;
    
    consistencyChecks.push({
      id: 'content-structure',
      title: 'Content Structure',
      description: 'Similar HTML complexity across pages',
      status: Math.abs(currentTags - avgTags) > 5 ? 'warning' : 'pass',
      details: `${currentTags} HTML elements (avg: ${Math.round(avgTags)})`
    });

    // Check 3: Content length
    const contentLengths = pages.map(p => p.content.length);
    const avgContentLength = contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length;
    const currentContentLength = currentPage.content.length;
    const contentVariance = Math.abs(currentContentLength - avgContentLength);
    
    consistencyChecks.push({
      id: 'content-length',
      title: 'Content Length Balance',
      description: 'Content length should be balanced across journey pages',
      status: contentVariance > avgContentLength * 0.5 ? 'warning' : 'pass',
      details: `${currentContentLength} chars (avg: ${Math.round(avgContentLength)})`
    });

    // Check 4: Call-to-action detection
    const ctaKeywords = ['click', 'continue', 'next', 'submit', 'agree', 'confirm', 'start', 'begin'];
    const hasCtaKeywords = ctaKeywords.some(keyword => 
      currentPage.content.toLowerCase().includes(keyword)
    );
    
    consistencyChecks.push({
      id: 'call-to-action',
      title: 'Call-to-Action Presence',
      description: 'Each page should guide the user to the next step',
      status: hasCtaKeywords ? 'pass' : 'warning',
      details: hasCtaKeywords 
        ? 'Clear action words found'
        : 'Consider adding clearer call-to-action language'
    });

    // Check 5: Readability - sentence complexity
    const sentences = currentPage.content.replace(/<[^>]*>/g, '').split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.reduce((sum, sentence) => {
      return sum + sentence.trim().split(/\s+/).length;
    }, 0) / (sentences.length || 1);

    consistencyChecks.push({
      id: 'readability',
      title: 'Content Readability',
      description: 'Content should be easily readable',
      status: avgWordsPerSentence > 25 ? 'warning' : avgWordsPerSentence > 15 ? 'pass' : 'pass',
      details: `${Math.round(avgWordsPerSentence)} words per sentence`
    });

    // Check 6: Journey flow context
    const isFirstPage = currentPage.page_order === 1;
    const isLastPage = currentPage.page_order === pages.length;
    const hasWelcomeLanguage = currentPage.content.toLowerCase().includes('welcome') ||
                              currentPage.content.toLowerCase().includes('hello') ||
                              currentPage.content.toLowerCase().includes('start');
    const hasClosingLanguage = currentPage.content.toLowerCase().includes('complete') ||
                              currentPage.content.toLowerCase().includes('finish') ||
                              currentPage.content.toLowerCase().includes('thank');

    let flowStatus: 'pass' | 'warning' | 'fail' = 'pass';
    let flowDetails = 'Content matches page position';
    
    if (isFirstPage && !hasWelcomeLanguage) {
      flowStatus = 'warning';
      flowDetails = 'First page should include welcoming language';
    } else if (isLastPage && !hasClosingLanguage) {
      flowStatus = 'warning';
      flowDetails = 'Final page should include completion/thank you language';
    }

    consistencyChecks.push({
      id: 'journey-flow',
      title: 'Journey Flow Context',
      description: 'Content should match the page\'s position in the journey',
      status: flowStatus,
      details: flowDetails
    });

    return consistencyChecks;
  }, [pages, currentPage]);

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
    }
  };

  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const failedChecks = checks.filter(c => c.status === 'fail').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Consistency Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Consistency Score</span>
            <Badge variant="outline">
              {passedChecks}/{checks.length} Checks
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1 text-green-700">
              <CheckCircle className="h-3 w-3" />
              {passedChecks} Pass
            </div>
            <div className="flex items-center gap-1 text-yellow-700">
              <AlertTriangle className="h-3 w-3" />
              {warningChecks} Warning
            </div>
            <div className="flex items-center gap-1 text-red-700">
              <XCircle className="h-3 w-3" />
              {failedChecks} Fail
            </div>
          </div>
        </div>

        {/* Summary Alert */}
        {warningChecks > 0 || failedChecks > 0 ? (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              {failedChecks > 0 
                ? `${failedChecks} critical issues and ${warningChecks} warnings found`
                : `${warningChecks} consistency warnings to review`
              }
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              All consistency checks passed
            </AlertDescription>
          </Alert>
        )}

        {/* Individual Checks */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Detailed Checks
          </h4>
          {checks.map((check) => (
            <div key={check.id} className="flex items-start gap-3 p-2 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium">{check.title}</h5>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(check.status)}`}
                  >
                    {check.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {check.description}
                </p>
                {check.details && (
                  <p className="text-xs text-gray-600 mt-1 font-mono">
                    {check.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {(warningChecks > 0 || failedChecks > 0) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Recommendations
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              {failedChecks > 0 && (
                <li>• Address critical issues first to ensure proper user experience</li>
              )}
              {warningChecks > 0 && (
                <li>• Review warnings to maintain consistency across the journey</li>
              )}
              <li>• Test the page flow with the overall journey experience</li>
              <li>• Consider user psychology and conversion optimization</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}