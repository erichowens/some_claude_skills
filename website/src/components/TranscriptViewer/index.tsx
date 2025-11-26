import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './styles.module.css';

interface TranscriptViewerProps {
  transcriptContent: string;
  title?: string;
}

export default function TranscriptViewer({
  transcriptContent,
  title = 'Conversation Transcript'
}: TranscriptViewerProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.transcriptViewer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>{title}</h2>
          <span className={styles.badge}>📝 Full Transcript</span>
        </div>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse transcript' : 'Expand transcript'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      <div className={`${styles.content} ${isExpanded ? styles.expanded : styles.collapsed}`}>
        <div className={styles.markdown}>
          <ReactMarkdown
            components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vs}
                  language={match[1]}
                  PreTag="div"
                  className={styles.codeBlock}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              );
            },
            h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
            h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
            h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
            h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
            p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
            ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
            ol: ({ children }) => <ol className={styles.orderedList}>{children}</ol>,
            blockquote: ({ children }) => (
              <blockquote className={styles.blockquote}>{children}</blockquote>
            ),
            strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
            em: ({ children }) => <em className={styles.emphasis}>{children}</em>,
          }}
          >
            {transcriptContent}
          </ReactMarkdown>
        </div>
      </div>

      {!isExpanded && (
        <div className={styles.expandPrompt}>
          <button
            className={styles.expandButton}
            onClick={() => setIsExpanded(true)}
          >
            Read Full Transcript →
          </button>
        </div>
      )}
    </div>
  );
}
