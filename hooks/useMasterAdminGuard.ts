import { Role } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function useMasterAdminGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const isMasterAdmin = session?.user?.isMasterAdmin === true;
  const isAuthenticated = !!session;

  useEffect(() => {
    // Only redirect after the session is loaded and if the user is not a master admin
    if (!isLoading && isAuthenticated && !isMasterAdmin) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, isMasterAdmin, router]);

  return {
    isLoading,
    isMasterAdmin,
    isAuthenticated,
  };
}