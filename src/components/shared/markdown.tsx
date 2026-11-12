import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Render Markdown dengan aman: react-markdown tidak mengeksekusi HTML mentah
 * dan menyaring URL berbahaya (javascript:) secara bawaan.
 */
export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('prose-gibei', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//i.test(href);
            return (
              <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
                {children}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === 'string' ? src : undefined} alt={alt ?? ''} loading="lazy" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

