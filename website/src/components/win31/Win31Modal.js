"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Win31Modal = void 0;
var react_1 = require("react");
var react_dom_1 = require("react-dom");
var Win31Modal_module_css_1 = require("./Win31Modal.module.css");
/**
 * Windows 3.1 style modal dialog
 *
 * Features:
 * - Navy gradient title bar
 * - 3D beveled borders
 * - Portal rendering (outside DOM hierarchy)
 * - Escape key support
 * - Body scroll lock when open
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Win31Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Welcome"
 *   icon="📄"
 * >
 *   <p>Modal content here</p>
 * </Win31Modal>
 * ```
 */
var Win31Modal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, title = _a.title, children = _a.children, _b = _a.icon, icon = _b === void 0 ? '📄' : _b, _c = _a.showCloseButton, showCloseButton = _c === void 0 ? true : _c;
    var previousFocusRef = (0, react_1.useRef)(null);
    // Handle escape key
    (0, react_1.useEffect)(function () {
        if (!isOpen)
            return;
        var handleEscape = function (e) {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return function () { return document.removeEventListener('keydown', handleEscape); };
    }, [isOpen, onClose]);
    // Lock body scroll when modal is open
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            // Save current focus
            previousFocusRef.current = document.activeElement;
            // Lock scroll
            document.body.style.overflow = 'hidden';
            return function () {
                // Restore scroll
                document.body.style.overflow = '';
                // Restore focus
                if (previousFocusRef.current) {
                    previousFocusRef.current.focus();
                }
            };
        }
    }, [isOpen]);
    if (!isOpen)
        return null;
    var modalContent = (<div className={Win31Modal_module_css_1.default.overlay} onClick={onClose} role="presentation" aria-modal="true">
      <div className={Win31Modal_module_css_1.default.modal} onClick={function (e) { return e.stopPropagation(); }} role="dialog" aria-labelledby="modal-title">
        <div className={Win31Modal_module_css_1.default.titleBar}>
          <span className={Win31Modal_module_css_1.default.icon} aria-hidden="true">
            {icon}
          </span>
          <span className={Win31Modal_module_css_1.default.title} id="modal-title">
            {title}
          </span>
          {showCloseButton && (<button className={Win31Modal_module_css_1.default.closeButton} onClick={onClose} aria-label="Close">
              ×
            </button>)}
        </div>
        <div className={Win31Modal_module_css_1.default.content}>{children}</div>
      </div>
    </div>);
    // Render in portal (outside React root)
    return (0, react_dom_1.createPortal)(modalContent, document.body);
};
exports.Win31Modal = Win31Modal;
