import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useSWR } from 'swr';
import { Button, InputWithLabel } from '@/components/shared';
import toast from 'react-hot-toast';
import type { Tenant } from '@prisma/client';

interface InviteViaEmailProps {
  tenant: Tenant;
  setVisible: (visible: boolean) => void;
}

const InviteViaEmail = ({ setVisible, tenant }: InviteViaEmailProps) => {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate } = useSWR(`/api/tenants/${tenant.slug}/invitations?sentViaEmail=true`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tenants/${tenant.slug}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          sentViaEmail: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      toast.success(t('invitation-sent'));
      setEmail('');
      setVisible(false);
      mutate(`/api/tenants/${tenant.slug}/invitations?sentViaEmail=true`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">{t('invite-via-email')}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputWithLabel
          label={t('email-address')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter-email-address')}
          required
        />
        <div className="flex space-x-2">
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {t('send-invitation')}
          </Button>
          <Button type="button" variant="outline" onClick={() => setVisible(false)}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InviteViaEmail;
