import { useTranslation } from 'next-i18next';
import { Navigation } from '@/components/shared';

type NavigationItemsProps = {
  slug: string;
  activePathname?: string;
};

const TenantNavigation = ({ slug, activePathname }: NavigationItemsProps) => {
  const { t } = useTranslation('common');

  const items = [
    {
      name: t('products'),
      href: `/tenants/${slug}/products`,
      icon: 'store',
      active: activePathname === `/tenants/${slug}/products`,
    },
    {
      name: t('settings'),
      href: `/tenants/${slug}/settings`,
      icon: 'settings',
      active:
        activePathname?.startsWith(`/tenants/${slug}`) &&
        !activePathname?.startsWith(`/tenants/${slug}/products`),
    },
  ];

  return <Navigation items={items} />;
};

export default TenantNavigation;