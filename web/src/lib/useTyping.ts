import { useEffect, useState } from 'react';

const NOT_TYPING = new Set(['button', 'checkbox', 'radio', 'range', 'file', 'color', 'submit', 'reset', 'image']);

/** True for fields that open the phone keyboard (or the iPhone picker wheel). */
function opensKeyboard(el: Element | null) {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLInputElement) return !NOT_TYPING.has(el.type);
  return el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || el.isContentEditable;
}

/**
 * True while a text field has focus. iPhone Safari leaves bottom-fixed bars where the top of the
 * keyboard was, so bars are hidden while typing and shown again once the keyboard has closed.
 */
export function useTyping() {
  const [typing, setTyping] = useState(() => opensKeyboard(document.activeElement));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      if (opensKeyboard(document.activeElement)) {
        setTyping(true);
        return;
      }
      // Moving between fields keeps the keyboard open, and the keyboard needs a moment to slide away.
      timer = setTimeout(() => {
        if (opensKeyboard(document.activeElement)) return;
        setTyping(false);
        // Makes Safari recalculate fixed elements against the full screen again.
        window.scrollTo(window.scrollX, window.scrollY);
      }, 350);
    };
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);

  return typing;
}
