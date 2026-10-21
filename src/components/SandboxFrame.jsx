import { forwardRef, useEffect, useMemo, useState } from 'react';
import { buildAnimationDoc } from '../lib/utils';

/**
 * Admin kiritgan HTML/CSS/JS kodini xavfsiz ishga tushiradi.
 * sandbox="allow-scripts" (allow-same-origin YO'Q) — kod asosiy sayt cookie,
 * localStorage, Supabase sessiyasi va DOM'iga kira olmaydi.
 */
export const SandboxFrame = forwardRef(function SandboxFrame({ html, css, js, title, onError, runKey, className }, ref) {
  const doc = useMemo(() => buildAnimationDoc({ html, css, js }), [html, css, js]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((k) => k + 1);
  }, [doc, runKey]);

  useEffect(() => {
    if (!onError) return;
    const handler = (e) => {
      if (e.data && typeof e.data === 'object' && '__tfAnimError' in e.data) onError(String(e.data.__tfAnimError));
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onError]);

  return (
    <iframe
      ref={ref}
      key={key}
      title={title || 'animation'}
      className={className || 'sandbox-frame'}
      sandbox="allow-scripts allow-pointer-lock"
      referrerPolicy="no-referrer"
      srcDoc={doc}
    />
  );
});
