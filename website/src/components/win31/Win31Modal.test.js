"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var react_1 = require("@testing-library/react");
var Win31Modal_1 = require("./Win31Modal");
(0, vitest_1.describe)('Win31Modal', function () {
    (0, vitest_1.it)('does not render when closed', function () {
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={false} onClose={vitest_1.vi.fn()} title="Test">
        Content
      </Win31Modal_1.Win31Modal>);
        (0, vitest_1.expect)(react_1.screen.queryByText('Test')).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('renders when open', function () {
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={vitest_1.vi.fn()} title="Test Title">
        Modal Content
      </Win31Modal_1.Win31Modal>);
        (0, vitest_1.expect)(react_1.screen.getByText('Test Title')).toBeInTheDocument();
        (0, vitest_1.expect)(react_1.screen.getByText('Modal Content')).toBeInTheDocument();
    });
    (0, vitest_1.it)('calls onClose when overlay is clicked', function () {
        var handleClose = vitest_1.vi.fn();
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal_1.Win31Modal>);
        // Click overlay (role="presentation")
        var overlay = react_1.screen.getByRole('presentation');
        react_1.fireEvent.click(overlay);
        (0, vitest_1.expect)(handleClose).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('does not call onClose when modal content is clicked', function () {
        var handleClose = vitest_1.vi.fn();
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal_1.Win31Modal>);
        // Click modal dialog
        var dialog = react_1.screen.getByRole('dialog');
        react_1.fireEvent.click(dialog);
        (0, vitest_1.expect)(handleClose).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('calls onClose when close button is clicked', function () {
        var handleClose = vitest_1.vi.fn();
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal_1.Win31Modal>);
        var closeButton = react_1.screen.getByLabelText('Close');
        react_1.fireEvent.click(closeButton);
        (0, vitest_1.expect)(handleClose).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('calls onClose when Escape key is pressed', function () {
        var handleClose = vitest_1.vi.fn();
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Win31Modal_1.Win31Modal>);
        react_1.fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
        (0, vitest_1.expect)(handleClose).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('renders custom icon', function () {
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={vitest_1.vi.fn()} title="Test" icon="🎯">
        Content
      </Win31Modal_1.Win31Modal>);
        (0, vitest_1.expect)(react_1.screen.getByText('🎯')).toBeInTheDocument();
    });
    (0, vitest_1.it)('hides close button when showCloseButton is false', function () {
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={vitest_1.vi.fn()} title="Test" showCloseButton={false}>
        Content
      </Win31Modal_1.Win31Modal>);
        (0, vitest_1.expect)(react_1.screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });
    (0, vitest_1.it)('locks body scroll when open', function () {
        var rerender = (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={vitest_1.vi.fn()} title="Test">
        Content
      </Win31Modal_1.Win31Modal>).rerender;
        (0, vitest_1.expect)(document.body.style.overflow).toBe('hidden');
        // Close modal
        rerender(<Win31Modal_1.Win31Modal isOpen={false} onClose={vitest_1.vi.fn()} title="Test">
        Content
      </Win31Modal_1.Win31Modal>);
        (0, vitest_1.expect)(document.body.style.overflow).toBe('');
    });
    (0, vitest_1.it)('has correct accessibility attributes', function () {
        (0, react_1.render)(<Win31Modal_1.Win31Modal isOpen={true} onClose={vitest_1.vi.fn()} title="Accessible Modal">
        Content
      </Win31Modal_1.Win31Modal>);
        var dialog = react_1.screen.getByRole('dialog');
        (0, vitest_1.expect)(dialog).toHaveAttribute('aria-modal', 'true');
        (0, vitest_1.expect)(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
        var title = react_1.screen.getByText('Accessible Modal');
        (0, vitest_1.expect)(title).toHaveAttribute('id', 'modal-title');
    });
});
