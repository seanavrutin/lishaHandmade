import { useEffect, useState } from 'react';
import type { SiteSettings } from '@shared/types';
import { Button, Card, Field, Loading, inputClass } from '../components/ui';
import { api } from '../data';
import { applySiteTheme, type ThemeName } from '../lib/theme';
import ThemePicker from './ThemePicker';

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings);
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

      <ThemePicker value={settings.theme} onChange={chooseTheme} />

      <Card className="space-y-3">
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
      </Card>

      {api.isDemo && (
        <Card className="space-y-2">
          <h2 className="font-semibold">מצב הדגמה</h2>
          <p className="text-sm text-muted">הנתונים נשמרים רק בדפדפן הזה. אפשר לאפס אותם לנתוני הדוגמה.</p>
          <Button variant="danger" onClick={reset}>
            איפוס נתוני הדגמה
          </Button>
        </Card>
      )}
    </div>
  );
}
