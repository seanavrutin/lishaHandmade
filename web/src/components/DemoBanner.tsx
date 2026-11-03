import { api } from '../data';

export default function DemoBanner() {
  if (!api.isDemo) return null;
  return (
    <div className="bg-primary px-4 py-1.5 text-center text-xs text-on-primary print:hidden">
      אתר הדגמה – הנתונים נשמרים רק בדפדפן הזה
    </div>
  );
}
