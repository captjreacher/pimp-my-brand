import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createOptimizedQueryClient } from "./lib/cache/query-cache";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { LoadingSkeleton } from "./components/ui/loading-skeleton";
import { preloadCriticalResources } from "./lib/performance/preloader";
import { initializePerformanceObserver } from "./lib/performance/bundle-analyzer";
import { useWebVitals } from "./hooks/use-performance";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Gallery = lazy(() => import("./pages/Gallery"));
const TemplatePreview = lazy(() => import("./pages/TemplatePreview"));
const SharedContent = lazy(() => import("./pages/SharedContent").then(module => ({ default: module.SharedContent })));
const CreateBrand = lazy(() => import("./pages/CreateBrand"));
const BrandView = lazy(() => import("./pages/BrandView"));
const CVView = lazy(() => import("./pages/CVView"));
const Uploads = lazy(() => import("./pages/Uploads"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Shop = lazy(() => import("./pages/Shop"));

const queryClient = createOptimizedQueryClient();

const App = () => {
  // Initialize performance monitoring
  useWebVitals();
  
  useEffect(() => {
    // Preload critical resources
    preloadCriticalResources();
    
    // Initialize performance monitoring
    initializePerformanceObserver();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/player-profile" element={<PlayerProfile />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/template/:format" element={<TemplatePreview />} />
            <Route path="/share/:token" element={<SharedContent />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/create" element={<CreateBrand />} />
            <Route path="/brand/:id" element={<BrandView />} />
            <Route path="/cv/:id" element={<CVView />} />
            <Route path="/uploads" element={<Uploads />} />
            <Route path="/shop" element={<Shop />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
