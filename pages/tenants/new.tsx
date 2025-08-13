import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { CreateTenant } from '@/components/tenant';
import { getAuthOptions } from '@/lib/nextAuth';

export default function NewTenantPage() {
  return (
    <CreateTenant visible={true} setVisible={() => {}} />
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