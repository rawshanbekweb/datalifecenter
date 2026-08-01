import React from 'react';
import { useTranslation } from 'react-i18next';
import MessagesPanel from '../../components/messages/MessagesPanel';

// Yozishma oynasi uch kabinetda ham bir xil — bu yerda faqat sarlavha
// va kabinet aksent rangi farq qiladi
export default function StudentMessagesPage(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{t('messages.title')}</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{t('messages.studentSub')}</p>
      </div>
      <MessagesPanel accent="#0ea5e9" />
    </div>
  );
}
