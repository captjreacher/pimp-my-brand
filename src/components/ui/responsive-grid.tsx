import * as React from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Grid columns configuration */
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  /** Gap between grid items */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Minimum item width (auto-fit grid) */
  minItemWidth?: string;
  /** Whether to use auto-fit or fixed columns */
  autoFit?: boolean;
  /** Aspect ratio for grid items */
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ 
    className,
    columns = { default: 1, sm: 2, md: 3, lg: 4 },
    gap = 'md',
    minItemWidth = '280px',
    autoFit = false,
    aspectRatio = 'auto',
    children,
    ...props 
  }, ref) => {
    const gapClasses = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    };

    const aspectRatioClasses = {
      square: '[&>*]:aspect-square',
      video: '[&>*]:aspect-video',
      portrait: '[&>*]:aspect-[3/4]',
      auto: ''
    };

    // Build responsive column classes
    const getColumnClasses = () => {
      const classes = [];
      
      if (columns.default) classes.push(`grid-cols-${columns.default}`);
      if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
      if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
      if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
      if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
      if (columns['2xl']) classes.push(`2xl:grid-cols-${columns['2xl']}`);
      
      return classes.join(' ');
    };

    if (autoFit) {
      return (
        <div 
          ref={ref}
          className={cn(
            "grid",
            gapClasses[gap],
            aspectRatioClasses[aspectRatio],
            className
          )}
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
          }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div 
        ref={ref}
        className={cn(
          "grid",
          getColumnClasses(),
          gapClasses[gap],
          aspectRatioClasses[aspectRatio],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = "ResponsiveGrid";

export { ResponsiveGrid };