import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, User, IdCard, ShoppingBag, Image } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-bold mb-2">
              Welcome back, {session?.user?.user_metadata?.full_name || "there"}!
            </h2>
            <p className="text-muted-foreground">
              Choose an action to get started with your brand generation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              icon={<Plus className="w-6 h-6" />}
              title="Create New Brand"
              description="Start from scratch with AI-powered generation"
              onClick={() => navigate("/create")}
              primary
            />

            <DashboardCard
              icon={<Image className="w-6 h-6" />}
              title="Gallery"
              description="Browse public brands"
              onClick={() => navigate("/gallery")}
            />

            <DashboardCard
              icon={<IdCard className="w-6 h-6" />}
              title="Player Profile"
              description="Dial in your on-stage introductions and accolades"
              onClick={() => navigate("/player-profile")}
            />

            <DashboardCard
              icon={<ShoppingBag className="w-6 h-6" />}
              title="Shop"
              description="Outfit templates with uniforms and premium looks"
              onClick={() => navigate("/shop")}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}

const DashboardCard = ({
  icon,
  title,
  description,
  onClick,
  primary,
}: DashboardCardProps) => (
  <button
    onClick={onClick}
    className={`gradient-card border rounded-2xl p-6 text-left hover:shadow-soft transition-all ${
      primary
        ? "border-primary/50 shadow-glow"
        : "border-border"
    }`}
  >
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
        primary ? "bg-primary/20 text-primary" : "bg-surface text-secondary"
      }`}
    >
      {icon}
    </div>
    <h3 className="font-heading text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </button>
);

export default Dashboard;
