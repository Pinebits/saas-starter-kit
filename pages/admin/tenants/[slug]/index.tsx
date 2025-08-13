import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getServerSession } from 'next-auth';

import { getTenant } from 'models/tenant';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { authOptions } from '@/lib/nextAuth';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card, Button, Badge } from '@/components/shared';
import Link from 'next/link';

export default function AdminTenantDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  
  const { data, error, isLoading } = useSWR(`/api/admin/tenants/${slug}`, fetcher);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-gray-600 mt-2">Admin Tenant View</p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </div>
        </div>

        {/* Tenant Details */}
        <Card>
          <Card.Header>
            <Card.Title>Tenant Information</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <p className="text-gray-900">{tenant.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <p className="text-gray-900">{tenant.domain || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-gray-900">{new Date(tenant.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Actions */}
        <Card>
          <Card.Header>
            <Card.Title>Actions</Card.Title>
          </Card.Header>
          <Card.Body>
            <div className="flex space-x-4">
              <Link href={`/tenants/${slug}`}>
                <Button>View Tenant Page</Button>
              </Link>
              <Link href={`/tenants/${slug}/members`}>
                <Button variant="outline">View Members</Button>
              </Link>
            </div>
          </Card.Body>
        </Card>
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

  // Check if user is master admin
  if (!session.user?.isMasterAdmin) {
    return {
      redirect: {
        destination: '/dashboard',
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
