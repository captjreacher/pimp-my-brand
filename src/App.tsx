import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createOptimizedQueryClient } from "./lib/cache/query-cache";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { LoadingSkeleton } from "./components/ui/loading-skeleton";
import { preloadCriticalResources } from "./lib/performance/preloader";
import { initializePerformanceObserver } from "./lib/performance/bundle-analyzer";
import { useWebVitals } from "./hooks/use-performance";
// Admin context and route guards
import { AdminProvider } from "./contexts/AdminContext";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Gallery = lazy(() => import("./pages/Gallery"));
const TemplatePreview = lazy(() => import("./pages/TemplatePreview"));
const SharedContent = lazy(() => import("./pages/SharedContent").then(module => ({ default: module.SharedContent })));
const CreateBrand = lazy(() => import("./pages/CreateBrand"));
const BrandView = lazy(() => import("./pages/BrandView"));
const BrandEditor = lazy(() => import("./pages/BrandEditor"));
const CVView = lazy(() => import("./pages/CVView"));
const GenerateCV = lazy(() => import("./pages/GenerateCV"));
const Uploads = lazy(() => import("./pages/Uploads"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Shop = lazy(() => import("./pages/Shop"));
const VoiceSynthesisDemo = lazy(() => import("./pages/VoiceSynthesisDemo"));

// Unified Admin Components
const UnifiedAdminRouter = lazy(() => import("./components/admin/UnifiedAdminRouter").then(module => ({ default: module.UnifiedAdminRouter })));

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
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coming-home" element={<Navigate to="/" replace />} />
            <Route path="/coming-home/" element={<Navigate to="/" replace />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/player-profile" element={<PlayerProfile />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/template/:format" element={<TemplatePreview />} />
            <Route path="/share/:token" element={<SharedContent />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/create" element={<CreateBrand />} />
            <Route path="/brand/:id" element={<BrandView />} />
            <Route path="/brand/:id/edit" element={<BrandEditor />} />
            <Route path="/brand/:id/generate-cv" element={<GenerateCV />} />
            <Route path="/cv/:id" element={<CVView />} />
            <Route path="/uploads" element={<Uploads />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/voice-demo" element={<VoiceSynthesisDemo />} />
            
            {/* Unified Admin Routes */}
            <Route path="/admin/*" element={<UnifiedAdminRouter />} />
            

            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
