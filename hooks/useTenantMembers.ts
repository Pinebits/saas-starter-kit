import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';

export type TenantMemberWithUser = {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

type TenantMemberOptions = {
  slug: string;
  isAdmin?: boolean;
};

export const useTenantMembers = (options: TenantMemberOptions | string) => {
  // Handle both new options object and legacy string parameter
  const slug = typeof options === 'string' ? options : options.slug;
  const isAdmin = typeof options === 'string' ? false : (options.isAdmin || false);
  
  const { data: session } = useSession();
  const isMasterAdmin = session?.user?.isMasterAdmin === true;

  // For master admins using admin mode, use admin endpoint
  const endpoint = isAdmin && isMasterAdmin 
    ? `/api/admin/tenants/${slug}/members` 
    : `/api/tenants/${slug}/members`;

  const { data, error, mutate } = useSWR(
    slug ? endpoint : null,
    fetcher
  );

  return {
    members: (data?.data || []) as TenantMemberWithUser[],
    isLoading: !error && !data,
    isError: error,
    mutateTenantMembers: mutate
  };
};

export default useTenantMembers;