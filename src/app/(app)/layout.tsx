import type { ReactNode } from 'react';
import '../globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'Arqon ERP',
  description: 'Arquitectura de tus operaciones',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
