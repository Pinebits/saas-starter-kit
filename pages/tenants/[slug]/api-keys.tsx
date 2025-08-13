import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { getTenant } from 'models/tenant';
import { getAuthOptions } from '@/lib/nextAuth';

export default function TenantAPIKeysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Keys</h1>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-blue-800">
          API keys are not yet implemented for tenants. This feature is coming soon.
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps({
  params,
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

  const { slug } = params as { slug: string };

  try {
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
