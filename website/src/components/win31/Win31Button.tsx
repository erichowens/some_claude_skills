import React from 'react';
import styles from './Win31Button.module.css';

export interface Win31ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

/**
 * Windows 3.1 style button with 3D beveled appearance
 *
 * Features:
 * - 3D outset border (raised)
 * - Inverted border on click (pressed)
 * - Grayscale color palette
 * - Monospace font
 *
 * @example
 * ```tsx
 * <Win31Button onClick={handleClick}>Click Me</Win31Button>
 * <Win31Button variant="primary" size="large">Primary</Win31Button>
 * <Win31Button disabled>Disabled</Win31Button>
 * ```
 */
export const Win31Button: React.FC<Win31ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'medium',
  type = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
