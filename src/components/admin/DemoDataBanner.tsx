import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DemoDataBannerProps {
  onFixDatabase?: () => void;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({ onFixDatabase }) => {
  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-600" />
          <span className="text-amber-800">
            <strong>Demo Mode:</strong> Showing sample data due to database access restrictions. 
            Real user data is not accessible with current permissions.
          </span>
        </div>
        {onFixDatabase && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onFixDatabase}
            className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Fix Database Access
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};