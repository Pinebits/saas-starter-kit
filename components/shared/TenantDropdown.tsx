import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { Dropdown } from '@/components/shared';
import { useTenants } from '@/hooks/useTenants';

const TenantDropdown = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { data: session } = useSession();
  
  const { tenants } = useTenants();

  const currentTenant = (tenants || []).find(
    (tenant) => tenant.slug === router.query.slug
  );

  // Generate dropdown sections and items
  const sections = [
    {
      name: t('tenants'),
      items: (tenants || []).map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        href: `/tenants/${tenant.slug}/settings`,
        active: tenant.slug === router.query.slug,
      })),
    },
  ];

  // For master admins, add an admin section
  if (session?.user?.isMasterAdmin) {
    sections.push({
      name: t('administration'),
      items: [
        {
          id: 'admin-dashboard',
          name: t('admin-dashboard'),
          href: '/admin',
        }
      ],
    });
  }

  // Add a section for tenant management
  sections.push({
    name: t('manage'),
    items: [
      {
        id: 'all-tenants',
        name: t('all-tenants'),
        href: '/tenants',
      },
    ],
  });

  // Only master admins can create new tenants
  if (session?.user?.isMasterAdmin) {
    sections[sections.length - 1].items.push({
      id: 'new-tenant',
      name: t('new-tenant'),
      href: '/admin/tenants/new',
    });
  }

  return (
    <Dropdown
      label={
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate">
            {currentTenant?.name ||
              (router.pathname === '/tenants' ? t('all-tenants') : null) ||
              t('select-tenant')}
          </span>
        </div>
      }
    >
      {sections.map((section) => (
        <div key={section.name} className="px-1 py-1">
          <div className="text-xs pl-2 font-semibold text-gray-400 mb-1">
            {section.name}
          </div>
          {section.items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`${
                item.active ? 'bg-gray-100' : ''
              } flex rounded-md items-center w-full px-2 py-2 text-sm hover:bg-gray-100`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ))}
    </Dropdown>
  );
};

export default TenantDropdown;