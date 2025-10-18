import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User, Plus, Shield } from "lucide-react";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import type { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();

  const { stats } = useDashboardData(session?.user?.id);

  useEffect(() => {
    checkAuthAndOnboarding();

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

  const checkAuthAndOnboarding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setSession(session);

      // Get user profile to check admin status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      // Profile loaded successfully
      
      setUserProfile(profile);

      // Check if user has completed onboarding by checking if they have any content
      const [brandsResult, cvsResult, uploadsResult] = await Promise.all([
        supabase.from('brands').select('id').eq('user_id', session.user.id).limit(1),
        supabase.from('cvs').select('id').eq('user_id', session.user.id).limit(1),
        supabase.from('uploads').select('id').eq('user_id', session.user.id).limit(1),
      ]);

      const hasAnyContent = 
        (brandsResult.data?.length || 0) > 0 ||
        (cvsResult.data?.length || 0) > 0 ||
        (uploadsResult.data?.length || 0) > 0;

      // If user is completely new (no content), redirect to onboarding
      if (!hasAnyContent) {
        navigate('/onboarding');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking auth and onboarding:', error);
      navigate("/auth");
    }
  };

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
              
              {/* Admin button - only show for admin users */}
              {userProfile && (userProfile.app_role === 'admin' || userProfile.app_role === 'super_admin' || userProfile.app_role === 'moderator') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/simple-admin")}
                  className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              )}
              
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
