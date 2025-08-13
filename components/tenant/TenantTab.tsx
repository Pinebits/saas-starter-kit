import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { Tab } from '@/components/shared';
import { useCanAccess } from '@/hooks/useCanAccess';
import type { Tenant } from '@prisma/client';

export type TenantFeature = {
  sso?: boolean;
  dsync?: boolean;
  auditLog?: boolean;
  payments?: boolean;
  webhook?: boolean;
  apiKey?: boolean;
};

interface TenantTabProps {
  activeTab: string;
  tenant: Tenant;
  heading?: string;
  tenantFeatures: TenantFeature;
}

const TenantTab = ({ activeTab, tenant, heading, tenantFeatures }: TenantTabProps) => {
  const { t } = useTranslation('common');
  const canAccess = useCanAccess();


  // Basic tabs that are always available
  const tabs = [
    {
      name: t('settings'),
      href: `/tenants/${tenant.slug}/settings`,
      active: activeTab === 'settings',
    },
  ];

  // Add members tab if user has access
  if (canAccess('tenant_member', ['create', 'update', 'read', 'delete'])) {
    tabs.push({
      name: t('members'),
      href: `/tenants/${tenant.slug}/members`,
      active: activeTab === 'members',
    });
  }

  // Add SSO tab if feature is enabled and user has access
  if (
    tenantFeatures.sso &&
    canAccess('tenant_sso', ['create', 'update', 'read', 'delete'])
  ) {
    tabs.push({
      name: t('sso'),
      href: `/tenants/${tenant.slug}/sso`,
      active: activeTab === 'sso',
    });
  }

  // Add Directory Sync tab if feature is enabled and user has access
  if (
    tenantFeatures.dsync &&
    canAccess('tenant_dsync', ['create', 'update', 'read', 'delete'])
  ) {
    tabs.push({
      name: t('directory-sync'),
      href: `/tenants/${tenant.slug}/directory-sync`,
      active: activeTab === 'directory-sync',
    });
  }

  // Add Audit Log tab if feature is enabled and user has access
  if (
    tenantFeatures.auditLog &&
    canAccess('tenant_audit_log', ['create', 'update', 'read', 'delete'])
  ) {
    tabs.push({
      name: t('audit-logs'),
      href: `/tenants/${tenant.slug}/audit-logs`,
      active: activeTab === 'audit-logs',
    });
  }

  // Add Billing tab if feature is enabled and user has access
  if (
    tenantFeatures.payments &&
    canAccess('tenant_payments', ['create', 'update', 'read', 'delete'])
  ) {
    tabs.push({
      name: t('billing'),
      href: `/tenants/${tenant.slug}/billing`,
      active: activeTab === 'billing',
    });
  }

  // Add Webhooks tab if feature is enabled and user has access
  if (
    tenantFeatures.webhook &&
    canAccess('tenant_webhook', ['create', 'update', 'read', 'delete'])
  ) {
    tabs.push({
      name: t('webhooks'),
      href: `/tenants/${tenant.slug}/webhooks`,
      active: activeTab === 'webhooks',
    });
  }

  // Add API Keys tab if feature is enabled and user has access
  if (
    tenantFeatures.apiKey &&
    canAccess('tenant_api_key', ['create', 'update', 'read', 'delete'])
  ) {
    tabs.push({
      name: t('api-keys'),
      href: `/tenants/${tenant.slug}/api-keys`,
      active: activeTab === 'api-keys',
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          {heading ? heading : tenant.name}
        </h1>
      </div>
      <Tab tabs={tabs} />
    </div>
  );
};

export default TenantTab;