/**
 * Client Detail Modal for Story 3.2: Payment Detail View Integration
 * Comprehensive client information with enhanced payment details
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Client, JourneyProgress } from '@/lib/supabase';
import { PaymentDetails } from '@/components/ui/PaymentDetails';
import { JourneyProgressCompact } from './JourneyProgress';
import { 
  User, 
  Building2, 
  Mail, 
  DollarSign, 
  Calendar,
  Target,
  Route,
  CreditCard,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface ClientDetailModalProps {
  client: Client;
  journeyProgress?: JourneyProgress;
  trigger: React.ReactNode;
  onRetryPayment?: (clientId: number) => void;
}

export function ClientDetailModal({ 
  client, 
  journeyProgress, 
  trigger, 
  onRetryPayment 
}: ClientDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              {client.logo ? (
                <img
                  src={client.logo}
                  alt={client.company}
                  className="w-6 h-6 rounded"
                />
              ) : (
                <Building2 className="w-4 h-4 text-blue-600" />
              )}
            </div>
            {client.company} - Client Details
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Details
              </TabsTrigger>
              <TabsTrigger value="journey" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Journey
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contact Name</Label>
                      <p className="text-sm text-muted-foreground">{client.contact}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${client.email}`} 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {client.email}
                      </a>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Position</Label>
                      <p className="text-sm text-muted-foreground">{client.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Salary Range</Label>
                      <p className="text-sm text-muted-foreground">{client.salary}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Activation Token</Label>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {client.token}
                      </code>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Tracking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Client Status</Label>
                      <Badge
                        variant={client.status === "activated" ? "default" : "secondary"}
                        className={
                          client.status === "activated"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {client.status === "activated" ? "Activated" : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Journey Outcome</Label>
                      <Badge className={
                        client.journey_outcome === 'paid' ? 'bg-green-100 text-green-800' :
                        client.journey_outcome === 'responded' ? 'bg-blue-100 text-blue-800' :
                        client.journey_outcome === 'ghosted' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        <Target className="w-3 h-3 mr-1" />
                        {client.journey_outcome || 'Pending'}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), 'PPP p')}
                      </p>
                    </div>

                    {client.activated_at && (
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Activated
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(client.activated_at), 'PPP p')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Journey Hypothesis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Journey Hypothesis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {client.hypothesis}
                  </p>
                </CardContent>
              </Card>

              {/* Outcome Notes */}
              {client.outcome_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Outcome Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {client.outcome_notes}
                    </p>
                    {client.outcome_timestamp && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {format(new Date(client.outcome_timestamp), 'PPP p')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payment Details Tab */}
            <TabsContent value="payment" className="space-y-6">
              <PaymentDetails 
                client={client} 
                onRetryPayment={onRetryPayment}
              />
            </TabsContent>

            {/* Journey Tab */}
            <TabsContent value="journey" className="space-y-6">
              {journeyProgress ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      Journey Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <JourneyProgressCompact progress={journeyProgress} />
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Progress</Label>
                        <p className="text-muted-foreground">
                          {journeyProgress.completed_pages} of {journeyProgress.total_pages} pages completed
                        </p>
                      </div>
                      <div>
                        <Label className="font-medium">Current Step</Label>
                        <p className="text-muted-foreground">
                          Step {journeyProgress.current_step} of {journeyProgress.total_pages}
                        </p>
                      </div>
                    </div>

                    {journeyProgress.active_page && (
                      <div className="mt-4">
                        <Label className="font-medium">Active Page</Label>
                        <div className="mt-2 p-3 bg-muted/50 rounded border">
                          <h4 className="font-medium">{journeyProgress.active_page.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {journeyProgress.active_page.page_type} - Page {journeyProgress.active_page.page_order}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/journey/${client.token}`, '_blank')}
                      >
                        Preview Journey
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/dashboard/journey/${client.id}`, '_blank')}
                      >
                        Edit Journey
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No journey progress available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}