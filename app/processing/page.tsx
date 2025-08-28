"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProcessingPage() {
  const router = useRouter();

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      router.push("/confirmation");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-16">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Genius%20Logo%20-%20Light%202-gC6g2vyhQtht3shTSIzEBgta6vmSoU.png"
              alt="Genius Logo"
              className="w-10 h-10"
            />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Finalizing Your Activation
          </h1>
          <p className="text-xl text-gray-600 mb-16 leading-relaxed">
            Please wait a moment while we secure your priority window and
            prepare your confirmation.
          </p>

          <div className="mb-12">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-8 shadow-inner overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full shadow-sm transition-all duration-1000 ease-out"
                style={{
                  width: "75%",
                  animation: "pulse 2s ease-in-out infinite alternate",
                }}
              ></div>
            </div>

            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                <div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-orange-300 rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "3s",
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-800 font-bold text-xl">
              Syncing details with our recruiting team...
            </p>
            <p className="text-gray-600 text-lg">
              This usually takes just a few seconds.
            </p>
            <div className="flex items-center justify-center space-x-2 mt-6">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
