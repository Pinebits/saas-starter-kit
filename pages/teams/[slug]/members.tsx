import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Loading } from '@/components/shared';

export default function TeamMembersRedirect() {
  const router = useRouter();
  const { slug } = router.query;
  
  useEffect(() => {
    if (slug) {
      // Redirect to the equivalent tenant members page
      router.replace(`/tenants/${slug}/members`);
    }
  }, [router, slug]);
  
  // Show loading indicator while redirecting
  return <Loading />;
}

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}