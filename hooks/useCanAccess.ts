import type { Action, Resource } from '@/lib/permissions';

import usePermissions from './usePermissions';
import { useSession } from 'next-auth/react';

const useCanAccess = () => {
  const { permissions, isError, isLoading } = usePermissions();
  const { data: session } = useSession();
  const isMasterAdmin = session?.user?.isMasterAdmin === true;

  const canAccess = (resource: Resource, actions: Action[]) => {
    // Master admins have access to all resources and actions
    if (isMasterAdmin) {
      return true;
    }

    // For regular users, check permissions
    return (permissions || []).some(
      (permission) =>
        permission.resource === resource &&
        (permission.actions === '*' ||
          permission.actions.some((action) => actions.includes(action)))
    );
  };

  return {
    isLoading,
    isError,
    canAccess,
    isMasterAdmin
  };
};

export default useCanAccess;