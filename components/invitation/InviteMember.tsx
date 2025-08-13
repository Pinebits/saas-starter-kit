import React from 'react';
import { useTranslation } from 'next-i18next';

import Modal from '../shared/Modal';
import type { Tenant } from '@prisma/client';
import InviteViaEmail from './InviteViaEmail';
import InviteViaLink from './InviteViaLink';

interface InviteMemberProps {
  tenant: Tenant;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

const InviteMember = ({ visible, setVisible, tenant }: InviteMemberProps) => {
  const { t } = useTranslation('common');

  return (
    <Modal open={visible} close={() => setVisible(!visible)}>
      <Modal.Header>{t('invite-new-member')}</Modal.Header>
      <Modal.Body>
        <div className="grid grid-cols-1 divide-y py-2">
          <InviteViaEmail setVisible={setVisible} tenant={tenant} />
          <InviteViaLink tenant={tenant} />
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default InviteMember;
