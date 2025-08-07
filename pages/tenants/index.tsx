import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getSession } from 'next-auth/react';
import { Tenants } from '@/components/tenant';
import AppLayout from '@/components/layouts/AppLayout';

export default function TenantsPage() {
  return (
    <AppLayout>
      <div className="flex flex-col space-y-4">
        <Tenants />
      </div>
    </AppLayout>
  );
}

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  const session = await getSession();

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
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