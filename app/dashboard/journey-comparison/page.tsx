/**
 * Journey Comparison Dashboard
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Main dashboard page for side-by-side journey comparison analysis
 * with selection interface, visualization, and statistical insights.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import JourneyComparisonDashboard from '@/components/dashboard/JourneyComparison';
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner';

export const metadata: Metadata = {
  title: 'Journey Comparison Analysis | Template Genius Revenue Intelligence',
  description: 'Comprehensive side-by-side analysis of successful vs failed client journeys with statistical insights and actionable recommendations.',
  keywords: 'journey comparison, conversion analysis, statistical significance, A/B testing, revenue optimization',
};

/**
 * Journey Comparison Dashboard Page
 * 
 * Provides comprehensive journey comparison capabilities:
 * - Journey pair selection with intelligent matching
 * - Side-by-side visualization with highlighted differences  
 * - Content diff analysis with semantic insights
 * - Timing comparison with engagement patterns
 * - Hypothesis correlation analysis
 * - Statistical significance testing with confidence intervals
 * - Actionable recommendations with priority scoring
 */
export default function JourneyComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="md:flex md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Journey Comparison Analysis
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Compare successful and failed journeys to identify conversion drivers and optimization opportunities
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span>Successful Journey</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span>Failed Journey</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    <span>Significant Difference</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading journey comparison analysis...</span>
          </div>
        }>
          <JourneyComparisonDashboard />
        </Suspense>
      </div>

      {/* Footer Information */}
      <div className="bg-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Journey comparisons use advanced statistical analysis with Wilson confidence intervals and multiple testing correction.
              <br />
              Statistical significance threshold: p &lt; 0.05. Effect size thresholds: Small (0.2), Medium (0.5), Large (0.8).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading component for journey comparison page
 */
export function JourneyComparisonLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">
          Loading Journey Comparison Analysis
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Analyzing journey patterns and statistical significance...
        </p>
      </div>
    </div>
  }

/**
 * Error component for journey comparison page
 */
export function JourneyComparisonError({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void; 
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto h-12 w-12 text-red-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-medium text-gray-900">
          Journey Comparison Error
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {error.message || 'An unexpected error occurred while loading the journey comparison analysis.'}
        </p>
        <div className="mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

// Re-export for convenience
export { JourneyComparisonLoading as Loading, JourneyComparisonError as Error };