import React from 'react';
import { useTranslation } from 'react-i18next';
import ComingSoon from '../components/common/ComingSoon';

export default function NotFoundPage(): React.ReactElement {
  const { t } = useTranslation();
  return <ComingSoon title={t('pages.notFound.title')} sub={t('pages.notFound.sub')} />;
}
