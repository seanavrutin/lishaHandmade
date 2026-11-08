import { api } from '../data';
import { useApiData } from '../data/hooks';

/** The message customers see when no event is open. Lior edits both lines in Admin → הגדרות. */
export default function ClosedNotice({ heading: Heading = 'h1' }: { heading?: 'h1' | 'h2' }) {
  const { data: settings } = useApiData(() => api.getSettings(), []);
  if (!settings) return null;

  return (
    <>
      {settings.closedTitle && <Heading className="font-display text-2xl">{settings.closedTitle}</Heading>}
      {settings.closedText && <p className="mt-2 whitespace-pre-line text-muted">{settings.closedText}</p>}
    </>
  );
}
