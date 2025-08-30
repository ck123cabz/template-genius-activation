"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Eye,
  CheckCircle,
  Route,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Client, JourneyProgress, JourneyPage } from "@/lib/supabase";
import {
  createClient,
  updateClientStatus,
  deleteClient,
} from "@/app/actions/client-actions";
import { getClientJourneyProgress } from "@/app/actions/journey-actions";
import { useFormState } from "react-dom";
import { JourneyProgressCompact, JourneyStatusBadge } from "./JourneyProgress";

interface ClientListProps {
  initialClients: Client[];
}

export default function ClientList({ initialClients }: ClientListProps) {
  const [clients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [journeyProgressMap, setJourneyProgressMap] = useState<Map<number, JourneyProgress>>(new Map());

  const [createState, createAction] = useFormState(
    async (prevState: any, formData: FormData) => {
      const result = await createClient(formData);
      if (result.success) {
        setIsCreateDialogOpen(false);
        // Load journey progress for the new client
        if (result.client) {
          loadJourneyProgress(result.client.id);
        }
      }
      return result;
    },
    { success: false },
  );

  // Load journey progress for all clients
  useEffect(() => {
    const loadAllJourneyProgress = async () => {
      const progressMap = new Map<number, JourneyProgress>();
      
      for (const client of clients) {
        await loadJourneyProgress(client.id, progressMap);
      }
      
      setJourneyProgressMap(progressMap);
    };

    loadAllJourneyProgress();
  }, [clients]);

  // Helper function to load journey progress for a specific client
  const loadJourneyProgress = async (clientId: number, targetMap?: Map<number, JourneyProgress>) => {
    try {
      const result = await getClientJourneyProgress(clientId);
      if (result.success && result.progress) {
        const mapToUpdate = targetMap || new Map(journeyProgressMap);
        mapToUpdate.set(clientId, result.progress);
        if (!targetMap) {
          setJourneyProgressMap(mapToUpdate);
        }
      }
    } catch (error) {
      console.error(`Failed to load journey progress for client ${clientId}:`, error);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.token.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = (
    clientId: number,
    status: "pending" | "activated",
  ) => {
    startTransition(() => {
      updateClientStatus(clientId, status);
    });
  };

  const handleDelete = (clientId: number) => {
    startTransition(() => {
      deleteClient(clientId);
    });
  };

  const copyActivationLink = (clientId: number) => {
    const link = `${window.location.origin}/activate/${clientId}`;
    navigator.clipboard.writeText(link);
  };

  const stats = {
    total: clients.length,
    activated: clients.filter((c) => c.status === "activated").length,
    pending: clients.filter((c) => c.status === "pending").length,
    conversionRate:
      clients.length > 0
        ? Math.round(
            (clients.filter((c) => c.status === "activated").length /
              clients.length) *
              100,
          )
        : 0,
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activated}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <div className="text-sm text-muted-foreground">%</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "activated" ? "default" : "outline"}
            onClick={() => setStatusFilter("activated")}
            size="sm"
          >
            Activated
          </Button>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <form action={createAction} className="space-y-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" required />
              </div>
              <div>
                <Label htmlFor="contact">Contact Name</Label>
                <Input id="contact" name="contact" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input id="position" name="position" required />
              </div>
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  name="salary"
                  placeholder="$120,000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="hypothesis">Journey Hypothesis *</Label>
                <Textarea
                  id="hypothesis"
                  name="hypothesis"
                  placeholder="What drives this client's conversion? E.g., seeking better work-life balance, career growth, or remote flexibility..."
                  required
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Describe your hypothesis about what motivates this client to convert
                </p>
              </div>
              <div>
                <Label htmlFor="logo">Logo URL (Optional)</Label>
                <Input id="logo" name="logo" type="url" />
              </div>
              {createState?.error && (
                <p className="text-sm text-red-500">{createState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating..." : "Create Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={client.company}
                      className="w-8 h-8 rounded"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{client.company}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {client.contact}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => copyActivationLink(client.id)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(`/activate/${client.id}`, "_blank")
                    }
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(`/dashboard/journey/${client.id}`, "_blank")
                    }
                  >
                    <Route className="w-4 h-4 mr-2" />
                    Edit Journey
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleStatusUpdate(
                        client.id,
                        client.status === "activated" ? "pending" : "activated",
                      )
                    }
                    disabled={isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {client.status === "activated"
                      ? "Mark Pending"
                      : "Mark Activated"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(client.id)}
                    disabled={isPending}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {client.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Position:</span>{" "}
                  {client.position}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Salary:</span> {client.salary}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Token:</span>{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                    {client.token}
                  </code>
                </p>
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Journey Hypothesis:</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {client.hypothesis}
                  </p>
                </div>
                {/* Journey Progress Section */}
                {journeyProgressMap.has(client.id) && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium flex items-center">
                        <Route className="w-4 h-4 mr-1 text-blue-600" />
                        Journey Progress
                      </p>
                      <JourneyStatusBadge 
                        progress={journeyProgressMap.get(client.id)!} 
                        className="text-xs"
                      />
                    </div>
                    <JourneyProgressCompact 
                      progress={journeyProgressMap.get(client.id)!}
                      className="mb-2"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <Badge
                    variant={
                      client.status === "activated" ? "default" : "secondary"
                    }
                    className={
                      client.status === "activated"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    }
                  >
                    {client.status === "activated" ? "Activated" : "Pending"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
