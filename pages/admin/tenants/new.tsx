import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getSession } from '@/lib/session';
import CreateTenantForm from '@/components/admin/CreateTenantForm';

export default function CreateTenantPage() {
  return <CreateTenantForm />;
}

export async function getServerSideProps(
  context: GetServerSidePropsContext
) {
  const { req, res } = context;
  const session = await getSession(req, res);

  // Redirect if not logged in
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // Redirect if not a master admin
  if (!session.user.isMasterAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(context.locale || 'en', ['common'])),
    },
  };
}