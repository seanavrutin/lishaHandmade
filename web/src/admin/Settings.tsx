import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { SiteSettings } from '@shared/types';
import { Button, Field, Loading, inputClass } from '../components/ui';
import { api } from '../data';
import { DEFAULT_TERMS } from '../lib/terms';
import { applySiteTheme, type ThemeName } from '../lib/theme';
import SettingsSection from './SettingsSection';
import ThemePicker from './ThemePicker';

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // The terms box starts from the built-in draft until the admin saves her own version.
    api.getSettings().then((s) => setSettings({ ...s, terms: s.terms?.trim() ? s.terms : DEFAULT_TERMS }));
  }, []);

  if (!settings) return <Loading />;

  const set = (key: keyof SiteSettings, value: string) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  async function save() {
    await api.saveSettings(settings!);
    setSaved(true);
  }

  async function reset() {
    if (!confirm('לאפס את כל נתוני ההדגמה (מוצרים, אירועים, הזמנות) לברירת המחדל?')) return;
    await api.resetDemo();
    setSettings(await api.getSettings());
  }

  // The theme saves on its own (merged into the stored settings), so unsaved text edits aren't saved with it.
  async function chooseTheme(theme: ThemeName) {
    setSettings({ ...settings!, theme });
    applySiteTheme(theme);
    await api.saveSettings({ ...(await api.getSettings()), theme });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl">הגדרות האתר</h1>

      <SettingsSection title="עיצוב האתר">
        <ThemePicker value={settings.theme} onChange={chooseTheme} />
      </SettingsSection>

      <SettingsSection title="פרטי העסק">
        <Field label="טקסט ״קצת עליי״">
          <textarea className={inputClass} rows={6} value={settings.aboutText} onChange={(e) => set('aboutText', e.target.value)} />
        </Field>
        <Field label="טלפון ליצירת קשר" hint="משמש גם לכפתור הוואטסאפ ולתשלום בביט">
          <input className={inputClass} dir="ltr" type="tel" value={settings.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="קישור PayBox לעסקים">
          <input className={inputClass} dir="ltr" value={settings.payboxLink} onChange={(e) => set('payboxLink', e.target.value)} />
        </Field>
        <Field label="כתובת איסוף (ברירת מחדל לאירועים חדשים)">
          <input className={inputClass} value={settings.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} />
        </Field>
        <Field label="קישור לאינסטגרם">
          <input className={inputClass} dir="ltr" value={settings.instagram} onChange={(e) => set('instagram', e.target.value)} />
        </Field>
        <Button onClick={save} className="w-full py-3">
          {saved ? '✓ נשמר' : 'שמירה'}
        </Button>
      </SettingsSection>

      <SettingsSection title="הודעה כשאין הזמנות פתוחות">
        <Field label="כותרת">
          <input className={inputClass} value={settings.closedTitle} onChange={(e) => set('closedTitle', e.target.value)} />
        </Field>
        <Field label="טקסט">
          <textarea className={inputClass} rows={2} value={settings.closedText} onChange={(e) => set('closedText', e.target.value)} />
        </Field>
        <Button onClick={save} className="w-full py-3">
          {saved ? '✓ נשמר' : 'שמירה'}
        </Button>
      </SettingsSection>

      <SettingsSection title="תקנון">
        <Link to="/terms" target="_blank" className="block text-sm underline">
          צפייה בתקנון
        </Link>
        <Field label="טקסט התקנון" hint="שורה שמתחילה ב-# היא כותרת. שורה ריקה מתחילה פסקה חדשה.">
          <textarea
            className={`${inputClass} leading-relaxed`}
            rows={16}
            value={settings.terms}
            onChange={(e) => set('terms', e.target.value)}
          />
        </Field>
        <Button onClick={save} className="w-full py-3">
          {saved ? '✓ נשמר' : 'שמירת התקנון'}
        </Button>
      </SettingsSection>

      {api.isDemo && (
        <SettingsSection title="מצב הדגמה">
          <p className="text-sm text-muted">הנתונים נשמרים רק בדפדפן הזה. אפשר לאפס אותם לנתוני הדוגמה.</p>
          <Button variant="danger" onClick={reset}>
            איפוס נתוני הדגמה
          </Button>
        </SettingsSection>
      )}
    </div>
  );
}
