import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const routerBasename =
  import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event",
      targetId: string,
      config?: Record<string, unknown>,
    ) => void;
  }
}

const GA_MEASUREMENT_ID = "G-HYQ5QKWRP7";

const Ga4PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!window.gtag) return;
    const page_path = `${location.pathname}${location.search}${location.hash}`;
    window.gtag("config", GA_MEASUREMENT_ID, { page_path });
  }, [location.pathname, location.search, location.hash]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBasename}>
        <Ga4PageTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
