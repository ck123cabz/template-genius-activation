import { notFound } from "next/navigation";
import { getClientJourneyByToken } from "@/app/actions/journey-actions";

interface ClientJourneyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ gToken: string }>;
}

export default async function ClientJourneyLayout({
  children,
  params
}: ClientJourneyLayoutProps) {
  const { gToken } = await params;
  
  // Verify G-token format and client exists
  if (!gToken || !gToken.match(/^G\d{4}$/)) {
    notFound();
  }

  const result = await getClientJourneyByToken(gToken);
  
  if (!result.success || !result.client) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Client Journey Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {result.client.contact}
          </h1>
          <p className="text-gray-600 mt-2">
            {result.client.company} - Your Personalized Journey
          </p>
        </div>
        
        {children}
      </div>
    </div>
  );
}