'use client';

import React from 'react';
import { OwnerSidebar } from '@/components/common/OwnerSidebar';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <OwnerSidebar />
      <div className="flex-1 bg-[#F5F7F5] overflow-y-auto">{children}</div>
    </div>
  );
}
