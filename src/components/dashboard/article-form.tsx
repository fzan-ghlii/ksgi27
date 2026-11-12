'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, FileText, Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Article, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Select, Textarea } from '@/components/ui/form-controls';
import { ImageUrlInput, IMAGE_HELP } from '@/components/shared/image-inputs';
import { MarkdownRenderer } from '@/components/shared/markdown';
import { ARTICLE_CATEGORIES, ArticleCategory, ArticleInputSchema } from '@/lib/schemas/content';
import { canPublishArticleDirectly, canSetArticleFeatured } from '@/lib/auth/permissions';
import { slugify } from '@/lib/utils/content';
import { apiFetch, zodFieldErrors } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface ArticleFormProps {
  user: UserProfile;
  initialArticle?: Article;
}

export function ArticleForm({ user, initialArticle }: ArticleFormProps) {
  const router = useRouter();
  const editing = !!initialArticle;
  const canPublish = canPublishArticleDirectly(user);
  const canFeature = canSetArticleFeatured(user);

  const [title, setTitle] = React.useState(initialArticle?.title ?? '');
  const [slug, setSlug] = React.useState(initialArticle?.slug ?? '');
  const [autoSlug, setAutoSlug] = React.useState(!initialArticle);
  const [category, setCategory] = React.useState<ArticleCategory>(
    (initialArticle?.category as ArticleCategory) ?? 'Edukasi Dasar'
  );
  const [tagsInput, setTagsInput] = React.useState(initialArticle?.tags?.join(', ') ?? '');
  const [thumbnailUrl, setThumbnailUrl] = React.useState(initialArticle?.thumbnail_url ?? '');
  const [content, setContent] = React.useState(initialArticle?.content ?? '');
  const [isFeatured, setIsFeatured] = React.useState(initialArticle?.is_featured ?? false);

  const [activeTab, setActiveTab] = React.useState<'write' | 'preview'>('write');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submittingAction, setSubmittingAction] = React.useState<'draft' | 'submit' | 'publish' | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSave = async (action: 'draft' | 'submit' | 'publish') => {
    const rawTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      slug: slug.trim() || undefined,
      category,
      tags: rawTags,
      thumbnail_url: thumbnailUrl.trim() || undefined,
      content,
      is_featured: isFeatured,
      action,
    };

    const parsed = ArticleInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      toast.error('Mohon periksa kembali kolom formulir yang belum sesuai.');
      return;
    }
    setErrors({});

    try {
      setSubmittingAction(action);
      if (editing && initialArticle) {
        await apiFetch(`/api/articles/${initialArticle.id}`, {
          method: 'PATCH',
          body: parsed.data,
        });
        toast.success(
          action === 'publish'
            ? 'Artikel berhasil diterbitkan!'
            : action === 'submit'
            ? 'Artikel berhasil dikirim untuk review!'
            : 'Perubahan draf berhasil disimpan.'
        );
      } else {
        await apiFetch('/api/articles', {
          method: 'POST',
          body: parsed.data,
        });
        toast.success(
          action === 'publish'
            ? 'Artikel berhasil dibuat dan diterbitkan!'
            : action === 'submit'
            ? 'Artikel berhasil dibuat dan dikirim untuk review!'
            : 'Draf artikel baru berhasil disimpan.'
        );
      }
      router.push('/dashboard/artikel');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan artikel.');
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/artikel">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink">
              {editing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h1>
            <p className="text-xs text-ink-muted">
              {editing
                ? `Mengubah artikel "${initialArticle.title}"`
                : 'Publikasikan riset dan edukasi pasar modal untuk civitas kampus.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={submittingAction !== null}
          >
            {submittingAction === 'draft' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Simpan Draf
          </Button>

          <Button
            type="button"
            variant="cerulean"
            size="sm"
            className="gap-1.5"
            onClick={() => handleSave('submit')}
            disabled={submittingAction !== null}
          >
            {submittingAction === 'submit' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Kirim untuk Review
          </Button>

          {canPublish && (
            <Button
              type="button"
              variant="gold"
              size="sm"
              className="gap-1.5"
              onClick={() => handleSave('publish')}
              disabled={submittingAction !== null}
            >
              {submittingAction === 'publish' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Terbitkan Langsung
            </Button>
          )}
        </div>
      </div>

      {initialArticle?.review_note && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs space-y-1 text-rose-800">
          <strong className="font-bold flex items-center gap-1.5 text-sm">
            Catatan Revisi dari Reviewer:
          </strong>
          <p className="leading-relaxed">{initialArticle.review_note}</p>
        </div>
      )}

      {/* Main Grid: Metadata & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metadata Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bento-card p-5 space-y-4 bg-white border border-line">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider pb-2 border-b border-line">
              Informasi Publikasi
            </h3>

            <Field label="Kategori Artikel" htmlFor="category" error={errors.category} required>
              <Select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                disabled={submittingAction !== null}
              >
                {ARTICLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Tagar (Tags)"
              htmlFor="tags"
              error={errors.tags}
              hint="Pisahkan dengan tanda koma (maks. 8 tagar)"
            >
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="saham, ihsg, rdn, pemula"
                disabled={submittingAction !== null}
              />
            </Field>

            <Field label="Gambar Sampul" error={errors.thumbnail_url} hint={IMAGE_HELP}>
              <ImageUrlInput
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                placeholder="/gambar/artikel/nama-file.webp"
                disabled={submittingAction !== null}
              />
            </Field>

            {canFeature && (
              <label className="flex items-start gap-3 rounded-xl border border-line bg-surface/60 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-gold"
                  disabled={submittingAction !== null}
                />
                <span className="text-xs">
                  <strong className="block text-ink font-bold">Sorot sebagai Artikel Unggulan</strong>
                  <span className="text-ink-muted">Tampil besar di bagian atas halaman artikel publik.</span>
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Right: Title, Slug & Markdown Editor */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bento-card p-5 sm:p-6 space-y-4 bg-white border border-line">
            <Field label="Judul Artikel" htmlFor="title" error={errors.title} required>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Contoh: Mengenal Strategi Value Investing di Bursa Efek Indonesia"
                className="text-base font-bold h-12"
                disabled={submittingAction !== null}
              />
            </Field>

            <Field
              label="Slug URL"
              htmlFor="slug"
              error={errors.slug}
              hint={
                autoSlug
                  ? 'Slug diperbarui otomatis dari judul. Hilangkan centang jika ingin membuat custom URL.'
                  : 'Gunakan huruf kecil dan tanda hubung (-).'
              }
            >
              <div className="space-y-1.5">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="mengenal-strategi-value-investing"
                  disabled={submittingAction !== null}
                />
                <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => {
                      setAutoSlug(e.target.checked);
                      if (e.target.checked) setSlug(slugify(title));
                    }}
                    className="h-3.5 w-3.5 accent-cerulean"
                  />
                  <span>Sinkronkan slug otomatis dengan judul</span>
                </label>
              </div>
            </Field>

            {/* Markdown Tab Switcher */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <label className="text-sm font-semibold text-ink">
                  Konten Artikel (Markdown) <span className="text-rose-600">*</span>
                </label>

                <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-line text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5',
                      activeTab === 'write' ? 'bg-white shadow-xs text-ink' : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Tulis
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                      'px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5',
                      activeTab === 'preview' ? 'bg-white shadow-xs text-cerulean-dark' : 'text-ink-muted hover:text-ink'
                    )}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Pratinjau
                  </button>
                </div>
              </div>

              {errors.content && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {errors.content}
                </p>
              )}

              {activeTab === 'write' ? (
                <div className="space-y-1">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mulai tulis artikel Anda dengan Markdown... (Gunakan ## Subjudul, **tebal**, *miring*, > kutipan, - daftar poin)"
                    className="min-h-[420px] font-mono text-sm leading-relaxed"
                    disabled={submittingAction !== null}
                  />
                  <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
                    <span>Mendukung Markdown GFM (tabel, tautan, format teks, kutipan)</span>
                    <span>{content.trim().split(/\s+/).filter(Boolean).length} kata</span>
                  </div>
                </div>
              ) : (
                <div className="min-h-[420px] rounded-lg border border-line bg-surface/30 p-5 sm:p-6 overflow-y-auto max-h-[600px]">
                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <div className="text-sm text-ink-muted italic text-center py-12">
                      Belum ada teks yang ditulis untuk dipratinjau.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

