import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Avatar, Tabs, EmptyState } from '@/components/shared';
import { useSWR } from '@/hooks/useSWR';
import Link from 'next/link';
import { Confirm } from '@/components/shared';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

// Custom hook for admin data
const useAdminData = (endpoint) => {
  const { data, error, mutate } = useSWR(
    endpoint,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  return {
    data: data?.data || [],
    isLoading: !error && !data,
    isError: error,
    mutate
  };
};

// Users management section
const UsersList = () => {
  const { t } = useTranslation('common');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { data: users, isLoading, isError, mutate } = useAdminData('/api/admin/users');

  const toggleMasterAdmin = async (userId, currentStatus) => {
    // Don't allow toggling your own status
    if (userId === currentUserId) {
      toast.error(t('cannot-change-own-admin-status'));
      return;
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isMasterAdmin: !currentStatus
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      mutate();
      toast.success(!currentStatus ? t('user-promoted-to-admin') : t('user-admin-revoked'));
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  if (isLoading) return <div className="text-center p-4">{t('loading')}</div>;
  if (isError) return <div className="text-center p-4 text-red-500">{t('error-loading-users')}</div>;
  
  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>{t('all-users')}</Card.Title>
          <Card.Description>
            {t('manage-users-and-permissions')}
          </Card.Description>
        </Card.Header>
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('user')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('tenants')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('joined')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          src={user.image}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user._count?.tenantMembers || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isMasterAdmin ? (
                        <Badge color="green">{t('master-admin')}</Badge>
                      ) : (
                        <Badge color="gray">{t('user')}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant={user.isMasterAdmin ? "danger" : "success"}
                        onClick={() => toggleMasterAdmin(user.id, user.isMasterAdmin)}
                        disabled={user.id === currentUserId}
                      >
                        {user.isMasterAdmin ? t('revoke-admin') : t('make-admin')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
      
      <Confirm
        title={t('confirm-action')}
        description={
          selectedUser?.isMasterAdmin
            ? t('confirm-revoke-admin')
            : t('confirm-make-admin')
        }
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          toggleMasterAdmin(selectedUser.id, selectedUser.isMasterAdmin);
          setShowConfirm(false);
        }}
      />
    </div>
  );
};

// Tenants management section
const TenantsList = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  const { data: tenants, isLoading, isError, mutate } = useAdminData('/api/tenants');
  
  const handleDeleteTenant = async (slug) => {
    try {
      const response = await fetch(`/api/tenants/${slug}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete tenant');
      }
      
      mutate();
      toast.success(t('tenant-deleted'));
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const confirmDeleteTenant = (tenant) => {
    setSelectedTenant(tenant);
    setShowConfirm(true);
  };
  
  if (isLoading) return <div className="text-center p-4">{t('loading')}</div>;
  if (isError) return <div className="text-center p-4 text-red-500">{t('error-loading-tenants')}</div>;
  
  if (tenants.length === 0) {
    return (
      <EmptyState
        title={t('no-tenants')}
        description={t('no-tenants-description')}
        action={
          <Button onClick={() => router.push('/admin/tenants/new')}>
            {t('create-tenant')}
          </Button>
        }
      />
    );
  }
  
  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>{t('all-tenants')}</Card.Title>
          <Card.Description>
            {t('manage-tenants-and-memberships')}
          </Card.Description>
          <div className="mt-4">
            <Button onClick={() => router.push('/admin/tenants/new')}>
              {t('create-tenant')}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('slug')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('members')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('created')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenant.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenant._count?.members || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/tenants/${tenant.slug}/settings`} passHref>
                          <Button variant="secondary">
                            {t('manage')}
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          onClick={() => confirmDeleteTenant(tenant)}
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
      
      <Confirm
        title={t('confirm-delete')}
        description={t('confirm-delete-tenant-description', { tenant: selectedTenant?.name })}
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          handleDeleteTenant(selectedTenant.slug);
          setShowConfirm(false);
        }}
      />
    </div>
  );
};

// Audit logs section
const AuditLogs = () => {
  const { t } = useTranslation('common');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    action: '',
    targetType: '',
  });
  
  const { data: response, isLoading, isError } = useSWR(
    `/api/admin/audit-logs?page=${page}&action=${filter.action}&targetType=${filter.targetType}`,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  const logs = response?.data || [];
  const pagination = response?.pagination || { total: 0, pages: 1 };
  
  if (isLoading) return <div className="text-center p-4">{t('loading')}</div>;
  if (isError) return <div className="text-center p-4 text-red-500">{t('error-loading-audit-logs')}</div>;
  
  return (
    <div>
      <Card>
        <Card.Header>
          <Card.Title>{t('audit-logs')}</Card.Title>
          <Card.Description>
            {t('audit-logs-description')}
          </Card.Description>
          <div className="mt-4 flex space-x-4">
            <select
              className="form-select"
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            >
              <option value="">{t('all-actions')}</option>
              <option value="CREATE_TENANT">{t('create-tenant')}</option>
              <option value="UPDATE_TENANT">{t('update-tenant')}</option>
              <option value="DELETE_TENANT">{t('delete-tenant')}</option>
              <option value="ADD_TENANT_MEMBER">{t('add-tenant-member')}</option>
              <option value="REMOVE_TENANT_MEMBER">{t('remove-tenant-member')}</option>
              <option value="GRANT_MASTER_ADMIN">{t('grant-master-admin')}</option>
              <option value="REVOKE_MASTER_ADMIN">{t('revoke-master-admin')}</option>
            </select>
            <select
              className="form-select"
              value={filter.targetType}
              onChange={(e) => setFilter({ ...filter, targetType: e.target.value })}
            >
              <option value="">{t('all-target-types')}</option>
              <option value="TENANT">{t('tenant')}</option>
              <option value="TENANT_MEMBER">{t('tenant-member')}</option>
              <option value="USER">{t('user')}</option>
            </select>
          </div>
        </Card.Header>
        <Card.Body>
          {logs.length === 0 ? (
            <EmptyState
              title={t('no-audit-logs')}
              description={t('no-audit-logs-description')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('time')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('action')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('target')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('details')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{log.user.name}</div>
                        <div className="text-sm text-gray-500">{log.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{log.targetType}</div>
                        <div className="text-xs">{log.targetId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t('previous')}
              </Button>
              <span>
                {t('page-x-of-y', { current: page, total: pagination.pages })}
              </span>
              <Button
                variant="secondary"
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                {t('next')}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

// Main admin dashboard component
const AdminDashboard = () => {
  const { t } = useTranslation('common');
  const { data: session } = useSession();
  const router = useRouter();
  
  // Redirect if not a master admin
  useEffect(() => {
    if (session && !session.user.isMasterAdmin) {
      router.push('/');
    }
  }, [session, router]);
  
  if (!session) {
    return <div className="text-center p-4">{t('loading')}</div>;
  }
  
  if (!session.user.isMasterAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('admin-dashboard')}</h1>
      
      <Tabs
        tabs={[
          {
            name: t('users'),
            href: '#users',
            panel: <UsersList />,
          },
          {
            name: t('tenants'),
            href: '#tenants',
            panel: <TenantsList />,
          },
          {
            name: t('audit-logs'),
            href: '#audit-logs',
            panel: <AuditLogs />,
          },
        ]}
      />
    </div>
  );
};

export default AdminDashboard;