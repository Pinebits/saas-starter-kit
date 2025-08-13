import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { Tenants } from '@/components/tenant';
import { getAuthOptions } from '@/lib/nextAuth';

export default function TenantsPage() {
  return (
    <div className="flex flex-col space-y-4">
      <Tenants />
    </div>
  );
}

export async function getServerSideProps({
  locale,
  req,
  res,
}: GetServerSidePropsContext) {
  const authOptions = getAuthOptions(req, res);
  const session = await getServerSession(req, res, authOptions);

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