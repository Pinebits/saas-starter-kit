import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';

type TenantOptions = {
  isAdmin?: boolean;
};

export const useTenants = (options: TenantOptions = {}) => {
  const { isAdmin = false } = options;
  const { data: session } = useSession();
  const isMasterAdmin = session?.user?.isMasterAdmin === true;

  // Use the admin endpoint if isAdmin is true and user is a master admin
  const endpoint = isAdmin && isMasterAdmin ? '/api/tenants' : '/api/teams';

  const { data, error, mutate } = useSWR(session ? endpoint : null, fetcher);

  return {
    tenants: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutateTenants: mutate
  };
};

export default useTenants;