import { useTranslation } from 'next-i18next';
import { Card, Button, Confirm } from '@/components/shared';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { Tenant } from '@prisma/client';

interface RemoveTenantProps {
  tenant: Tenant;
  allowDelete?: boolean;
}

const RemoveTenant = ({ tenant, allowDelete = false }: RemoveTenantProps) => {
  const { t } = useTranslation('common');
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const removeTenant = async () => {
    setIsSubmitting(true);

    const response = await fetch(`/api/tenants/${tenant.slug}`, {
      method: 'DELETE',
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const { error } = await response.json();
      toast.error(error.message);
      return;
    }

    setShowConfirm(false);
    toast.success(t('tenant-removed-successfully'));
    router.push('/tenants');
  };

  return (
    <>
      <Card>
        <Card.Header>
          <Card.Title>{t('remove-tenant')}</Card.Title>
          <Card.Description>
            {allowDelete
              ? t('remove-tenant-warning')
              : t('remove-tenant-restricted')}
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="danger"
              disabled={!allowDelete || isSubmitting}
              onClick={() => setShowConfirm(true)}
            >
              {t('remove-tenant')}
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Confirm
        title={t('remove-tenant')}
        visible={showConfirm}
        onConfirm={removeTenant}
        onClose={() => setShowConfirm(false)}
      >
        {t('remove-tenant-confirmation')}
      </Confirm>
    </>
  );
};

export default RemoveTenant;