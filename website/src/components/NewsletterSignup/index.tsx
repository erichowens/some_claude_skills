import React, { useState } from 'react';
import styles from './styles.module.css';

interface NewsletterSignupProps {
  variant?: 'inline' | 'popup' | 'footer';
  source?: string;
}

export default function NewsletterSignup({
  variant = 'inline',
  source = 'unknown'
}: NewsletterSignupProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // Buttondown API endpoint
      // Note: You'll need to replace BUTTONDOWN_USERNAME with your actual username
      // and set up the API on your backend or use their embed form
      const response = await fetch('https://buttondown.com/api/emails/embed-subscribe/someclaudeskills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          tag: source,
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks! Check your email to confirm.');
        setEmail('');

        // Track with Plausible if available
        if (typeof window !== 'undefined' && (window as any).plausible) {
          (window as any).plausible('Newsletter Signup', { props: { source } });
        }
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Try again?');
    }
  };

  if (variant === 'footer') {
    return (
      <div className={styles.footerSignup}>
        <h4 className={styles.footerTitle}>Stay Updated</h4>
        <p className={styles.footerDesc}>New skills, tips, and Claude Code updates</p>
        <form onSubmit={handleSubmit} className={styles.footerForm}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={styles.footerInput}
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            className={styles.footerButton}
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? '...' : status === 'success' ? '✓' : 'Subscribe'}
          </button>
        </form>
        {message && (
          <p className={`${styles.message} ${styles[status]}`}>{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.signup} ${styles[variant]}`}>
      <div className={styles.content}>
        <div className={styles.iconRow}>
          <img
            src="/img/newsletter-hero.svg"
            alt="Newsletter"
            className={styles.icon}
            width={64}
            height={64}
          />
          <h3 className={styles.title}>Get New Skills First</h3>
        </div>
        <p className={styles.description}>
          Join 100+ developers getting weekly Claude Code tips and new skill announcements.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="developer@company.com"
            className={styles.input}
            disabled={status === 'loading' || status === 'success'}
          />
          <button
            type="submit"
            className={styles.button}
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Subscribing...' : status === 'success' ? '✓ Subscribed!' : 'Subscribe'}
          </button>
        </form>
        {message && (
          <p className={`${styles.message} ${styles[status]}`}>{message}</p>
        )}
        <p className={styles.privacy}>No spam. Unsubscribe anytime. ~2 emails/month.</p>
      </div>
    </div>
  );
}
