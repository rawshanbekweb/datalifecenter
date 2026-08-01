import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import MessagesPanel from '../../components/messages/MessagesPanel';

/**
 * Adminning yozishmalari — ochiq kontakt formasidan kelgan xabarlar
 * (/admin/messages) bilan ATAYIN aralashtirilmagan: bu yerda hisobi bor
 * foydalanuvchilar bilan ikki tomonlama suhbat, u yerda esa mehmonlarning
 * bir martalik murojaatlari.
 */
export default function AdminChatPage(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div>
      <AdminPageHeader title={t('messages.title')} sub={t('messages.adminSub')} />
      <MessagesPanel accent="#0ea5e9" />
    </div>
  );
}
