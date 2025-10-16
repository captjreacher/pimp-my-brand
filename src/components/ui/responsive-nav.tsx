import * as React from "react";
import { cn } from "@/lib/utils";
import { AccessibleButton } from "./accessible-button";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { Menu, X } from "lucide-react";
import { useScreenReader } from "@/hooks/use-accessibility";

export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
  disabled?: boolean;
  badge?: string | number;
}

export interface ResponsiveNavProps {
  /** Navigation items */
  items: NavItem[];
  /** Logo or brand element */
  logo?: React.ReactNode;
  /** Additional actions (e.g., user menu) */
  actions?: React.ReactNode;
  /** Whether navigation is sticky */
  sticky?: boolean;
  /** Custom mobile breakpoint */
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
  /** Show mobile menu button */
  showMobileMenu?: boolean;
  className?: string;
}

const ResponsiveNav = React.forwardRef<HTMLElement, ResponsiveNavProps>(
  ({ 
    items,
    logo,
    actions,
    sticky = true,
    mobileBreakpoint = 'md',
    showMobileMenu = true,
    className,
    ...props 
  }, ref) => {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const { announce } = useScreenReader();

    const breakpointClasses = {
      sm: 'sm:hidden',
      md: 'md:hidden',
      lg: 'lg:hidden'
    };

    const desktopBreakpointClasses = {
      sm: 'hidden sm:flex',
      md: 'hidden md:flex',
      lg: 'hidden lg:flex'
    };

    const handleItemClick = (item: NavItem) => {
      if (item.disabled) return;
      
      if (item.onClick) {
        item.onClick();
      }
      
      setMobileMenuOpen(false);
      announce(`Navigated to ${item.label}`, 'polite');
    };

    const renderNavItem = (item: NavItem, mobile: boolean = false) => {
      const Icon = item.icon;
      
      const content = (
        <>
          {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {item.badge}
            </span>
          )}
        </>
      );

      const baseClasses = cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        mobile && "w-full justify-start touch-manipulation min-h-[44px]",
        !mobile && "whitespace-nowrap",
        item.active && "bg-primary text-primary-foreground",
        !item.active && "text-muted-foreground hover:text-foreground hover:bg-muted",
        item.disabled && "opacity-50 cursor-not-allowed"
      );

      if (item.href) {
        return (
          <a
            key={item.label}
            href={item.href}
            className={baseClasses}
            aria-current={item.active ? "page" : undefined}
            aria-disabled={item.disabled}
            onClick={(e) => {
              if (item.disabled) {
                e.preventDefault();
                return;
              }
              handleItemClick(item);
            }}
          >
            {content}
          </a>
        );
      }

      return (
        <AccessibleButton
          key={item.label}
          variant="ghost"
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(baseClasses, "h-auto p-0")}
          aria-current={item.active ? "page" : undefined}
        >
          <div className="flex items-center gap-2 px-3 py-2 w-full">
            {content}
          </div>
        </AccessibleButton>
      );
    };

    return (
      <nav 
        ref={ref}
        className={cn(
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
          sticky && "sticky top-0 z-40",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
        {...props}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            {logo && (
              <div className="flex-shrink-0">
                {logo}
              </div>
            )}

            {/* Desktop Navigation */}
            <div className={cn("flex items-center space-x-1", desktopBreakpointClasses[mobileBreakpoint])}>
              {items.map(renderNavItem)}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {actions}
              
              {/* Mobile menu button */}
              {showMobileMenu && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <AccessibleButton
                      variant="ghost"
                      size="sm"
                      className={cn("touch-manipulation min-h-[44px] min-w-[44px]", breakpointClasses[mobileBreakpoint])}
                      aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                      expanded={mobileMenuOpen}
                    >
                      {mobileMenuOpen ? (
                        <X className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Menu className="h-5 w-5" aria-hidden="true" />
                      )}
                    </AccessibleButton>
                  </SheetTrigger>
                  
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col space-y-4 mt-6">
                      <h2 className="text-lg font-semibold">Navigation</h2>
                      <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
                        {items.map(item => renderNavItem(item, true))}
                      </nav>
                      
                      {/* Mobile actions */}
                      {actions && (
                        <div className="pt-4 border-t">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Actions</h3>
                          <div className="space-y-2">
                            {actions}
                          </div>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }
);

ResponsiveNav.displayName = "ResponsiveNav";

export { ResponsiveNav, type NavItem };