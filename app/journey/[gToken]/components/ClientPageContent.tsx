"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Clock, 
  Info,
  Star,
  Users,
  Zap,
  Shield,
  CreditCard,
  DollarSign
} from "lucide-react";
import { Client, JourneyPage } from "@/lib/supabase";
import { PaymentButton, PaymentStatus } from "@/components/ui/PaymentButton";

interface ClientPageContentProps {
  client: Client;
  page: JourneyPage;
  gToken: string;
}

export function ClientPageContent({
  client,
  page,
  gToken
}: ClientPageContentProps) {
  const formatPageType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderPageTypeContent = () => {
    switch (page.page_type) {
      case "activation":
        return <ActivationContent client={client} page={page} />;
      case "agreement":
        return <AgreementContent client={client} page={page} />;
      case "confirmation":
        return <ConfirmationContent client={client} page={page} />;
      case "processing":
        return <ProcessingContent client={client} page={page} />;
      default:
        return <DefaultContent client={client} page={page} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Introduction */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {page.title}
        </h2>
        {page.content && (
          <p className="text-gray-600 max-w-2xl mx-auto">
            {page.content}
          </p>
        )}
      </div>

      {/* Page Status Indicator */}
      <div className="flex justify-center">
        <Badge 
          variant="outline" 
          className={`
            px-4 py-2 text-sm font-medium
            ${page.status === "completed" 
              ? "bg-green-100 text-green-800 border-green-300" 
              : page.status === "active"
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : "bg-gray-100 text-gray-600 border-gray-300"
            }
          `}
        >
          {page.status === "completed" && <CheckCircle className="h-4 w-4 mr-2" />}
          {page.status === "active" && <Clock className="h-4 w-4 mr-2" />}
          {formatPageType(page.status)}
        </Badge>
      </div>

      {/* Page-Specific Content */}
      {renderPageTypeContent()}

      {/* Page Metadata */}
      {page.metadata && Object.keys(page.metadata).length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 space-y-2">
              {page.metadata.estimated_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Estimated time: {page.metadata.estimated_time}</span>
                </div>
              )}
              {page.metadata.key_features && (
                <div className="space-y-1">
                  <div className="font-medium">Key features:</div>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    {page.metadata.key_features.map((feature: string, index: number) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Activation Page Content
function ActivationContent({ client, page }: { client: Client; page: JourneyPage }) {
  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Welcome {client.contact}! This is your personalized activation experience for {client.position} at {client.company}.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-6">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Priority Access</h3>
            <p className="text-sm text-gray-600">
              Get first look at premium opportunities
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <Zap className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Fast Results</h3>
            <p className="text-sm text-gray-600">
              Accelerated 14-day search process
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="p-6">
            <Users className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Expert Support</h3>
            <p className="text-sm text-gray-600">
              Dedicated specialist throughout
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Agreement Page Content
function AgreementContent({ client, page }: { client: Client; page: JourneyPage }) {
  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Review the service agreement for your {client.position} search. This ensures we're aligned on expectations and deliverables.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Key Agreement Points</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Exclusive 7-10 day search period</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Qualified candidate presentation within timeline</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Placement fee structure clearly defined</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>60-day candidate protection period</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Story 3.1: Payment Integration - Activation Fee Payment */}
      <PaymentSection client={client} />
    </div>
  );
}

// Confirmation Page Content
function ConfirmationContent({ client, page }: { client: Client; page: JourneyPage }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-800 mb-2">
          Priority Access Activated!
        </h3>
        <p className="text-green-700">
          Your search for {client.position} begins now
        </p>
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Your Search Details</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Position:</span> {client.position}</div>
            <div><span className="font-medium">Company:</span> {client.company}</div>
            <div><span className="font-medium">Salary Range:</span> {client.salary}</div>
            <div><span className="font-medium">Contact:</span> {client.email}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">What Happens Next</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">1</Badge>
              <div>
                <div className="font-medium">Dream Candidate Profile</div>
                <div className="text-sm text-gray-600">Today - Detailed specification for your review</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">2</Badge>
              <div>
                <div className="font-medium">First Qualified Profiles</div>
                <div className="text-sm text-gray-600">5-7 Days - Pre-vetted candidates matching your specs</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800 border-blue-300">3</Badge>
              <div>
                <div className="font-medium">Regular Progress Updates</div>
                <div className="text-sm text-gray-600">Every 2-3 Days - Pipeline status and next steps</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Processing Page Content
function ProcessingContent({ client, page }: { client: Client; page: JourneyPage }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">We're Working On Your Request</h3>
        <p className="text-gray-600">
          Your personalized search is now underway
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Current Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Search requirements confirmed</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Candidate sourcing initiated</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Screening qualified candidates</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span>First profiles preparation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          You'll receive an email update within 24 hours with your first candidate profiles. 
          Expected timeline: 2-5 business days for complete results.
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Default Content for any other page types
function DefaultContent({ client, page }: { client: Client; page: JourneyPage }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Info className="h-8 w-8 text-blue-500 mx-auto mb-3" />
        <h3 className="font-semibold mb-2">
          {formatPageType(page.page_type)} Page
        </h3>
        <p className="text-gray-600">
          This is your {page.page_type} step in the journey.
        </p>
      </CardContent>
    </Card>
  );
}

function formatPageType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Payment Section Component for Agreement Page
function PaymentSection({ client }: { client: Client }) {
  // Check if client has already paid
  const isPaid = client.payment_received || client.journey_outcome === 'paid';
  const paymentStatus = client.payment_status || 'unpaid';

  if (isPaid) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">
              Payment Confirmed
            </h3>
          </div>
          <div className="space-y-2 text-sm text-green-700">
            <p>Your $500 activation fee has been processed successfully.</p>
            <div className="flex items-center gap-2 mt-3">
              <PaymentStatus 
                status="paid" 
                amount={client.payment_amount || 500}
                paidAt={client.payment_timestamp || undefined}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50" data-testid="payment-section">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Priority Access Activation
          </h3>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Complete your activation with a one-time $500 priority access fee. 
            This ensures exclusive focus on your {client.position} search and unlocks:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Dedicated specialist assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>48-hour response guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Priority candidate sourcing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>Executive-level service standards</span>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <PaymentButton
              clientId={client.id}
              clientToken={client.token || ''}
              amount={500}
              className="w-full md:w-auto"
              onPaymentInitiated={(sessionId) => {
                console.log('Payment initiated for client:', client.id, 'Session:', sessionId);
              }}
              onError={(error) => {
                console.error('Payment error for client:', client.id, error);
              }}
            />
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>💳 Secure payment processing powered by Stripe</p>
            <p>🔒 Your payment information is encrypted and protected</p>
            <p>📧 You'll receive email confirmation upon successful payment</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}