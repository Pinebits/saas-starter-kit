import React from 'react';
import AppShell from '../shared/shell/AppShell';
import { SWRConfig } from 'swr';
import fetcher from '@/lib/fetcher';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        fetcher: fetcher,
      }}
    >
      <AppShell>{children}</AppShell>
    </SWRConfig>
  );
}
