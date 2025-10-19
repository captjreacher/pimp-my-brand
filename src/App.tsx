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
// Admin context and route guards (available for future use)
// import { AdminProvider } from "./contexts/AdminContext";
// import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
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
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const Shop = lazy(() => import("./pages/Shop"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const AdminDebug = lazy(() => import("./pages/AdminDebug"));
const SimpleAdmin = lazy(() => import("./pages/SimpleAdmin"));
const WorkingAdmin = lazy(() => import("./pages/WorkingAdmin"));
const VoiceSynthesisDemo = lazy(() => import("./pages/VoiceSynthesisDemo"));

// Admin pages
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const SimpleAdminDashboard = lazy(() => import("./pages/admin/SimpleAdminDashboard"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage").then(module => ({ default: module.UserManagementPage })));
const SubscriptionManagementPage = lazy(() => import("./pages/admin/SubscriptionManagementPage").then(module => ({ default: module.SubscriptionManagementPage })));
const TestSubscriptionPage = lazy(() => import("./pages/admin/TestSubscriptionPage").then(module => ({ default: module.TestSubscriptionPage })));
const SuperSimpleTest = lazy(() => import("./pages/admin/SuperSimpleTest").then(module => ({ default: module.SuperSimpleTest })));
const ContentModerationPage = lazy(() => import("./pages/admin/ContentModerationPage").then(module => ({ default: module.ContentModerationPage })));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SystemConfigPage = lazy(() => import("./pages/admin/SystemConfigPage").then(module => ({ default: module.SystemConfigPage })));
const SecurityPage = lazy(() => import("./pages/admin/SecurityPage"));
const CommunicationPage = lazy(() => import("./pages/admin/CommunicationPage"));
const AIContentManagementPage = lazy(() => import("./pages/admin/AIContentManagementPage").then(module => ({ default: module.AIContentManagementPage })));
const SimpleAnalyticsPage = lazy(() => import("./pages/admin/SimpleAnalyticsPage"));
const DebugUserManagement = lazy(() => import("./pages/admin/DebugUserManagement"));
const UltraSimpleTest = lazy(() => import("./pages/admin/UltraSimpleTest"));
const SimpleWorkingUserManagement = lazy(() => import("./pages/admin/SimpleWorkingUserManagement"));
const SimpleWorkingSubscriptions = lazy(() => import("./pages/admin/SimpleWorkingSubscriptions"));
const DirectTestLinks = lazy(() => import("./pages/admin/DirectTestLinks"));
const SimpleModerationPage = lazy(() => import("./pages/admin/SimpleModerationPage"));
const SimpleConfigPage = lazy(() => import("./pages/admin/SimpleConfigPage"));
const SimpleSecurityPage = lazy(() => import("./pages/admin/SimpleSecurityPage"));
const SimpleCommunicationPage = lazy(() => import("./pages/admin/SimpleCommunicationPage"));
const SimpleAIContentPage = lazy(() => import("./pages/admin/SimpleAIContentPage"));
const SimpleSubscriptionPlansPage = lazy(() => import("./pages/admin/SimpleSubscriptionPlansPage").then(module => ({ default: module.SimpleSubscriptionPlansPage })));
const TestPlansAccess = lazy(() => import("./pages/admin/TestPlansAccess").then(module => ({ default: module.TestPlansAccess })));
const WorkingUserManagementPage = lazy(() => import("./pages/admin/WorkingUserManagementPage").then(module => ({ default: module.WorkingUserManagementPage })));
const FullUserManagementPage = lazy(() => import("./pages/admin/FullUserManagementPage"));
const FullAnalyticsPage = lazy(() => import("./pages/admin/FullAnalyticsPage"));

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
            <Route path="/admin-access" element={<AdminAccess />} />
            <Route path="/admin-debug" element={<AdminDebug />} />
            <Route path="/simple-admin" element={<SimpleAdmin />} />
            <Route path="/working-admin" element={<WorkingAdmin />} />
            <Route path="/voice-demo" element={<VoiceSynthesisDemo />} />
            
            {/* Simple Admin Dashboard (no auth required for testing) */}
            <Route path="/admin-simple" element={<SimpleAdminDashboard />} />
            
            {/* Admin Routes with Complex UI but Bypassed Auth */}
            <Route path="/admin/*" element={
              <Routes>
                {/* Complex admin pages without auth guards (temporarily) */}
                <Route path="/" element={<SimpleAdminDashboard />} />
                <Route path="/users" element={<FullUserManagementPage />} />
                <Route path="/subscriptions" element={<SimpleSubscriptionPlansPage />} />
                <Route path="/subscription-management" element={<SubscriptionManagementPage />} />
                <Route path="/moderation" element={<ContentModerationPage />} />
                <Route path="/analytics" element={<FullAnalyticsPage />} />
                <Route path="/config" element={<SystemConfigPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/communication" element={<CommunicationPage />} />
                <Route path="/ai-content" element={<AIContentManagementPage />} />
                
                {/* Simple fallback versions */}
                <Route path="/simple-dashboard" element={<SimpleAdminDashboard />} />
                <Route path="/simple-users" element={<SimpleWorkingUserManagement />} />
                <Route path="/simple-moderation" element={<SimpleModerationPage />} />
                <Route path="/simple-analytics" element={<SimpleAnalyticsPage />} />
                <Route path="/simple-config" element={<SimpleConfigPage />} />
                <Route path="/simple-security" element={<SimpleSecurityPage />} />
                <Route path="/simple-communication" element={<SimpleCommunicationPage />} />
                <Route path="/simple-ai-content" element={<SimpleAIContentPage />} />
                
                {/* Debug and Test Routes */}
                <Route path="/debug-users" element={<DebugUserManagement />} />
                <Route path="/ultra-test" element={<UltraSimpleTest />} />
                <Route path="/test-links" element={<DirectTestLinks />} />
                <Route path="/test-plans-access" element={<TestPlansAccess />} />
              </Routes>
            } />
            
            {/* Legacy Test Routes */}
            <Route path="/admin-legacy/*" element={
              <Routes>
                <Route path="/test-subscriptions" element={<TestSubscriptionPage />} />
                <Route path="/super-simple-test" element={<SuperSimpleTest />} />
              </Routes>
            } />
            
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
