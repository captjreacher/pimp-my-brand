import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionService } from "@/lib/subscription-service";

type SubscriptionTier = "free" | "pro" | "premium";

interface SubscriptionContextType {
  tier: SubscriptionTier;
  loading: boolean;
  trialActive: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);
  const [trialActive, setTrialActive] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTier("free");
        setLoading(false);
        return;
      }

      const subscription = await SubscriptionService.getUserSubscription(user.id);
      
      if (subscription) {
        setTier(subscription.plan as SubscriptionTier);
        setTrialActive(false); // We'll implement trials later if needed
        setSubscriptionEnd(subscription.current_period_end);
      } else {
        // Create default subscription if none exists
        await SubscriptionService.createDefaultSubscription(user.id);
        setTier("free");
        setTrialActive(false);
        setSubscriptionEnd(null);
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
      // Don't show error toast, just set to free tier
      setTier("free");
      setTrialActive(false);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();

    // Check subscription on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        checkSubscription();
      } else if (event === "SIGNED_OUT") {
        setTier("free");
        setTrialActive(false);
        setSubscriptionEnd(null);
      }
    });

    // Refresh every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{ tier, loading, trialActive, subscriptionEnd, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
