import { Loading } from '@/components/shared';
import useTeams from 'hooks/useTeams';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import type { NextPageWithLayout } from 'types';
import { useSession } from 'next-auth/react';

const Dashboard: NextPageWithLayout = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { teams, isLoading } = useTeams();

  useEffect(() => {
    if (isLoading || !teams) {
      return;
    }

    // If user is a master admin, redirect to admin panel
    if (session?.user?.isMasterAdmin) {
      router.push('/admin');
      return;
    }

    // For regular users, redirect to their first tenant
    if (teams.length > 0) {
      router.push(`/tenants/${teams[0].slug}`);
    } else {
      router.push('tenants?newTenant=true');
    }
  }, [isLoading, router, teams, session]);

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
