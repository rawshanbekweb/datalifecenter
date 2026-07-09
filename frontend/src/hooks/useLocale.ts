import { useContext } from 'react';
import { LocaleContext } from '../context/locale-context';

export function useLocale(): NonNullable<React.ContextType<typeof LocaleContext>> {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
