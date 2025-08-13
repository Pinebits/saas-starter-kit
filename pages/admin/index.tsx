import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getSession } from '@/lib/session';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  return <AdminDashboard />;
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