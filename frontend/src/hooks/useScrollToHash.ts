import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToHash(): void {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id: string = hash.slice(1);
    const el: HTMLElement | null = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash, pathname]);
}
