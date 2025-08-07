import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getSession } from 'next-auth/react';
import AppLayout from '@/components/layouts/AppLayout';
import { getTenant } from 'models/tenant';
import { Tabs } from '@/components/shared';
import { TenantSettings, Members } from '@/components/tenant';
import { useTranslation } from 'next-i18next';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useRouter } from 'next/router';

export default function MembersPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  
  const { data } = useSWR(`/api/tenants/${slug}`, fetcher);
  const tenant = data?.data;

  return (
    <AppLayout>
      <div className="flex flex-col space-y-4">
        <Tabs
          tabs={[
            {
              name: t('general'),
              href: `/tenants/${slug}/settings`,
              panel: <TenantSettings />,
            },
            {
              name: t('members'),
              href: `/tenants/${slug}/members`,
              panel: tenant ? <Members tenant={tenant} /> : null,
            },
          ]}
        />
      </div>
    </AppLayout>
  );
}

export async function getServerSideProps({
  params,
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