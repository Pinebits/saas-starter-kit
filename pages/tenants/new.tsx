import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getSession } from 'next-auth/react';
import AppLayout from '@/components/layouts/AppLayout';
import { CreateTenant } from '@/components/tenant';

export default function NewTenantPage() {
  return (
    <AppLayout>
      <CreateTenant visible={true} setVisible={() => {}} />
    </AppLayout>
  );
}

export async function getServerSideProps({
  locale,
  req,
  res,
}: GetServerSidePropsContext) {
  const session = await getSession({ req });

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  // Check if user is a master admin
  if (!session.user.isMasterAdmin) {
    return {
      redirect: {
        destination: '/tenants',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
}