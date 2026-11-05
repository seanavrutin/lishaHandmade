import { Loading } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { DEFAULT_TERMS, parseTerms } from '../lib/terms';

/** Terms come from site settings (admin → הגדרות); the built-in draft shows until the admin saves her own. */
export default function Terms() {
  const { data: settings, loading } = useApiData(() => api.getSettings(), []);
  if (loading) return <Loading />;

  const custom = settings?.terms?.trim();
  const blocks = parseTerms(custom || DEFAULT_TERMS);

  return (
    <article className="space-y-4 py-8 leading-relaxed">
      <h1 className="font-display text-3xl">תקנון</h1>
      {!custom && <p className="rounded-xl bg-accent/30 p-3 text-sm">טיוטה – התקנון הסופי יעודכן בקרוב.</p>}
      {blocks.map((b, i) =>
        b.type === 'heading' ? (
          <h2 key={i} className="pt-2 font-semibold">
            {b.text}
          </h2>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b.text}
          </p>
        ),
      )}
    </article>
  );
}
