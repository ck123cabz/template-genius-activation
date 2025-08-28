"use client";

import { useState, useEffect } from "react";
import { supabase, clientService, contentService, AgreementContent, ConfirmationContent } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Clock,
  CheckCircle,
  Download,
  Copy,
  Eye,
  TrendingUp,
  Edit3,
  Save,
  FileText,
  ExternalLink,
  Pencil,
  X,
  ScrollText,
  CheckSquare,
  Trash2,
  MoveUp,
  MoveDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const defaultContent = {
  activation: {
    title: "Activate Priority Access",
    subtitle: "Get first access to top talent and enhanced recruitment support",
    benefits: [
      {
        title: "Priority Talent Access",
        description:
          "First look at pre-vetted candidates from our premium pool",
        icon: "star",
      },
      {
        title: "Accelerated Timeline",
        description: "Dedicated 14-day search period with faster results",
        icon: "clock",
      },
      {
        title: "Dedicated Support",
        description: "Personal talent specialist and enhanced screening",
        icon: "users",
      },
      {
        title: "Committed Search",
        description: "Focused 14-day search period for optimal results",
        icon: "check",
      },
    ],
    paymentOptions: {
      optionA: {
        title: "Traditional Placement",
        description: "25% placement fee upon successful hire",
        fee: "$500",
        details: "Activation fee credited towards placement fee when you hire",
        additionalInfo: "+ 25% placement fee (activation fee credited)",
      },
      optionB: {
        title: "Monthly Retainer",
        description:
          "Monthly retainer acts as placement fee with future buyout option",
        fee: "$500",
        details: "Activation fee credited towards first month's retainer",
        additionalInfo: "+ $1,200/month retainer (acts as placement fee)",
        popular: true,
      },
    },
    investmentDetails: [
      "Your $500 activation fee is fully credited towards your placement fee or first month's retainer",
      "No hidden costs or additional fees during the search process",
      "Transparent pricing with clear value delivery milestones",
    ],
    guaranteeInfo: {
      period: "6-month replacement coverage",
      description:
        "Free replacement if hired candidate doesn't work out within 6 months",
    },
    searchPeriod: "14-day priority access",
    activationFee: "$500",
  },
};

// Mock data for demonstration
const mockClients = [
  {
    id: 1,
    company: "TechCorp",
    contact: "Sarah Johnson",
    email: "sarah@techcorp.com",
    position: "Senior Frontend Developer",
    salary: "$2,000 - $3,000/month",
    status: "activated",
    createdAt: "2024-01-15",
    activatedAt: "2024-01-16",
    logo: "/techcorp-logo.png",
  },
  {
    id: 2,
    company: "StartupXYZ",
    contact: "Mike Chen",
    email: "mike@startupxyz.com",
    position: "Full Stack Developer",
    salary: "$3,500 - $5,000/month",
    status: "pending",
    createdAt: "2024-01-18",
    activatedAt: null,
    logo: "/abstract-startup-logo.png",
  },
  {
    id: 3,
    company: "InnovateLabs",
    contact: "Lisa Rodriguez",
    email: "lisa@innovatelabs.com",
    position: "React Developer",
    salary: "$2,500 - $4,000/month",
    status: "activated",
    createdAt: "2024-01-20",
    activatedAt: "2024-01-21",
    logo: "/innovate-logo.png",
  },
];

export default function DashboardPage() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    company: "",
    contact: "",
    email: "",
    position: "",
    salary: "",
  });
  const [editingClient, setEditingClient] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [content, setContent] = useState(defaultContent);
  const [editingContent, setEditingContent] = useState(defaultContent);
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  const [agreementContent, setAgreementContent] = useState<AgreementContent | null>(null);
  const [editingAgreementContent, setEditingAgreementContent] = useState<AgreementContent | null>(null);
  const [isEditingAgreement, setIsEditingAgreement] = useState(false);
  
  const [confirmationContent, setConfirmationContent] = useState<ConfirmationContent | null>(null);
  const [editingConfirmationContent, setEditingConfirmationContent] = useState<ConfirmationContent | null>(null);
  const [isEditingConfirmation, setIsEditingConfirmation] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [clientsData, contentData, agreementData, confirmationData] = await Promise.all([
          clientService.getAll(),
          contentService.getCurrent(),
          contentService.getAgreementContent(),
          contentService.getConfirmationContent(),
        ]);

        setClients(clientsData);
        if (contentData) {
          setContent(contentData);
          setEditingContent(contentData);
        } else {
          // Keep using defaultContent if no data from Supabase
          setContent(defaultContent);
          setEditingContent(defaultContent);
        }
        
        if (agreementData) {
          setAgreementContent(agreementData);
          setEditingAgreementContent(agreementData);
        }
        
        if (confirmationData) {
          setConfirmationContent(confirmationData);
          setEditingConfirmationContent(confirmationData);
        }
      } catch (error) {
        console.error("Error loading data from Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clients.length,
    activated: clients.filter((c) => c.status === "activated").length,
    pending: clients.filter((c) => c.status === "pending").length,
    conversionRate: Math.round(
      (clients.filter((c) => c.status === "activated").length /
        clients.length) *
        100,
    ),
  };

  const handleCreateClient = async () => {
    try {
      const clientData = {
        company: newClient.company,
        contact: newClient.contact,
        email: newClient.email,
        position: newClient.position,
        salary: newClient.salary,
        logo: null,
      };

      const createdClient = await clientService.create(clientData);
      setClients([createdClient, ...clients]);
      setNewClient({
        company: "",
        contact: "",
        email: "",
        position: "",
        salary: "",
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating client:", error);
      // In a real app, you'd show an error toast here
    }
  };

  const copyActivationLink = async (clientId: number) => {
    try {
      const link = `${window.location.origin}/activate/${clientId}`;
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copied!",
        description: "Activation link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the activation link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openActivationPage = (clientId: number) => {
    const link = `${window.location.origin}/activate/${clientId}`;
    window.open(link, "_blank");
  };

  const handleEditClient = (client) => {
    setEditingClient({
      id: client.id,
      company: client.company,
      contact: client.contact,
      email: client.email,
      position: client.position,
      salary: client.salary,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    try {
      const updatedClient = await clientService.update(editingClient.id, {
        company: editingClient.company,
        contact: editingClient.contact,
        email: editingClient.email,
        position: editingClient.position,
        salary: editingClient.salary,
      });

      setClients(
        clients.map((client) =>
          client.id === editingClient.id ? updatedClient : client,
        ),
      );

      setIsEditDialogOpen(false);
      setEditingClient(null);

      toast({
        title: "Client updated!",
        description: "Client information has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        title: "Update failed",
        description: "Could not update client information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveContent = async () => {
    try {
      const updatedContent = await contentService.update(editingContent);
      setContent(updatedContent);
      setIsEditingContent(false);
      toast({
        title: "Content saved!",
        description: "Activation page content has been updated successfully.",
      });
      console.log("Content saved to Supabase:", updatedContent);
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Save failed",
        description: "Could not save content changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingContent(content);
    setIsEditingContent(false);
  };

  const handleSaveAgreementContent = async () => {
    if (!editingAgreementContent) return;
    
    try {
      const updatedContent = await contentService.updateAgreementContent(editingAgreementContent);
      setAgreementContent(updatedContent);
      setIsEditingAgreement(false);
      toast({
        title: "Agreement content saved!",
        description: "Agreement page content has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving agreement content:", error);
      toast({
        title: "Save failed",
        description: "Could not save agreement content changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelAgreementEdit = () => {
    setEditingAgreementContent(agreementContent);
    setIsEditingAgreement(false);
  };

  const handleSaveConfirmationContent = async () => {
    if (!editingConfirmationContent) return;
    
    try {
      const updatedContent = await contentService.updateConfirmationContent(editingConfirmationContent);
      setConfirmationContent(updatedContent);
      setIsEditingConfirmation(false);
      toast({
        title: "Confirmation content saved!",
        description: "Confirmation page content has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving confirmation content:", error);
      toast({
        title: "Save failed",
        description: "Could not save confirmation content changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelConfirmationEdit = () => {
    setEditingConfirmationContent(confirmationContent);
    setIsEditingConfirmation(false);
  };

  // Agreement section management functions
  const addAgreementSection = () => {
    if (!editingAgreementContent) return;
    
    const newSection = {
      title: "New Section",
      content: "Enter section content here...",
      subsections: [],
    };
    
    setEditingAgreementContent({
      ...editingAgreementContent,
      sections: [...editingAgreementContent.sections, newSection],
    });
  };

  const removeAgreementSection = (sectionIndex: number) => {
    if (!editingAgreementContent) return;
    
    const newSections = editingAgreementContent.sections.filter((_, index) => index !== sectionIndex);
    setEditingAgreementContent({
      ...editingAgreementContent,
      sections: newSections,
    });
  };

  const updateAgreementSection = (sectionIndex: number, field: string, value: string) => {
    if (!editingAgreementContent) return;
    
    const newSections = [...editingAgreementContent.sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], [field]: value };
    setEditingAgreementContent({
      ...editingAgreementContent,
      sections: newSections,
    });
  };

  const addAgreementSubsection = (sectionIndex: number) => {
    if (!editingAgreementContent) return;
    
    const newSubsection = {
      title: "New Subsection",
      content: "Enter subsection content here...",
      highlight: false,
    };
    
    const newSections = [...editingAgreementContent.sections];
    if (!newSections[sectionIndex].subsections) {
      newSections[sectionIndex].subsections = [];
    }
    newSections[sectionIndex].subsections!.push(newSubsection);
    
    setEditingAgreementContent({
      ...editingAgreementContent,
      sections: newSections,
    });
  };

  const removeAgreementSubsection = (sectionIndex: number, subsectionIndex: number) => {
    if (!editingAgreementContent) return;
    
    const newSections = [...editingAgreementContent.sections];
    newSections[sectionIndex].subsections = newSections[sectionIndex].subsections?.filter((_, index) => index !== subsectionIndex) || [];
    
    setEditingAgreementContent({
      ...editingAgreementContent,
      sections: newSections,
    });
  };

  const updateAgreementSubsection = (sectionIndex: number, subsectionIndex: number, field: string, value: string | boolean) => {
    if (!editingAgreementContent) return;
    
    const newSections = [...editingAgreementContent.sections];
    if (newSections[sectionIndex].subsections) {
      newSections[sectionIndex].subsections![subsectionIndex] = { 
        ...newSections[sectionIndex].subsections![subsectionIndex], 
        [field]: value 
      };
    }
    
    setEditingAgreementContent({
      ...editingAgreementContent,
      sections: newSections,
    });
  };

  // Agreement definitions management
  const addAgreementDefinition = () => {
    if (!editingAgreementContent) return;
    
    const newDefinition = {
      term: "New Term",
      definition: "Enter definition here...",
    };
    
    setEditingAgreementContent({
      ...editingAgreementContent,
      definitions: [...editingAgreementContent.definitions, newDefinition],
    });
  };

  const removeAgreementDefinition = (definitionIndex: number) => {
    if (!editingAgreementContent) return;
    
    const newDefinitions = editingAgreementContent.definitions.filter((_, index) => index !== definitionIndex);
    setEditingAgreementContent({
      ...editingAgreementContent,
      definitions: newDefinitions,
    });
  };

  const updateAgreementDefinition = (definitionIndex: number, field: string, value: string) => {
    if (!editingAgreementContent) return;
    
    const newDefinitions = [...editingAgreementContent.definitions];
    newDefinitions[definitionIndex] = { ...newDefinitions[definitionIndex], [field]: value };
    setEditingAgreementContent({
      ...editingAgreementContent,
      definitions: newDefinitions,
    });
  };

  const updateBenefit = (index: number, field: string, value: string) => {
    const newBenefits = [...editingContent.activation.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setEditingContent({
      ...editingContent,
      activation: {
        ...editingContent.activation,
        benefits: newBenefits,
      },
    });
  };

  const updateInvestmentDetail = (index: number, value: string) => {
    const newDetails = [...editingContent.activation.investmentDetails];
    newDetails[index] = value;
    setEditingContent({
      ...editingContent,
      activation: {
        ...editingContent.activation,
        investmentDetails: newDetails,
      },
    });
  };

  const addInvestmentDetail = () => {
    const newDetails = [...editingContent.activation.investmentDetails, ""];
    setEditingContent({
      ...editingContent,
      activation: {
        ...editingContent.activation,
        investmentDetails: newDetails,
      },
    });
  };

  const removeInvestmentDetail = (index: number) => {
    const newDetails = editingContent.activation.investmentDetails.filter(
      (_, i) => i !== index,
    );
    setEditingContent({
      ...editingContent,
      activation: {
        ...editingContent.activation,
        investmentDetails: newDetails,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Genius%20Logo%20-%20Light%202-gC6g2vyhQtht3shTSIzEBgta6vmSoU.png"
                alt="Genius Logo"
                className="w-8 h-8"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Priority Access Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Manage client activations and content
                </p>
              </div>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={newClient.company}
                      onChange={(e) =>
                        setNewClient({ ...newClient, company: e.target.value })
                      }
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Person</Label>
                    <Input
                      id="contact"
                      value={newClient.contact}
                      onChange={(e) =>
                        setNewClient({ ...newClient, contact: e.target.value })
                      }
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) =>
                        setNewClient({ ...newClient, email: e.target.value })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={newClient.position}
                      onChange={(e) =>
                        setNewClient({ ...newClient, position: e.target.value })
                      }
                      placeholder="Enter position title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input
                      id="salary"
                      value={newClient.salary}
                      onChange={(e) =>
                        setNewClient({ ...newClient, salary: e.target.value })
                      }
                      placeholder="e.g., $2,000 - $3,000/month"
                    />
                  </div>
                  <Button
                    onClick={handleCreateClient}
                    className="w-full"
                    disabled={
                      !newClient.company ||
                      !newClient.contact ||
                      !newClient.email
                    }
                  >
                    Create Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Client Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-company">Company Name</Label>
                    <Input
                      id="edit-company"
                      value={editingClient?.company || ""}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          company: e.target.value,
                        })
                      }
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-contact">Contact Person</Label>
                    <Input
                      id="edit-contact"
                      value={editingClient?.contact || ""}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          contact: e.target.value,
                        })
                      }
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingClient?.email || ""}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-position">Position</Label>
                    <Input
                      id="edit-position"
                      value={editingClient?.position || ""}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          position: e.target.value,
                        })
                      }
                      placeholder="Enter position title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-salary">Salary Range</Label>
                    <Input
                      id="edit-salary"
                      value={editingClient?.salary || ""}
                      onChange={(e) =>
                        setEditingClient({
                          ...editingClient,
                          salary: e.target.value,
                        })
                      }
                      placeholder="e.g., $2,000 - $3,000/month"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingClient(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpdateClient}
                      className="flex-1"
                      disabled={
                        !editingClient?.company ||
                        !editingClient?.contact ||
                        !editingClient?.email
                      }
                    >
                      Update Client
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client Management
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading from Supabase database...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total Clients
                          </p>
                          <p className="text-3xl font-bold text-foreground">
                            {stats.total}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Activated
                          </p>
                          <p className="text-3xl font-bold text-accent">
                            {stats.activated}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-accent" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Pending
                          </p>
                          <p className="text-3xl font-bold text-chart-3">
                            {stats.pending}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-chart-3" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Conversion Rate
                          </p>
                          <p className="text-3xl font-bold text-primary">
                            {stats.conversionRate}%
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters and Search */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={
                            statusFilter === "all" ? "default" : "outline"
                          }
                          onClick={() => setStatusFilter("all")}
                          size="sm"
                        >
                          All
                        </Button>
                        <Button
                          variant={
                            statusFilter === "pending" ? "default" : "outline"
                          }
                          onClick={() => setStatusFilter("pending")}
                          size="sm"
                        >
                          Pending
                        </Button>
                        <Button
                          variant={
                            statusFilter === "activated" ? "default" : "outline"
                          }
                          onClick={() => setStatusFilter("activated")}
                          size="sm"
                        >
                          Activated
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Client Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={client.logo || "/placeholder.svg"}
                              alt={`${client.company} logo`}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {client.company}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {client.contact} • {client.position}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {client.salary}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <Badge
                              variant={
                                client.status === "activated"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {client.status === "activated" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Activated
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openActivationPage(client.id)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open Activation Page
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => copyActivationLink(client.id)}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Activation Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditClient(client)}
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit Client
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {client.status === "activated" && (
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}

                      {filteredClients.length === 0 && (
                        <div className="text-center py-12">
                          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            No clients found
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {searchTerm || statusFilter !== "all"
                              ? "Try adjusting your search or filters"
                              : "Get started by creating your first client"}
                          </p>
                          {!searchTerm && statusFilter === "all" && (
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Create First Client
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {isLoading || !editingContent?.activation ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading content from Supabase database...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Activation Page Content
                      </CardTitle>
                      <div className="flex gap-2">
                        {isEditingContent ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={handleCancelEdit}
                              size="sm"
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSaveContent} size="sm">
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(`/activate/preview`, "_blank")
                              }
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                            <Button
                              onClick={() => setIsEditingContent(true)}
                              size="sm"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit Content
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs defaultValue="main" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="main">Main Content</TabsTrigger>
                        <TabsTrigger value="benefits">Benefits</TabsTrigger>
                        <TabsTrigger value="payment">Payment</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="agreement" className="flex items-center gap-1">
                          <ScrollText className="w-3 h-3" />
                          Agreement
                        </TabsTrigger>
                        <TabsTrigger value="confirmation" className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3" />
                          Confirmation
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="main" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor="title">Main Title</Label>
                            <Input
                              id="title"
                              value={editingContent.activation.title}
                              onChange={(e) =>
                                setEditingContent({
                                  ...editingContent,
                                  activation: {
                                    ...editingContent.activation,
                                    title: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditingContent}
                              className="text-lg font-semibold"
                            />
                          </div>
                          <div>
                            <Label htmlFor="subtitle">Subtitle</Label>
                            <Textarea
                              id="subtitle"
                              value={editingContent.activation.subtitle}
                              onChange={(e) =>
                                setEditingContent({
                                  ...editingContent,
                                  activation: {
                                    ...editingContent.activation,
                                    subtitle: e.target.value,
                                  },
                                })
                              }
                              disabled={!isEditingContent}
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="activationFee">
                                Activation Fee
                              </Label>
                              <Input
                                id="activationFee"
                                value={editingContent.activation.activationFee}
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      activationFee: e.target.value,
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                            </div>
                            <div>
                              <Label htmlFor="searchPeriod">
                                Search Period
                              </Label>
                              <Input
                                id="searchPeriod"
                                value={editingContent.activation.searchPeriod}
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      searchPeriod: e.target.value,
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="benefits" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {editingContent.activation.benefits.map(
                            (benefit, index) => (
                              <Card key={index} className="p-4">
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Benefit title"
                                    value={benefit.title}
                                    onChange={(e) =>
                                      updateBenefit(
                                        index,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    disabled={!isEditingContent}
                                    className="font-medium"
                                  />
                                  <Textarea
                                    placeholder="Benefit description"
                                    value={benefit.description}
                                    onChange={(e) =>
                                      updateBenefit(
                                        index,
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    disabled={!isEditingContent}
                                    rows={3}
                                  />
                                </div>
                              </Card>
                            ),
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="payment" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="p-4">
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">
                                Option A - Traditional Placement
                              </Label>
                              <Input
                                placeholder="Title"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionA.title
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionA: {
                                          ...editingContent.activation
                                            .paymentOptions.optionA,
                                          title: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                              <Textarea
                                placeholder="Description"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionA.description
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionA: {
                                          ...editingContent.activation
                                            .paymentOptions.optionA,
                                          description: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                                rows={2}
                              />
                              <Input
                                placeholder="Fee"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionA.fee
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionA: {
                                          ...editingContent.activation
                                            .paymentOptions.optionA,
                                          fee: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                              <Textarea
                                placeholder="Details"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionA.details
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionA: {
                                          ...editingContent.activation
                                            .paymentOptions.optionA,
                                          details: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                                rows={2}
                              />
                              <Input
                                placeholder="Additional Info"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionA.additionalInfo
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionA: {
                                          ...editingContent.activation
                                            .paymentOptions.optionA,
                                          additionalInfo: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                            </div>
                          </Card>

                          <Card className="p-4">
                            <div className="space-y-3">
                              <Label className="text-base font-semibold">
                                Option B - Monthly Retainer
                              </Label>
                              <Input
                                placeholder="Title"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionB.title
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionB: {
                                          ...editingContent.activation
                                            .paymentOptions.optionB,
                                          title: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                              <Textarea
                                placeholder="Description"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionB.description
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionB: {
                                          ...editingContent.activation
                                            .paymentOptions.optionB,
                                          description: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                                rows={2}
                              />
                              <Input
                                placeholder="Fee"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionB.fee
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionB: {
                                          ...editingContent.activation
                                            .paymentOptions.optionB,
                                          fee: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                              <Textarea
                                placeholder="Details"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionB.details
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionB: {
                                          ...editingContent.activation
                                            .paymentOptions.optionB,
                                          details: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                                rows={2}
                              />
                              <Input
                                placeholder="Additional Info"
                                value={
                                  editingContent.activation.paymentOptions
                                    .optionB.additionalInfo
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      paymentOptions: {
                                        ...editingContent.activation
                                          .paymentOptions,
                                        optionB: {
                                          ...editingContent.activation
                                            .paymentOptions.optionB,
                                          additionalInfo: e.target.value,
                                        },
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="details" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-base font-semibold mb-3 block">
                              Investment Details
                            </Label>
                            <div className="space-y-3">
                              {editingContent?.activation?.investmentDetails?.map(
                                (detail, index) => (
                                  <Textarea
                                    key={index}
                                    placeholder={`Investment detail ${index + 1}`}
                                    value={detail}
                                    onChange={(e) =>
                                      updateInvestmentDetail(
                                        index,
                                        e.target.value,
                                      )
                                    }
                                    disabled={!isEditingContent}
                                    rows={2}
                                  />
                                ),
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="guaranteePeriod">
                                Guarantee Period
                              </Label>
                              <Input
                                id="guaranteePeriod"
                                value={
                                  editingContent.activation.guaranteeInfo.period
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      guaranteeInfo: {
                                        ...editingContent.activation
                                          .guaranteeInfo,
                                        period: e.target.value,
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                              />
                            </div>
                            <div>
                              <Label htmlFor="guaranteeDescription">
                                Guarantee Description
                              </Label>
                              <Textarea
                                id="guaranteeDescription"
                                value={
                                  editingContent.activation.guaranteeInfo
                                    .description
                                }
                                onChange={(e) =>
                                  setEditingContent({
                                    ...editingContent,
                                    activation: {
                                      ...editingContent.activation,
                                      guaranteeInfo: {
                                        ...editingContent.activation
                                          .guaranteeInfo,
                                        description: e.target.value,
                                      },
                                    },
                                  })
                                }
                                disabled={!isEditingContent}
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="agreement" className="space-y-4">
                        {agreementContent && editingAgreementContent ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Agreement Page Content</h3>
                              <div className="flex gap-2">
                                {isEditingAgreement ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={handleCancelAgreementEdit}
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveAgreementContent} size="sm">
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => window.open(`/agreement`, "_blank")}
                                      size="sm"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Preview
                                    </Button>
                                    <Button
                                      onClick={() => setIsEditingAgreement(true)}
                                      size="sm"
                                    >
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Edit Content
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="agreement-title">Page Title</Label>
                                  <Input
                                    id="agreement-title"
                                    value={editingAgreementContent.page_title}
                                    onChange={(e) =>
                                      setEditingAgreementContent({
                                        ...editingAgreementContent,
                                        page_title: e.target.value,
                                      })
                                    }
                                    disabled={!isEditingAgreement}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="agreement-main-title">Main Title</Label>
                                  <Input
                                    id="agreement-main-title"
                                    value={editingAgreementContent.main_title}
                                    onChange={(e) =>
                                      setEditingAgreementContent({
                                        ...editingAgreementContent,
                                        main_title: e.target.value,
                                      })
                                    }
                                    disabled={!isEditingAgreement}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-base font-semibold">Company Information</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label htmlFor="company-name">Company Name</Label>
                                    <Input
                                      id="company-name"
                                      value={editingAgreementContent.company_info.name}
                                      onChange={(e) =>
                                        setEditingAgreementContent({
                                          ...editingAgreementContent,
                                          company_info: {
                                            ...editingAgreementContent.company_info,
                                            name: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingAgreement}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="company-legal-name">Legal Name</Label>
                                    <Input
                                      id="company-legal-name"
                                      value={editingAgreementContent.company_info.legal_name}
                                      onChange={(e) =>
                                        setEditingAgreementContent({
                                          ...editingAgreementContent,
                                          company_info: {
                                            ...editingAgreementContent.company_info,
                                            legal_name: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingAgreement}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="company-website">Website</Label>
                                    <Input
                                      id="company-website"
                                      value={editingAgreementContent.company_info.website}
                                      onChange={(e) =>
                                        setEditingAgreementContent({
                                          ...editingAgreementContent,
                                          company_info: {
                                            ...editingAgreementContent.company_info,
                                            website: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingAgreement}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="company-address">Address</Label>
                                    <Input
                                      id="company-address"
                                      value={editingAgreementContent.company_info.address}
                                      onChange={(e) =>
                                        setEditingAgreementContent({
                                          ...editingAgreementContent,
                                          company_info: {
                                            ...editingAgreementContent.company_info,
                                            address: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingAgreement}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-base font-semibold">Contact Information</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label htmlFor="contact-email">Contact Email</Label>
                                    <Input
                                      id="contact-email"
                                      value={editingAgreementContent.contact_info.email}
                                      onChange={(e) =>
                                        setEditingAgreementContent({
                                          ...editingAgreementContent,
                                          contact_info: {
                                            ...editingAgreementContent.contact_info,
                                            email: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingAgreement}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="support-text">Support Text</Label>
                                    <Input
                                      id="support-text"
                                      value={editingAgreementContent.contact_info.support_text}
                                      onChange={(e) =>
                                        setEditingAgreementContent({
                                          ...editingAgreementContent,
                                          contact_info: {
                                            ...editingAgreementContent.contact_info,
                                            support_text: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingAgreement}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label className="text-base font-semibold">Definitions</Label>
                                <div className="space-y-3 mt-2">
                                  {editingAgreementContent.definitions.map((definition, index) => (
                                    <Card key={index} className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <Label className="font-medium">Definition {index + 1}</Label>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeAgreementDefinition(index)}
                                          disabled={!isEditingAgreement}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                      <div className="grid grid-cols-1 gap-3">
                                        <div>
                                          <Label>Term</Label>
                                          <Input
                                            value={definition.term}
                                            onChange={(e) =>
                                              updateAgreementDefinition(index, "term", e.target.value)
                                            }
                                            disabled={!isEditingAgreement}
                                            placeholder="Enter term"
                                          />
                                        </div>
                                        <div>
                                          <Label>Definition</Label>
                                          <Textarea
                                            value={definition.definition}
                                            onChange={(e) =>
                                              updateAgreementDefinition(index, "definition", e.target.value)
                                            }
                                            disabled={!isEditingAgreement}
                                            rows={2}
                                            placeholder="Enter definition"
                                          />
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                  
                                  {isEditingAgreement && (
                                    <Button
                                      variant="outline"
                                      onClick={addAgreementDefinition}
                                      className="w-full"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Definition
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="text-base font-semibold">Agreement Sections</Label>
                                  {isEditingAgreement && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addAgreementSection}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Section
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="space-y-4">
                                  {editingAgreementContent.sections.map((section, sectionIndex) => (
                                    <Card key={sectionIndex} className="p-4">
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <Label className="font-medium">Section {sectionIndex + 2}: {section.title}</Label>
                                          {isEditingAgreement && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => removeAgreementSection(sectionIndex)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-3">
                                          <div>
                                            <Label>Section Title</Label>
                                            <Input
                                              value={section.title}
                                              onChange={(e) =>
                                                updateAgreementSection(sectionIndex, "title", e.target.value)
                                              }
                                              disabled={!isEditingAgreement}
                                              placeholder="Enter section title"
                                            />
                                          </div>
                                          
                                          <div>
                                            <Label>Section Content</Label>
                                            <Textarea
                                              value={section.content}
                                              onChange={(e) =>
                                                updateAgreementSection(sectionIndex, "content", e.target.value)
                                              }
                                              disabled={!isEditingAgreement}
                                              rows={3}
                                              placeholder="Enter section content"
                                            />
                                          </div>
                                        </div>

                                        <div className="border-t pt-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <Label className="font-medium">Subsections</Label>
                                            {isEditingAgreement && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addAgreementSubsection(sectionIndex)}
                                              >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Subsection
                                              </Button>
                                            )}
                                          </div>
                                          
                                          <div className="space-y-3">
                                            {section.subsections?.map((subsection, subsectionIndex) => (
                                              <Card key={subsectionIndex} className="p-3 bg-gray-50">
                                                <div className="space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">
                                                      Subsection {subsectionIndex + 1}
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                      <div className="flex items-center space-x-2">
                                                        <input
                                                          type="checkbox"
                                                          id={`highlight-${sectionIndex}-${subsectionIndex}`}
                                                          checked={subsection.highlight}
                                                          onChange={(e) =>
                                                            updateAgreementSubsection(
                                                              sectionIndex,
                                                              subsectionIndex,
                                                              "highlight",
                                                              e.target.checked
                                                            )
                                                          }
                                                          disabled={!isEditingAgreement}
                                                          className="rounded"
                                                        />
                                                        <Label 
                                                          htmlFor={`highlight-${sectionIndex}-${subsectionIndex}`}
                                                          className="text-xs"
                                                        >
                                                          Highlight
                                                        </Label>
                                                      </div>
                                                      {isEditingAgreement && (
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() => removeAgreementSubsection(sectionIndex, subsectionIndex)}
                                                          className="text-red-600 hover:text-red-700"
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  <div>
                                                    <Label className="text-xs">Subsection Title</Label>
                                                    <Input
                                                      value={subsection.title}
                                                      onChange={(e) =>
                                                        updateAgreementSubsection(
                                                          sectionIndex,
                                                          subsectionIndex,
                                                          "title",
                                                          e.target.value
                                                        )
                                                      }
                                                      disabled={!isEditingAgreement}
                                                      size="sm"
                                                      placeholder="Enter subsection title"
                                                    />
                                                  </div>
                                                  
                                                  <div>
                                                    <Label className="text-xs">Subsection Content</Label>
                                                    <Textarea
                                                      value={subsection.content}
                                                      onChange={(e) =>
                                                        updateAgreementSubsection(
                                                          sectionIndex,
                                                          subsectionIndex,
                                                          "content",
                                                          e.target.value
                                                        )
                                                      }
                                                      disabled={!isEditingAgreement}
                                                      rows={3}
                                                      placeholder="Enter subsection content (use • for bullet points)"
                                                    />
                                                  </div>
                                                </div>
                                              </Card>
                                            )) || (
                                              <p className="text-sm text-gray-500 text-center py-2">
                                                No subsections added yet
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="footer-text">Footer Text</Label>
                                <Textarea
                                  id="footer-text"
                                  value={editingAgreementContent.footer_text}
                                  onChange={(e) =>
                                    setEditingAgreementContent({
                                      ...editingAgreementContent,
                                      footer_text: e.target.value,
                                    })
                                  }
                                  disabled={!isEditingAgreement}
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading agreement content...</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="confirmation" className="space-y-4">
                        {confirmationContent && editingConfirmationContent ? (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Confirmation Page Content</h3>
                              <div className="flex gap-2">
                                {isEditingConfirmation ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={handleCancelConfirmationEdit}
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveConfirmationContent} size="sm">
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => window.open(`/confirmation`, "_blank")}
                                      size="sm"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Preview
                                    </Button>
                                    <Button
                                      onClick={() => setIsEditingConfirmation(true)}
                                      size="sm"
                                    >
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Edit Content
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="confirmation-page-title">Page Title</Label>
                                  <Input
                                    id="confirmation-page-title"
                                    value={editingConfirmationContent.page_title}
                                    onChange={(e) =>
                                      setEditingConfirmationContent({
                                        ...editingConfirmationContent,
                                        page_title: e.target.value,
                                      })
                                    }
                                    disabled={!isEditingConfirmation}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="confirmation-success-title">Success Title</Label>
                                  <Input
                                    id="confirmation-success-title"
                                    value={editingConfirmationContent.success_title}
                                    onChange={(e) =>
                                      setEditingConfirmationContent({
                                        ...editingConfirmationContent,
                                        success_title: e.target.value,
                                      })
                                    }
                                    disabled={!isEditingConfirmation}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="confirmation-success-subtitle">Success Subtitle</Label>
                                <Textarea
                                  id="confirmation-success-subtitle"
                                  value={editingConfirmationContent.success_subtitle}
                                  onChange={(e) =>
                                    setEditingConfirmationContent({
                                      ...editingConfirmationContent,
                                      success_subtitle: e.target.value,
                                    })
                                  }
                                  disabled={!isEditingConfirmation}
                                  rows={2}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="details-section-title">Details Section Title</Label>
                                  <Input
                                    id="details-section-title"
                                    value={editingConfirmationContent.details_section_title}
                                    onChange={(e) =>
                                      setEditingConfirmationContent({
                                        ...editingConfirmationContent,
                                        details_section_title: e.target.value,
                                      })
                                    }
                                    disabled={!isEditingConfirmation}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="next-steps-title">Next Steps Title</Label>
                                  <Input
                                    id="next-steps-title"
                                    value={editingConfirmationContent.next_steps_title}
                                    onChange={(e) =>
                                      setEditingConfirmationContent({
                                        ...editingConfirmationContent,
                                        next_steps_title: e.target.value,
                                      })
                                    }
                                    disabled={!isEditingConfirmation}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-base font-semibold mb-3 block">Next Steps</Label>
                                <div className="space-y-4">
                                  {editingConfirmationContent.next_steps.map((step, index) => (
                                    <Card key={index} className="p-4">
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <Label>Step Title</Label>
                                          <Input
                                            value={step.title}
                                            onChange={(e) => {
                                              const newSteps = [...editingConfirmationContent.next_steps];
                                              newSteps[index] = { ...newSteps[index], title: e.target.value };
                                              setEditingConfirmationContent({
                                                ...editingConfirmationContent,
                                                next_steps: newSteps,
                                              });
                                            }}
                                            disabled={!isEditingConfirmation}
                                          />
                                        </div>
                                        <div>
                                          <Label>Timeline</Label>
                                          <Input
                                            value={step.timeline}
                                            onChange={(e) => {
                                              const newSteps = [...editingConfirmationContent.next_steps];
                                              newSteps[index] = { ...newSteps[index], timeline: e.target.value };
                                              setEditingConfirmationContent({
                                                ...editingConfirmationContent,
                                                next_steps: newSteps,
                                              });
                                            }}
                                            disabled={!isEditingConfirmation}
                                          />
                                        </div>
                                        <div>
                                          <Label>Description</Label>
                                          <Textarea
                                            value={step.description}
                                            onChange={(e) => {
                                              const newSteps = [...editingConfirmationContent.next_steps];
                                              newSteps[index] = { ...newSteps[index], description: e.target.value };
                                              setEditingConfirmationContent({
                                                ...editingConfirmationContent,
                                                next_steps: newSteps,
                                              });
                                            }}
                                            disabled={!isEditingConfirmation}
                                            rows={2}
                                          />
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-base font-semibold">Contact Section</Label>
                                <div className="grid grid-cols-3 gap-4 mt-2">
                                  <div>
                                    <Label htmlFor="contact-section-title">Title</Label>
                                    <Input
                                      id="contact-section-title"
                                      value={editingConfirmationContent.contact_section.title}
                                      onChange={(e) =>
                                        setEditingConfirmationContent({
                                          ...editingConfirmationContent,
                                          contact_section: {
                                            ...editingConfirmationContent.contact_section,
                                            title: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingConfirmation}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="contact-section-email">Email</Label>
                                    <Input
                                      id="contact-section-email"
                                      value={editingConfirmationContent.contact_section.email}
                                      onChange={(e) =>
                                        setEditingConfirmationContent({
                                          ...editingConfirmationContent,
                                          contact_section: {
                                            ...editingConfirmationContent.contact_section,
                                            email: e.target.value,
                                          },
                                        })
                                      }
                                      disabled={!isEditingConfirmation}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="download-button-text">Download Button Text</Label>
                                    <Input
                                      id="download-button-text"
                                      value={editingConfirmationContent.download_button_text}
                                      onChange={(e) =>
                                        setEditingConfirmationContent({
                                          ...editingConfirmationContent,
                                          download_button_text: e.target.value,
                                        })
                                      }
                                      disabled={!isEditingConfirmation}
                                    />
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <Label htmlFor="contact-section-description">Description</Label>
                                  <Textarea
                                    id="contact-section-description"
                                    value={editingConfirmationContent.contact_section.description}
                                    onChange={(e) =>
                                      setEditingConfirmationContent({
                                        ...editingConfirmationContent,
                                        contact_section: {
                                          ...editingConfirmationContent.contact_section,
                                          description: e.target.value,
                                        },
                                      })
                                    }
                                    disabled={!isEditingConfirmation}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading confirmation content...</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {!isEditingContent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Content Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-6 rounded-lg space-y-4">
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-foreground mb-2">
                            {content.activation.title}
                          </h1>
                          <p className="text-muted-foreground">
                            {content.activation.subtitle}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {content.activation.benefits
                            .slice(0, 2)
                            .map((benefit, index) => (
                              <div
                                key={index}
                                className="bg-background p-3 rounded"
                              >
                                <h4 className="font-semibold text-sm">
                                  {benefit.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {benefit.description}
                                </p>
                              </div>
                            ))}
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                          Preview shows subset of content. Use Preview button to
                          see full activation page.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
