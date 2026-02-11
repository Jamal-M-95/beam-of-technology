'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/toaster';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Navbar is fixed */}
      <main className="pt-24">{children}</main>
      <footer className="py-8 border-t border-white/5 bg-black/40 text-center">
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Beam Of Technology. All systems operational.</p>
      </footer>
      <Toaster />
    </div>
  );
}
