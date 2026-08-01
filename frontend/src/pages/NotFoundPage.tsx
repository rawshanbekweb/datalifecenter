import React from 'react';
import { useTranslation } from 'react-i18next';
import ComingSoon from '../components/common/ComingSoon';
import Seo from '../components/common/Seo';

export default function NotFoundPage(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      {/* Mavjud bo'lmagan manzil qidiruv indeksiga tushmasligi kerak */}
      <Seo title={t('seo.notFound.title')} noIndex />
      <ComingSoon title={t('pages.notFound.title')} sub={t('pages.notFound.sub')} />
    </>
  );
}
