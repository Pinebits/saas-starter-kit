import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';
import { getTenant } from 'models/tenant';
import { authOptions } from '@/lib/nextAuth';

export default function TenantProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">
          Product management is not yet implemented for tenants. This feature is coming soon.
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
