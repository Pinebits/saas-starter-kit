import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useRouter } from 'next/router';
import { Tenant } from '@prisma/client';

type TenantResponse = {
  data: Tenant;
};

const useTenant = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };

  const { data, error, mutate } = useSWR<TenantResponse>(
    slug ? `/api/tenants/${slug}` : null,
    fetcher
  );

  return {
    tenant: data?.data,
    isLoading: !error && !data,
    isError: error,
    mutateTenant: mutate,
  };
};

export default useTenant;