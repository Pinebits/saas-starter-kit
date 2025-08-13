import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useSession } from 'next-auth/react';
import { Tenant, Role } from '@prisma/client';
import { Button, Card, Badge, Avatar, ConfirmationDialog } from '@/components/shared';
import useTenantMembers, { TenantMemberWithUser } from '@/hooks/useTenantMembers';
import InviteMember from '@/components/invitation/InviteMember';
import toast from 'react-hot-toast';

interface UpdateMemberRoleProps {
  tenant: Tenant;
  member: TenantMemberWithUser;
}

const UpdateMemberRole = ({ tenant, member }: UpdateMemberRoleProps) => {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const { mutateTenantMembers } = useTenantMembers(tenant.slug);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = async (newRole: Role) => {
    setIsSubmitting(true);
    try {
      // Only master admins can update tenant member roles
      if (!session?.user?.isMasterAdmin) {
        toast.error(t('only-master-admin-can-update-roles'));
        return;
      }

      const response = await fetch(`/api/tenants/${tenant.slug}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: member.userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      mutateTenantMembers();
      toast.success(t('role-updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    { value: Role.OWNER, label: t('owner') },
    { value: Role.ADMIN, label: t('admin') },
    { value: Role.MEMBER, label: t('member') },
  ];

  return (
    <div className="flex space-x-2">
      {roleOptions.map((role) => (
        <Button
          key={role.value}
          size="xs"
          variant={member.role === role.value ? 'secondary' : 'ghost'}
          disabled={isSubmitting || member.role === role.value}
          onClick={() => handleRoleChange(role.value)}
        >
          {role.label}
        </Button>
      ))}
    </div>
  );
};

interface MembersProps {
  tenant: Tenant;
}

const Members = ({ tenant }: MembersProps) => {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TenantMemberWithUser | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { isLoading, isError, members, mutateTenantMembers } = useTenantMembers(
    tenant.slug
  );

  const removeTenantMember = async (member: TenantMemberWithUser | null) => {
    if (!member) return;

    try {
      // Only master admins can remove tenant members
      if (!session?.user?.isMasterAdmin) {
        toast.error(t('only-master-admin-can-remove-members'));
        return;
      }

      const sp = new URLSearchParams({ userId: member.userId });
      const response = await fetch(
        `/api/tenants/${tenant.slug}/members?${sp.toString()}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove member');
      }

      mutateTenantMembers();
      toast.success(t('member-removed'));
      setShowConfirm(false);
      setSelectedMember(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return <div className="p-4">{t('loading')}</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">{t('error-loading-members')}</div>;
  }

  return (
    <>
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>{t('members')}</Card.Title>
              <Card.Description>{t('manage-tenant-members')}</Card.Description>
            </div>
            {session?.user?.isMasterAdmin && (
              <Button onClick={() => setVisible(true)}>
                {t('invite-member')}
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
                  <th className="pb-3 text-left font-medium">{t('email')}</th>
                  <th className="pb-3 text-left font-medium">{t('role')}</th>
                  <th className="pb-3 text-left font-medium">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => (
                  <tr key={member.id} className="border-b">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.user?.image}
                          alt={member.user?.name}
                          className="h-8 w-8 rounded-full"
                        />
                        {member.user?.name}
                      </div>
                    </td>
                    <td>{member.user?.email}</td>
                    <td>
                      <Badge>{member.role}</Badge>
                    </td>
                    <td>
                      {session?.user?.isMasterAdmin && (
                        <div className="flex items-center gap-4">
                          <UpdateMemberRole tenant={tenant} member={member} />
                          <Button
                            onClick={() => {
                              setSelectedMember(member);
                              setShowConfirm(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            {t('remove')}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <ConfirmationDialog
        title={t('remove-member')}
        visible={showConfirm}
        onConfirm={() => {
          removeTenantMember(selectedMember);
        }}
        onCancel={() => setShowConfirm(false)}
      >
        {t('remove-member-confirm', {
          name: selectedMember?.user?.name,
        })}
      </ConfirmationDialog>

      <InviteMember visible={visible} setVisible={setVisible} tenant={tenant} />
    </>
  );
};

export default Members;