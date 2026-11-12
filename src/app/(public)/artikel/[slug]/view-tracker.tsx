'use client';

import * as React from 'react';

export function ViewTracker({ slug }: { slug: string }) {
  React.useEffect(() => {
    try {
      const storageKey = `gibei_viewed_${slug}`;
      const alreadyViewed = sessionStorage.getItem(storageKey);
      if (!alreadyViewed) {
        sessionStorage.setItem(storageKey, 'true');
        fetch(`/api/artikel/${slug}/view`, { method: 'POST' }).catch(() => {
          // ignore tracking failure
        });
      }
    } catch {
      // sessionStorage might be restricted in private browsing
    }
  }, [slug]);

  return null;
}

