import { Badge } from '@/components/ui/badge';
import type { ArticleStatus, GalleryStatus } from '@/types';

export const ARTICLE_STATUS_LABEL: Record<ArticleStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="outline" className="bg-slate-50 text-slate-600">Draft</Badge>;
    case 'PENDING_REVIEW':
      return (
        <Badge variant="gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          Pending Review
        </Badge>
      );
    case 'PUBLISHED':
      return <Badge variant="success">Published</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">Rejected</Badge>;
  }
}

export function GalleryStatusBadge({ status }: { status: GalleryStatus }) {
  return status === 'PUBLISHED' ? (
    <Badge variant="success">Published</Badge>
  ) : (
    <Badge variant="gold">
      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
      Pending
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="success">Aktif</Badge>
  ) : (
    <Badge variant="outline" className="bg-slate-50 text-slate-500">Nonaktif</Badge>
  );
}

