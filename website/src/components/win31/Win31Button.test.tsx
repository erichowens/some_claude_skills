import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Win31Button } from './Win31Button';

describe('Win31Button', () => {
  it('renders with children', () => {
    render(<Win31Button>Click Me</Win31Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Win31Button onClick={handleClick}>Click</Win31Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Win31Button onClick={handleClick} disabled>Click</Win31Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled attribute when disabled', () => {
    render(<Win31Button disabled>Disabled</Win31Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('renders with default variant', () => {
    const { container } = render(<Win31Button>Default</Win31Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('default');
  });

  it('renders with primary variant', () => {
    const { container } = render(<Win31Button variant="primary">Primary</Win31Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('primary');
  });

  it('renders with danger variant', () => {
    const { container } = render(<Win31Button variant="danger">Danger</Win31Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('danger');
  });

  it('renders with different sizes', () => {
    const { container: smallContainer } = render(<Win31Button size="small">Small</Win31Button>);
    const { container: mediumContainer } = render(<Win31Button size="medium">Medium</Win31Button>);
    const { container: largeContainer } = render(<Win31Button size="large">Large</Win31Button>);

    expect(smallContainer.querySelector('button')?.className).toContain('small');
    expect(mediumContainer.querySelector('button')?.className).toContain('medium');
    expect(largeContainer.querySelector('button')?.className).toContain('large');
  });
});
