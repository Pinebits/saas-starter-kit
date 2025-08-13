import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useSWR } from 'swr';
import { Button, InputWithLabel } from '@/components/shared';
import toast from 'react-hot-toast';
import type { Tenant } from '@prisma/client';

interface InviteViaLinkProps {
  tenant: Tenant;
}

const InviteViaLink = ({ tenant }: InviteViaLinkProps) => {
  const { t } = useTranslation('common');
  const [inviteLink, setInviteLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: invitations, mutate } = useSWR(`/api/tenants/${tenant.slug}/invitations?sentViaEmail=false`);

  const generateInviteLink = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.slug}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentViaEmail: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate invite link');
      }

      const result = await response.json();
      setInviteLink(result.data.inviteLink);
      toast.success(t('invite-link-generated'));
      mutate(`/api/tenants/${tenant.slug}/invitations?sentViaEmail=false`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteInviteLink = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tenants/${tenant.slug}/invitations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete invite link');
      }

      toast.success(t('invite-link-deleted'));
      mutate(`/api/tenants/${tenant.slug}/invitations?sentViaEmail=false`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-4">{t('invite-via-link')}</h3>
      <div className="space-y-4">
        <Button
          onClick={generateInviteLink}
          loading={isGenerating}
          disabled={isGenerating}
        >
          {t('generate-invite-link')}
        </Button>

        {inviteLink && (
          <div className="space-y-2">
            <InputWithLabel
              label={t('invite-link')}
              value={inviteLink}
              readOnly
            />
            <Button
              onClick={() => navigator.clipboard.writeText(inviteLink)}
              variant="outline"
              size="sm"
            >
              {t('copy-link')}
            </Button>
          </div>
        )}

        {invitations?.data?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">{t('active-invite-links')}</h4>
            {invitations.data.map((invitation: any) => (
              <div key={invitation.id} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{invitation.inviteLink}</span>
                <Button
                  onClick={() => deleteInviteLink(invitation.id)}
                  variant="outline"
                  size="xs"
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  {t('delete')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteViaLink;
