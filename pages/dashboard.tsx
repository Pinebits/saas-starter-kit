import { Loading } from '@/components/shared';
import useTenants from 'hooks/useTenants';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { NextPageWithLayout } from 'types';

const Dashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { tenants, isLoading } = useTenants();

  useEffect(() => {
    if (isLoading || !tenants) {
      return;
    }

    if (tenants.length > 0) {
      router.push(`/tenants/${tenants[0].slug}/settings`);
    } else {
      router.push('tenants?newTenant=true');
    }
  }, [isLoading, router, tenants]);

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
