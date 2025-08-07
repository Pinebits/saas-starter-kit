import fetcher from '@/lib/fetcher';
import type { Permission } from '@/lib/permissions';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { ApiResponse } from 'types';
import { useSession } from 'next-auth/react';

const usePermissions = () => {
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const { data: session } = useSession();
  const isMasterAdmin = session?.user?.isMasterAdmin === true;

  const { slug } = router.query as { slug: string };

  useEffect(() => {
    if (slug) {
      setTenantSlug(slug);
    }
  }, [router.query, slug]);

  // If user is a master admin, permissions are handled differently (in useCanAccess)
  const { data, error, isLoading } = useSWR<ApiResponse<Permission[]>>(
    tenantSlug && !isMasterAdmin ? `/api/tenants/${tenantSlug}/permissions` : null,
    fetcher
  );

  return {
    isLoading,
    isError: error,
    permissions: data?.data,
  };
};

export default usePermissions;