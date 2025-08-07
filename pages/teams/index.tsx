import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';

const TeamsRedirect: NextPageWithLayout = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Get any query parameters
    const query = new URLSearchParams(router.asPath.split('?')[1] || '');
    
    // Redirect to tenants with the same query parameters
    router.replace(`/tenants${query.toString() ? `?${query.toString()}` : ''}`);
  }, [router]);
  
  return null;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default TeamsRedirect;