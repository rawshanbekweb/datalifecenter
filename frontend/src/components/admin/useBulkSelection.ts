import { useCallback, useMemo, useState } from 'react';

/**
 * Ro'yxatdagi yozuvlarni belgilash (checkbox) mantiqi.
 *
 * Ochiq formalardan keladigan bo'limlar (aloqa xabarlari, kurs so'rovlari)
 * gavjum kunda tez to'lib ketadi va ularni bittalab tozalash amalda
 * imkonsiz. Shu sabab har bir bunday sahifada bir xil belgilash+o'chirish
 * naqshi kerak — mantiq bu yerda, ko'rinishi `BulkActionBar` da.
 *
 * Belgilangan ID'lar sahifa almashganda TOZALANADI (`syncWithPage`):
 * ko'rinmayotgan yozuvni bilmasdan o'chirib yuborish eng oson xato edi.
 */
export function useBulkSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback((): void => setSelected(new Set()), []);

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  // Faqat shu sahifada ko'rinib turgan yozuvlar — boshqa sahifadan qolib
  // ketgan belgi o'chirishga qo'shilib ketmasligi uchun
  const selectedVisible = useMemo(
    () => [...selected].filter((id) => visibleSet.has(id)),
    [selected, visibleSet]
  );

  const allVisibleSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  const toggleAllVisible = useCallback((): void => {
    setSelected((prev) => {
      const everySelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      return everySelected ? new Set() : new Set(visibleIds);
    });
  }, [visibleIds]);

  return {
    selected,
    selectedIds: selectedVisible,
    count: selectedVisible.length,
    isSelected: (id: string): boolean => selected.has(id),
    toggle,
    toggleAllVisible,
    allVisibleSelected,
    clear,
  };
}
