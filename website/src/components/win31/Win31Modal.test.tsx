import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Win31Modal } from './Win31Modal';

describe('Win31Modal', () => {
  it('does not render when closed', () => {
    render(
      <Win31Modal isOpen={false} onClose={vi.fn()} title="Test">
        Content
      </Win31Modal>
    );

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <Win31Modal isOpen={true} onClose={vi.fn()} title="Test Title">
        Modal Content
      </Win31Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal>
    );

    // Click overlay (role="presentation")
    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal>
    );

    // Click modal dialog
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal>
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom icon', () => {
    render(
      <Win31Modal isOpen={true} onClose={vi.fn()} title="Test" icon="🎯">
        Content
      </Win31Modal>
    );

    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Win31Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Test"
        showCloseButton={false}
      >
        Content
      </Win31Modal>
    );

    expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
  });

  it('locks body scroll when open', () => {
    const { rerender } = render(
      <Win31Modal isOpen={true} onClose={vi.fn()} title="Test">
        Content
      </Win31Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    // Close modal
    rerender(
      <Win31Modal isOpen={false} onClose={vi.fn()} title="Test">
        Content
      </Win31Modal>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('has correct accessibility attributes', () => {
    render(
      <Win31Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
        Content
      </Win31Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');

    const title = screen.getByText('Accessible Modal');
    expect(title).toHaveAttribute('id', 'modal-title');
  });
});
