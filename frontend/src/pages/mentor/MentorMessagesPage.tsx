import React from 'react';
import { useTranslation } from 'react-i18next';
import MessagesPanel from '../../components/messages/MessagesPanel';

export default function MentorMessagesPage(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{t('messages.title')}</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{t('messages.mentorSub')}</p>
      </div>
      <MessagesPanel accent="#7c3aed" />
    </div>
  );
}
