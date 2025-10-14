import * as React from "react";
import { cn } from "@/lib/utils";
import { SkipNav } from "./skip-nav";

export interface ResponsiveLayoutProps {
  /** Main content */
  children: React.ReactNode;
  /** Header content */
  header?: React.ReactNode;
  /** Sidebar content */
  sidebar?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Whether sidebar is collapsible on mobile */
  collapsibleSidebar?: boolean;
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const ResponsiveLayout = React.forwardRef<HTMLDivElement, ResponsiveLayoutProps>(
  ({ 
    children,
    header,
    sidebar,
    footer,
    collapsibleSidebar = true,
    maxWidth = 'full',
    padding = 'md',
    className,
    ...props 
  }, ref) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full'
    };

    const paddingClasses = {
      none: '',
      sm: 'p-2 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    };

    return (
      <div 
        ref={ref}
        className={cn("min-h-screen flex flex-col", className)}
        {...props}
      >
        {/* Skip navigation */}
        <SkipNav targetId="main-content">
          Skip to main content
        </SkipNav>

        {/* Header */}
        {header && (
          <header 
            className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
            role="banner"
          >
            <div className={cn("mx-auto", maxWidthClasses[maxWidth], paddingClasses[padding])}>
              {header}
            </div>
          </header>
        )}

        {/* Main layout */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          {sidebar && (
            <>
              {/* Mobile sidebar overlay */}
              {collapsibleSidebar && sidebarOpen && (
                <div 
                  className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
              )}
              
              {/* Sidebar content */}
              <aside 
                className={cn(
                  "bg-muted/30 border-r",
                  // Mobile styles
                  collapsibleSidebar && [
                    "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:relative lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                  ],
                  // Desktop styles
                  !collapsibleSidebar && "w-64 flex-shrink-0"
                )}
                role="complementary"
                aria-label="Sidebar navigation"
              >
                <div className={cn("h-full overflow-y-auto", paddingClasses[padding])}>
                  {sidebar}
                </div>
              </aside>
            </>
          )}

          {/* Main content area */}
          <main 
            id="main-content"
            className={cn(
              "flex-1 overflow-x-hidden",
              maxWidthClasses[maxWidth] !== 'max-w-full' && "mx-auto w-full",
              maxWidthClasses[maxWidth],
              paddingClasses[padding]
            )}
            role="main"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>

        {/* Footer */}
        {footer && (
          <footer 
            className="border-t bg-muted/30"
            role="contentinfo"
          >
            <div className={cn("mx-auto", maxWidthClasses[maxWidth], paddingClasses[padding])}>
              {footer}
            </div>
          </footer>
        )}

        {/* Mobile sidebar toggle button */}
        {sidebar && collapsibleSidebar && (
          <button
            type="button"
            className={cn(
              "fixed bottom-4 left-4 z-50 lg:hidden",
              "bg-primary text-primary-foreground",
              "rounded-full p-3 shadow-lg",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        )}
      </div>
    );
  }
);

ResponsiveLayout.displayName = "ResponsiveLayout";

export { ResponsiveLayout };