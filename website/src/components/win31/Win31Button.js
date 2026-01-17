"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Win31Button = void 0;
var react_1 = require("react");
var Win31Button_module_css_1 = require("./Win31Button.module.css");
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
var Win31Button = function (_a) {
    var children = _a.children, onClick = _a.onClick, _b = _a.disabled, disabled = _b === void 0 ? false : _b, _c = _a.variant, variant = _c === void 0 ? 'default' : _c, _d = _a.size, size = _d === void 0 ? 'medium' : _d, _e = _a.type, type = _e === void 0 ? 'button' : _e, _f = _a.className, className = _f === void 0 ? '' : _f;
    return (<button type={type} onClick={onClick} disabled={disabled} className={"".concat(Win31Button_module_css_1.default.button, " ").concat(Win31Button_module_css_1.default[variant], " ").concat(Win31Button_module_css_1.default[size], " ").concat(className)} aria-disabled={disabled}>
      {children}
    </button>);
};
exports.Win31Button = Win31Button;
