import React from 'react';
import { useTranslation } from 'next-i18next';
import { Button, LetterAvatar, ConfirmationDialog } from '@/components/shared';
import { useRouter } from 'next/router';
import { Tenant } from '@prisma/client';
import useTenants from '@/hooks/useTenants';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Card } from '@/components/shared';
import { useSession } from 'next-auth/react';

const Tenants = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const { isLoading, isError, tenants, mutateTenants } = useTenants();
  const { data: session } = useSession();
  const isMasterAdmin = session?.user?.isMasterAdmin === true;

  const { newTenant } = router.query as { newTenant: string };

  // If newTenant query param is present, show the create tenant modal
  React.useEffect(() => {
    if (newTenant) {
      router.push('/tenants/new');
    }
  }, [newTenant, router]);

  const leaveTenant = async (tenant: Tenant) => {
    const response = await fetch(`/api/tenants/${tenant.slug}/members`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'leave',
      }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      toast.error(error.message);
      return;
    }

    setTenant(null);
    toast.success(t('leave-tenant-success'));
    mutateTenants();
  };

  const [confirmVisible, setConfirmVisible] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center py-8">Loading...</div>
        </Card.Body>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <Card.Body>
          <div className="text-center py-8 text-red-600">Error loading tenants</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <Card.Title>{t('all-tenants')}</Card.Title>
            <Card.Description>{t('tenant-listed')}</Card.Description>
          </div>
          {isMasterAdmin && (
            <Button
              size="sm"
              onClick={() => router.push('/tenants/new')}
            >
              {t('create-tenant')}
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-gray-500">
                <th className="pb-3 text-left font-medium">{t('name')}</th>
                <th className="pb-3 text-left font-medium">{t('members')}</th>
                <th className="pb-3 text-left font-medium">{t('created')}</th>
                <th className="pb-3 text-left font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tenants?.map((tenant) => (
                <tr key={tenant.id} className="border-b">
                  <td className="py-4">
                    <Link 
                      href={`/tenants/${tenant.slug}`}
                      className="flex space-x-2 items-center"
                    >
                      <LetterAvatar name={tenant.name} />
                      <span className="underline">{tenant.name}</span>
                    </Link>
                  </td>
                  <td className="py-4">{tenant._count.members}</td>
                  <td className="py-4">{new Date(tenant.createdAt).toDateString()}</td>
                  <td className="py-4">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setTenant(tenant);
                        setConfirmVisible(true);
                      }}
                    >
                      {t('leave-tenant')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>

      <ConfirmationDialog
        title={`${t('leave-tenant')} ${tenant?.name}`}
        visible={confirmVisible}
        onConfirm={() => {
          if (tenant) {
            leaveTenant(tenant);
          }
        }}
        onCancel={() => setConfirmVisible(false)}
      >
        {t('leave-tenant-confirmation')}
      </ConfirmationDialog>
    </Card>
  );
};

export default Tenants;