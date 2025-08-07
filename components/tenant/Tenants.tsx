import { useTranslation } from 'next-i18next';
import { DataGrid, Button, LetterAvatar, Confirm } from '@/components/shared';
import { useRouter } from 'next/router';
import { Tenant } from '@prisma/client';
import useTenants from '@/hooks/useTenants';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Card } from '@/components/shared';
import { CreateTenant } from '@/components/tenant';
import { useSession } from 'next-auth/react';

const Tenants = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const { isLoading, isError, tenants, mutateTenants } = useTenants();
  const { data: session } = useSession();
  const isMasterAdmin = session?.user?.isMasterAdmin === true;

  const [createTenantVisible, setCreateTenantVisible] = useState(false);

  const { newTenant } = router.query as { newTenant: string };

  // If newTenant query param is present, show the create tenant modal
  React.useEffect(() => {
    if (newTenant) {
      setCreateTenantVisible(true);
    }
  }, [newTenant]);

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
              onClick={() => setCreateTenantVisible(!createTenantVisible)}
            >
              {t('create-tenant')}
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body>
        <DataGrid
          loading={isLoading}
          error={isError}
          data={
            tenants
              ? tenants.map((tenant) => {
                  return {
                    id: tenant.id,
                    cells: [
                      {
                        children: (
                          <Link href={`/tenants/${tenant.slug}/members`}>
                            <a className="flex space-x-2 items-center">
                              <LetterAvatar name={tenant.name} />
                              <span className="underline">{tenant.name}</span>
                            </a>
                          </Link>
                        ),
                      },
                      { wrap: true, text: '' + tenant._count.members },
                      {
                        text: new Date(tenant.createdAt).toDateString(),
                        wrap: true,
                      },
                      {
                        children: (
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => {
                              setTenant(tenant);
                              setConfirmVisible(true);
                            }}
                          >
                            {t('leave-tenant')}
                          </Button>
                        ),
                      },
                    ],
                  };
                })
              : []
          }
          columns={[
            t('name'),
            t('members'),
            t('created'),
            t('actions'),
          ]}
        />
      </Card.Body>

      <Confirm
        title={`${t('leave-tenant')} ${tenant?.name}`}
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={() => {
          if (tenant) {
            leaveTenant(tenant);
          }
          setConfirmVisible(false);
        }}
        confirmText={t('leave-tenant')}
      >
        {t('leave-tenant-confirmation')}
      </Confirm>
      <CreateTenant
        visible={createTenantVisible}
        setVisible={setCreateTenantVisible}
      />
    </Card>
  );
};

export default Tenants;