// Terms ("תקנון") are edited by the admin as plain text: a line starting with "#" is a heading,
// a blank line starts a new paragraph. DEFAULT_TERMS is shown (as a draft) until she saves her own.

export const DEFAULT_TERMS = `# הזמנות
ההזמנות מתקבלות עד מועד הסגירה של כל אירוע, כפי שמופיע באתר, ובכפוף למלאי.

# תשלום
התשלום מתבצע ב-PayBox מיד לאחר ההזמנה, או באיסוף – לפי האפשרות שנבחרה.

# איסוף
האיסוף במועד ובמקום המפורטים בהזמנה. מוצר שלא נאסף במועד לא יוחזר.

# ביטול
ניתן לבטל הזמנה עד מועד סגירת ההזמנות בפנייה לליאור. מאחר שמדובר במזון מתכלה שמוכן בהזמנה אישית, לאחר מועד הסגירה לא ניתן לבטל.

# אלרגנים
המאפים מוכנים במטבח שבו נעשה שימוש בגלוטן, חלב, ביצים ואגוזים.

# פרטיות
השם ומספר הטלפון משמשים רק לטיפול בהזמנה וליצירת קשר לגביה, ולא יועברו לאף גורם.`;

export type TermsBlock = { type: 'heading' | 'paragraph'; text: string };

/** Splits the admin's text into headings ("# …") and paragraphs (separated by blank lines). */
export function parseTerms(text: string): TermsBlock[] {
  const blocks: TermsBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith('#')) {
      flush();
      const heading = line.replace(/^#+\s*/, '');
      if (heading) blocks.push({ type: 'heading', text: heading });
    } else paragraph.push(line);
  }
  flush();
  return blocks;
}
