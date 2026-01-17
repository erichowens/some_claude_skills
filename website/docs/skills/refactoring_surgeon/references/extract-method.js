// Extract Method Refactoring Example
// Transform long methods into focused, single-responsibility functions
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// =============================================================================
// BEFORE: Long method with multiple responsibilities
// =============================================================================
// ❌ Long method with multiple responsibilities
function processOrderBefore(order) {
    // Validate order
    if (!order.items || order.items.length === 0) {
        throw new Error('Order must have items');
    }
    if (!order.customer) {
        throw new Error('Order must have customer');
    }
    if (!order.customer.email) {
        throw new Error('Customer must have email');
    }
    // Calculate totals
    var subtotal = 0;
    for (var _i = 0, _a = order.items; _i < _a.length; _i++) {
        var item = _a[_i];
        subtotal += item.price * item.quantity;
    }
    var tax = subtotal * 0.08;
    var shipping = subtotal > 100 ? 0 : 10;
    var total = subtotal + tax + shipping;
    // Apply discounts
    var discount = 0;
    if (order.customer.loyaltyTier === 'gold') {
        discount = total * 0.1;
    }
    else if (order.customer.loyaltyTier === 'silver') {
        discount = total * 0.05;
    }
    var finalTotal = total - discount;
    // Create order record
    var orderRecord = {
        id: generateId(),
        items: order.items,
        customer: order.customer,
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        discount: discount,
        total: finalTotal,
        status: 'pending',
        createdAt: new Date(),
    };
    // Send confirmation email
    var emailContent = "\n    Dear ".concat(order.customer.name, ",\n\n    Thank you for your order #").concat(orderRecord.id, ".\n\n    Items: ").concat(order.items.length, "\n    Subtotal: $").concat(subtotal.toFixed(2), "\n    Tax: $").concat(tax.toFixed(2), "\n    Shipping: $").concat(shipping.toFixed(2), "\n    Discount: -$").concat(discount.toFixed(2), "\n    Total: $").concat(finalTotal.toFixed(2), "\n\n    Best regards\n  ");
    sendEmail(order.customer.email, 'Order Confirmation', emailContent);
    return orderRecord;
}
// =============================================================================
// AFTER: Clean, single-responsibility functions
// =============================================================================
// ✅ Main orchestration function - reads like a story
function processOrder(order) {
    validateOrder(order);
    var pricing = calculatePricing(order);
    var discount = calculateLoyaltyDiscount(order.customer, pricing.total);
    var finalTotal = pricing.total - discount;
    var orderRecord = createOrderRecord(order, pricing, discount, finalTotal);
    sendOrderConfirmation(order.customer, orderRecord, pricing, discount);
    return orderRecord;
}
// ✅ Focused validation with custom error type
function validateOrder(order) {
    var _a;
    if (!((_a = order.items) === null || _a === void 0 ? void 0 : _a.length)) {
        throw new OrderValidationError('Order must have items');
    }
    if (!order.customer) {
        throw new OrderValidationError('Order must have customer');
    }
    if (!order.customer.email) {
        throw new OrderValidationError('Customer must have email');
    }
}
// ✅ Pricing calculation with extracted sub-functions
function calculatePricing(order) {
    var subtotal = calculateSubtotal(order.items);
    var tax = calculateTax(subtotal);
    var shipping = calculateShipping(subtotal);
    return {
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        total: subtotal + tax + shipping,
    };
}
// ✅ Pure function - easy to test
function calculateSubtotal(items) {
    return items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
}
// ✅ Constants replace magic numbers
function calculateTax(subtotal) {
    var TAX_RATE = 0.08;
    return subtotal * TAX_RATE;
}
// ✅ Business rules are clear
function calculateShipping(subtotal) {
    var FREE_SHIPPING_THRESHOLD = 100;
    var STANDARD_SHIPPING = 10;
    return subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}
// ✅ Lookup table replaces conditional chain
var LOYALTY_DISCOUNTS = {
    gold: 0.10,
    silver: 0.05,
    bronze: 0,
    none: 0,
};
function calculateLoyaltyDiscount(customer, total) {
    var _a;
    var discountRate = (_a = LOYALTY_DISCOUNTS[customer.loyaltyTier]) !== null && _a !== void 0 ? _a : 0;
    return total * discountRate;
}
// ✅ Factory function with clear parameters
function createOrderRecord(order, pricing, discount, finalTotal) {
    return __assign(__assign({ id: generateId(), items: order.items, customer: order.customer }, pricing), { discount: discount, total: finalTotal, status: 'pending', createdAt: new Date() });
}
// ✅ Email building extracted for testability
function sendOrderConfirmation(customer, orderRecord, pricing, discount) {
    var emailContent = buildOrderConfirmationEmail(customer, orderRecord, pricing, discount);
    sendEmail(customer.email, 'Order Confirmation', emailContent);
}
var OrderValidationError = /** @class */ (function (_super) {
    __extends(OrderValidationError, _super);
    function OrderValidationError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'OrderValidationError';
        return _this;
    }
    return OrderValidationError;
}(Error));
