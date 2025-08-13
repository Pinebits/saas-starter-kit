import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { getTenant } from 'models/tenant';
import { Members } from '@/components/tenant';
import { useTranslation } from 'next-i18next';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useRouter } from 'next/router';
import { authOptions } from '@/lib/nextAuth';

export default function TenantMembersPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  
  const { data, error, isLoading } = useSWR(`/api/tenants/${slug}`, fetcher);
  const tenant = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading tenant</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{t('members')}</h1>
        <p className="text-gray-600 mt-2">{t('manage-tenant-members')}</p>
      </div>

      {/* Members Component */}
      <Members tenant={tenant} />
    </div>
  );
}

export async function getServerSideProps({
  params,
  locale,
  req,
  res,
}: GetServerSidePropsContext) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const { slug } = params as { slug: string };

  try {
    // Verify tenant exists
    await getTenant({ slug });

    return {
      props: {
        ...(await serverSideTranslations(locale || 'en', ['common'])),
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}