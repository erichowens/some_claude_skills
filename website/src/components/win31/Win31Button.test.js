"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var react_1 = require("@testing-library/react");
var Win31Button_1 = require("./Win31Button");
(0, vitest_1.describe)('Win31Button', function () {
    (0, vitest_1.it)('renders with children', function () {
        (0, react_1.render)(<Win31Button_1.Win31Button>Click Me</Win31Button_1.Win31Button>);
        (0, vitest_1.expect)(react_1.screen.getByText('Click Me')).toBeInTheDocument();
    });
    (0, vitest_1.it)('calls onClick when clicked', function () {
        var handleClick = vitest_1.vi.fn();
        (0, react_1.render)(<Win31Button_1.Win31Button onClick={handleClick}>Click</Win31Button_1.Win31Button>);
        react_1.fireEvent.click(react_1.screen.getByText('Click'));
        (0, vitest_1.expect)(handleClick).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('does not call onClick when disabled', function () {
        var handleClick = vitest_1.vi.fn();
        (0, react_1.render)(<Win31Button_1.Win31Button onClick={handleClick} disabled>Click</Win31Button_1.Win31Button>);
        react_1.fireEvent.click(react_1.screen.getByText('Click'));
        (0, vitest_1.expect)(handleClick).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('applies disabled attribute when disabled', function () {
        (0, react_1.render)(<Win31Button_1.Win31Button disabled>Disabled</Win31Button_1.Win31Button>);
        (0, vitest_1.expect)(react_1.screen.getByText('Disabled')).toBeDisabled();
    });
    (0, vitest_1.it)('renders with default variant', function () {
        var container = (0, react_1.render)(<Win31Button_1.Win31Button>Default</Win31Button_1.Win31Button>).container;
        var button = container.querySelector('button');
        (0, vitest_1.expect)(button === null || button === void 0 ? void 0 : button.className).toContain('default');
    });
    (0, vitest_1.it)('renders with primary variant', function () {
        var container = (0, react_1.render)(<Win31Button_1.Win31Button variant="primary">Primary</Win31Button_1.Win31Button>).container;
        var button = container.querySelector('button');
        (0, vitest_1.expect)(button === null || button === void 0 ? void 0 : button.className).toContain('primary');
    });
    (0, vitest_1.it)('renders with danger variant', function () {
        var container = (0, react_1.render)(<Win31Button_1.Win31Button variant="danger">Danger</Win31Button_1.Win31Button>).container;
        var button = container.querySelector('button');
        (0, vitest_1.expect)(button === null || button === void 0 ? void 0 : button.className).toContain('danger');
    });
    (0, vitest_1.it)('renders with different sizes', function () {
        var _a, _b, _c;
        var smallContainer = (0, react_1.render)(<Win31Button_1.Win31Button size="small">Small</Win31Button_1.Win31Button>).container;
        var mediumContainer = (0, react_1.render)(<Win31Button_1.Win31Button size="medium">Medium</Win31Button_1.Win31Button>).container;
        var largeContainer = (0, react_1.render)(<Win31Button_1.Win31Button size="large">Large</Win31Button_1.Win31Button>).container;
        (0, vitest_1.expect)((_a = smallContainer.querySelector('button')) === null || _a === void 0 ? void 0 : _a.className).toContain('small');
        (0, vitest_1.expect)((_b = mediumContainer.querySelector('button')) === null || _b === void 0 ? void 0 : _b.className).toContain('medium');
        (0, vitest_1.expect)((_c = largeContainer.querySelector('button')) === null || _c === void 0 ? void 0 : _c.className).toContain('large');
    });
});
