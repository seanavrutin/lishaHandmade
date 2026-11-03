import { useCallback, useRef } from 'react';

/**
 * Callback ref that adds `is-visible` (styled by `.reveal` in index.css) once the element scrolls
 * into view. A callback ref also works for elements that only render after data loads.
 */
export function useReveal<T extends HTMLElement>() {
  const observer = useRef<IntersectionObserver | null>(null);

  return useCallback((el: T | null) => {
    observer.current?.disconnect();
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }
    observer.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.current?.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.current.observe(el);
  }, []);
}
