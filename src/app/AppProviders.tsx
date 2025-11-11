import { ComponentType, PropsWithChildren, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminProvider } from "@/contexts/AdminContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { createOptimizedQueryClient } from "@/lib/cache/query-cache";

type ReactQueryDevtoolsType = ComponentType<{
  initialIsOpen?: boolean;
  buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}>;

const ReactQueryDevtoolsLoader = () => {
  const [DevtoolsComponent, setDevtoolsComponent] = useState<ReactQueryDevtoolsType | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;
    const moduleName = "@tanstack/react-query-devtools";

    import(/* @vite-ignore */ moduleName)
      .then((module: { ReactQueryDevtools?: ReactQueryDevtoolsType }) => {
        if (!cancelled && module.ReactQueryDevtools) {
          setDevtoolsComponent(() => module.ReactQueryDevtools);
        }
      })
      .catch(() => {
        console.warn("React Query Devtools failed to load. Ensure @tanstack/react-query-devtools is installed for local debugging.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!DevtoolsComponent) {
    return null;
  }

  return <DevtoolsComponent initialIsOpen={false} buttonPosition="bottom-right" />;
};

export const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  const [queryClient] = useState(createOptimizedQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminProvider>
          {children}
          <Toaster />
          <Sonner />
        </AdminProvider>
      </TooltipProvider>
      <ReactQueryDevtoolsLoader />
    </QueryClientProvider>
  );
};
