import React from 'react';
import { AdminAccessHelper } from '@/components/admin/AdminAccessHelper';

export default function AdminAccess() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <AdminAccessHelper />
      </div>
    </div>
  );
}