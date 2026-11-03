import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`text-xs leading-relaxed text-glow-cocoa ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm sm:text-base font-black text-purple-950 mt-3 mb-2 pb-1 border-b border-purple-200/80 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs sm:text-sm font-black text-purple-900 mt-3 mb-1.5 pb-0.5 border-b border-purple-100 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-[13px] font-black text-purple-900 mt-3 mb-1.5 pt-1.5 border-t border-purple-100/80 first:mt-0 first:pt-0 first:border-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-purple-800 mt-2 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-glow-cocoa">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-purple-950">{children}</strong>,
          em: ({ children }) => <em className="italic text-glow-cocoa">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 my-1.5 last:mb-0 marker:text-purple-400 [&_ul]:list-[circle] [&_ul]:pl-3.5 [&_ul]:my-1 [&_ul]:marker:text-purple-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 my-1.5 last:mb-0 marker:text-purple-500 font-semibold [&_ul]:font-normal [&_ol]:pl-3.5 [&_ol]:my-1">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5 font-medium">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-purple-400 pl-3 py-1 my-1.5 text-purple-950 bg-purple-50/60 rounded-r-xl italic font-medium">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-purple-100/80 font-mono text-[11px] text-purple-900 font-semibold border border-purple-200/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                className="p-3 rounded-2xl bg-stone-900 text-purple-100 text-[11px] font-mono overflow-x-auto my-2 border border-stone-800"
                {...props}
              >
                <code>{children}</code>
              </pre>
            );
          },
          hr: () => <hr className="my-2.5 border-purple-100" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl border border-purple-200 shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-purple-100/80 text-purple-950 font-bold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-purple-100 bg-white">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-purple-50/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-1.5 font-bold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-1.5">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
