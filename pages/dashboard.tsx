import { Loading } from '@/components/shared';
import useTenants from 'hooks/useTenants';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { NextPageWithLayout } from 'types';
import { useSession } from 'next-auth/react';

const Dashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { tenants, isLoading } = useTenants();

  useEffect(() => {
    if (isLoading || !tenants) {
      return;
    }

    // If user is a master admin, redirect to admin panel
    if (session?.user?.isMasterAdmin) {
      router.push('/admin');
      return;
    }

    // For regular users, redirect to their first tenant
    if (tenants.length > 0) {
      router.push(`/tenants/${tenants[0].slug}`);
    } else {
      router.push('tenants?newTenant=true');
    }
  }, [isLoading, router, tenants, session]);

  return <Loading />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Dashboard;
