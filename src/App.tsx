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
import { AdminProvider } from "./contexts/AdminContext";
import { AdminRouteGuard } from "./components/admin/AdminRouteGuard";

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
const ContentModerationPage = lazy(() => import("./pages/admin/ContentModerationPage").then(module => ({ default: module.ContentModerationPage })));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const SystemConfigPage = lazy(() => import("./pages/admin/SystemConfigPage").then(module => ({ default: module.SystemConfigPage })));
const SecurityPage = lazy(() => import("./pages/admin/SecurityPage"));
const CommunicationPage = lazy(() => import("./pages/admin/CommunicationPage"));
const AIContentManagementPage = lazy(() => import("./pages/admin/AIContentManagementPage").then(module => ({ default: module.AIContentManagementPage })));
const SimpleSubscriptionPage = lazy(() => import("./pages/admin/SimpleSubscriptionPage"));
const SimpleAnalyticsPage = lazy(() => import("./pages/admin/SimpleAnalyticsPage"));
const SimpleUserManagementPage = lazy(() => import("./pages/admin/SimpleUserManagementPage"));
const SimpleModerationPage = lazy(() => import("./pages/admin/SimpleModerationPage"));
const SimpleConfigPage = lazy(() => import("./pages/admin/SimpleConfigPage"));
const SimpleSecurityPage = lazy(() => import("./pages/admin/SimpleSecurityPage"));
const SimpleCommunicationPage = lazy(() => import("./pages/admin/SimpleCommunicationPage"));
const SimpleAIContentPage = lazy(() => import("./pages/admin/SimpleAIContentPage"));

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
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <Routes>
                {/* Main admin dashboard - no auth required */}
                <Route path="/" element={<SimpleAdminDashboard />} />
                
                {/* Individual admin pages - simplified routing */}
                <Route path="/users" element={<SimpleUserManagementPage />} />
                <Route path="/subscriptions" element={<SimpleSubscriptionPage />} />
                <Route path="/moderation" element={<SimpleModerationPage />} />
                <Route path="/analytics" element={<SimpleAnalyticsPage />} />
                <Route path="/config" element={<SimpleConfigPage />} />
                <Route path="/security" element={<SimpleSecurityPage />} />
                <Route path="/communication" element={<SimpleCommunicationPage />} />
                <Route path="/ai-content" element={<SimpleAIContentPage />} />
              </Routes>
            } />
            
            {/* Complex Admin Routes with Auth (DISABLED - using Simple routes only) */}
            <Route path="/admin-complex-disabled/*" element={
              <AdminProvider>
                <Routes>
                  <Route path="/" element={
                    <AdminRouteGuard requiredPermissions={['view_analytics']}>
                      <AdminDashboardPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/users" element={
                    <AdminRouteGuard requiredPermissions={['manage_users']}>
                      <UserManagementPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/subscriptions" element={
                    <AdminRouteGuard requiredPermissions={['manage_billing']}>
                      <SubscriptionManagementPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/moderation" element={
                    <AdminRouteGuard requiredPermissions={['moderate_content']}>
                      <ContentModerationPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/analytics" element={
                    <AdminRouteGuard requiredPermissions={['view_analytics']}>
                      <AnalyticsPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/config" element={
                    <AdminRouteGuard requiredPermissions={['manage_system']}>
                      <SystemConfigPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/security" element={
                    <AdminRouteGuard requiredPermissions={['manage_system']}>
                      <SecurityPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/communication" element={
                    <AdminRouteGuard requiredPermissions={['manage_users']}>
                      <CommunicationPage />
                    </AdminRouteGuard>
                  } />
                  <Route path="/ai-content" element={
                    <AdminRouteGuard requiredPermissions={['moderate_content', 'view_analytics']}>
                      <AIContentManagementPage />
                    </AdminRouteGuard>
                  } />
                </Routes>
              </AdminProvider>
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
