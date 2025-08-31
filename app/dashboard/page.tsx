import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  serverClientService,
  serverContentService,
} from "@/lib/supabase-server";
import { ClientList } from "./components/ClientList";
import ContentEditor from "./components/ContentEditor";
import { RevenueTracker } from "./components/RevenueTracker";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function DashboardData() {
  const [clients, content] = await Promise.all([
    serverClientService.getAll(),
    serverContentService.getCurrent(),
  ]);

  return (
    <Tabs defaultValue="clients" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
      </TabsList>
      <TabsContent value="clients">
        <ClientList clients={clients} journeyProgressMap={new Map()} />
      </TabsContent>
      <TabsContent value="revenue">
        <RevenueTracker clients={clients} />
      </TabsContent>
      <TabsContent value="content">
        <ContentEditor initialContent={content} />
      </TabsContent>
    </Tabs>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <DashboardData />
        </Suspense>
      </div>
    </div>
  );
}