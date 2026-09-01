'use client';

import { useEffect, useMemo, useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [resolvedUrl, setResolvedUrl] = useState(url);

  useEffect(() => {
    if (typeof window !== 'undefined' && !url) {
      setResolvedUrl(window.location.href);
    }
  }, [url]);

  const xShareUrl = useMemo(() => {
    const shareUrl = new URL('https://twitter.com/intent/tweet');
    shareUrl.searchParams.set('text', title);
    shareUrl.searchParams.set('url', resolvedUrl || window.location.href);
    return shareUrl.toString();
  }, [resolvedUrl, title]);

  const handleShareX = () => {
    window.open(xShareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShareX}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        aria-label="Xで共有する"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
          <path d="M18.9 2h3.5l-7.7 8.8L22.7 22h-6.9l-5.4-7.4L4.4 22H.9l8.3-9.4L1.3 2h7.1l4.9 6.8L18.9 2Zm-1.2 18h1.9L7.1 3.9H5.1L17.7 20Z" />
        </svg>
        Xで共有
      </button>
    </div>
  );
}
