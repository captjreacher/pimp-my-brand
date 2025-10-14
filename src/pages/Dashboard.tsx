import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User, Plus } from "lucide-react";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { UserOnboarding } from "@/components/dashboard/UserOnboarding";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const navigate = useNavigate();

  const { stats } = useDashboardData(session?.user?.id);
  const hasContent = (stats?.totalBrands || 0) + (stats?.totalCVs || 0) + (stats?.totalUploads || 0) > 0;

  useEffect(() => {
    // Check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">Brand Generator</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/create")}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Message */}
          <div className="mb-6">
            <h2 className="font-heading text-3xl font-bold mb-2">
              Welcome back, {session?.user?.user_metadata?.full_name || "there"}!
            </h2>
            <p className="text-muted-foreground">
              Manage your brand materials and create new content.
            </p>
          </div>

          {/* Onboarding for new users */}
          {session?.user?.id && showOnboarding && (
            <UserOnboarding
              userId={session.user.id}
              hasContent={hasContent}
              onDismiss={() => setShowOnboarding(false)}
            />
          )}

          {/* Dashboard Tabs */}
          {session?.user?.id && (
            <DashboardTabs userId={session.user.id} />
          )}
        </div>
      </main>
    </div>
  );
};



export default Dashboard;
