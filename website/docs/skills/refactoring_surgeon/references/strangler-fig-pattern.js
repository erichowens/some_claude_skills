// Strangler Fig Pattern
// Gradually replace legacy code without big-bang rewrites
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// =============================================================================
// THE PROBLEM: Monolithic Legacy Code
// =============================================================================
// ❌ Monolithic order processor - 500+ lines of tangled logic
var LegacyOrderProcessor = /** @class */ (function () {
    function LegacyOrderProcessor() {
    }
    LegacyOrderProcessor.prototype.processOrder = function (orderData) {
        // Validation mixed with business logic
        if (!orderData.items)
            throw new Error('No items');
        if (!orderData.customer)
            throw new Error('No customer');
        // Pricing calculation intertwined
        var total = 0;
        for (var _i = 0, _a = orderData.items; _i < _a.length; _i++) {
            var item = _a[_i];
            // Complex pricing rules embedded here
            var price = item.basePrice;
            if (orderData.customer.type === 'wholesale') {
                price *= 0.8;
            }
            if (item.quantity > 10) {
                price *= 0.95;
            }
            total += price * item.quantity;
        }
        // Inventory check with database calls
        // Payment processing with external API calls
        // Shipping calculation with carrier integration
        // Email notification with template rendering
        // Audit logging
        // ... 400 more lines of tightly coupled code
        return { orderId: 'generated', total: total };
    };
    return LegacyOrderProcessor;
}());
// Problems:
// 1. Can't test individual components
// 2. Can't modify one thing without risk to everything
// 3. Can't understand what it does without reading all 500 lines
// 4. Can't rewrite all at once (too risky)
// =============================================================================
// STRANGLER FIG PATTERN: Step-by-Step Migration
// =============================================================================
// Step 1: Create a facade that delegates to legacy
// -------------------------------------------------
var OrderProcessorV1 = /** @class */ (function () {
    function OrderProcessorV1() {
        this.legacy = new LegacyOrderProcessor();
    }
    OrderProcessorV1.prototype.processOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var legacyResult;
            return __generator(this, function (_a) {
                legacyResult = this.legacy.processOrder(order);
                return [2 /*return*/, this.adaptLegacyResult(legacyResult)];
            });
        });
    };
    OrderProcessorV1.prototype.adaptLegacyResult = function (legacy) {
        return {
            orderId: legacy.orderId,
            total: legacy.total,
            status: 'completed',
        };
    };
    return OrderProcessorV1;
}());
// Step 2: Extract first component (validation)
// -------------------------------------------------
var OrderValidator = /** @class */ (function () {
    function OrderValidator() {
    }
    OrderValidator.prototype.validate = function (order) {
        var _a, _b, _c;
        var errors = [];
        if (!((_a = order.items) === null || _a === void 0 ? void 0 : _a.length)) {
            errors.push('Order must have items');
        }
        if (!order.customer) {
            errors.push('Order must have customer');
        }
        if (!((_b = order.customer) === null || _b === void 0 ? void 0 : _b.email)) {
            errors.push('Customer must have email');
        }
        // Can add new validations without touching legacy
        if ((_c = order.items) === null || _c === void 0 ? void 0 : _c.some(function (item) { return item.quantity <= 0; })) {
            errors.push('All items must have positive quantity');
        }
        return {
            valid: errors.length === 0,
            errors: errors,
        };
    };
    return OrderValidator;
}());
var OrderProcessorV2 = /** @class */ (function () {
    function OrderProcessorV2() {
        this.legacy = new LegacyOrderProcessor();
        this.validator = new OrderValidator(); // NEW!
    }
    OrderProcessorV2.prototype.processOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, legacyResult;
            return __generator(this, function (_a) {
                validation = this.validator.validate(order);
                if (!validation.valid) {
                    throw new ValidationError(validation.errors);
                }
                legacyResult = this.legacy.processOrder(order);
                return [2 /*return*/, this.adaptLegacyResult(legacyResult)];
            });
        });
    };
    OrderProcessorV2.prototype.adaptLegacyResult = function (legacy) {
        return {
            orderId: legacy.orderId,
            total: legacy.total,
            status: 'completed',
        };
    };
    return OrderProcessorV2;
}());
var PricingService = /** @class */ (function () {
    function PricingService() {
    }
    PricingService.prototype.calculate = function (order) {
        var subtotal = this.calculateSubtotal(order);
        var discount = this.calculateDiscount(order, subtotal);
        var tax = this.calculateTax(subtotal - discount);
        var shipping = this.calculateShipping(order);
        return {
            subtotal: subtotal,
            tax: tax,
            shipping: shipping,
            discount: discount,
            total: subtotal - discount + tax + shipping,
        };
    };
    PricingService.prototype.calculateSubtotal = function (order) {
        return order.items.reduce(function (sum, item) { return sum + item.price * item.quantity; }, 0);
    };
    PricingService.prototype.calculateDiscount = function (order, subtotal) {
        // Wholesale discount
        if (order.customer.type === 'wholesale') {
            return subtotal * 0.2;
        }
        // Volume discount
        var totalItems = order.items.reduce(function (sum, i) { return sum + i.quantity; }, 0);
        if (totalItems > 10) {
            return subtotal * 0.05;
        }
        return 0;
    };
    PricingService.prototype.calculateTax = function (taxableAmount) {
        return taxableAmount * 0.08;
    };
    PricingService.prototype.calculateShipping = function (order) {
        var weight = order.items.reduce(function (sum, i) { return sum + (i.weight || 0) * i.quantity; }, 0);
        if (weight === 0)
            return 0;
        if (weight < 5)
            return 5.99;
        if (weight < 20)
            return 12.99;
        return 24.99;
    };
    return PricingService;
}());
var OrderProcessorV3 = /** @class */ (function () {
    function OrderProcessorV3() {
        this.legacy = new LegacyOrderProcessor();
        this.validator = new OrderValidator();
        this.pricingService = new PricingService(); // NEW!
    }
    OrderProcessorV3.prototype.processOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, pricing, legacyResult;
            return __generator(this, function (_a) {
                validation = this.validator.validate(order);
                if (!validation.valid) {
                    throw new ValidationError(validation.errors);
                }
                pricing = this.pricingService.calculate(order);
                legacyResult = this.legacy.processOrderWithPricing(order, pricing);
                return [2 /*return*/, this.adaptLegacyResult(legacyResult, pricing)];
            });
        });
    };
    OrderProcessorV3.prototype.adaptLegacyResult = function (legacy, pricing) {
        return {
            orderId: legacy.orderId,
            total: pricing.total,
            status: 'completed',
        };
    };
    return OrderProcessorV3;
}());
// Step 4: Continue extracting until legacy is gone
// -------------------------------------------------
// Fully migrated - no more legacy!
var OrderProcessor = /** @class */ (function () {
    function OrderProcessor(validator, pricingService, inventoryService, paymentService, shippingService, notificationService, auditService) {
        this.validator = validator;
        this.pricingService = pricingService;
        this.inventoryService = inventoryService;
        this.paymentService = paymentService;
        this.shippingService = shippingService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }
    OrderProcessor.prototype.processOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var validation, pricing, inventoryReservation, payment, shipping, orderResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validation = this.validator.validate(order);
                        if (!validation.valid) {
                            throw new ValidationError(validation.errors);
                        }
                        pricing = this.pricingService.calculate(order);
                        return [4 /*yield*/, this.inventoryService.reserve(order.items)];
                    case 1:
                        inventoryReservation = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 10]);
                        return [4 /*yield*/, this.paymentService.charge(order.customer, pricing.total)];
                    case 3:
                        payment = _a.sent();
                        return [4 /*yield*/, this.shippingService.schedule(order)];
                    case 4:
                        shipping = _a.sent();
                        return [4 /*yield*/, this.createOrder(order, pricing, payment, shipping)];
                    case 5:
                        orderResult = _a.sent();
                        // Send confirmation
                        return [4 /*yield*/, this.notificationService.sendConfirmation(order.customer, orderResult)];
                    case 6:
                        // Send confirmation
                        _a.sent();
                        // Audit log
                        return [4 /*yield*/, this.auditService.log('order_created', orderResult)];
                    case 7:
                        // Audit log
                        _a.sent();
                        return [2 /*return*/, orderResult];
                    case 8:
                        error_1 = _a.sent();
                        // Release inventory on failure
                        return [4 /*yield*/, this.inventoryService.release(inventoryReservation)];
                    case 9:
                        // Release inventory on failure
                        _a.sent();
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    OrderProcessor.prototype.createOrder = function (order, pricing, payment, shipping) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        orderId: generateOrderId(),
                        total: pricing.total,
                        status: 'confirmed',
                        paymentId: payment.transactionId,
                        trackingNumber: shipping.trackingNumber,
                    }];
            });
        });
    };
    return OrderProcessor;
}());
// =============================================================================
// BRANCH BY ABSTRACTION: Feature Flag Approach
// =============================================================================
// Use feature flags to safely switch between old and new
var OrderProcessorWithFeatureFlag = /** @class */ (function () {
    function OrderProcessorWithFeatureFlag(legacy, newProcessor, featureFlags) {
        this.legacy = legacy;
        this.newProcessor = newProcessor;
        this.featureFlags = featureFlags;
    }
    OrderProcessorWithFeatureFlag.prototype.processOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var useNewProcessor, legacyResult;
            return __generator(this, function (_a) {
                useNewProcessor = this.featureFlags.isEnabled('new_order_processor', { customerId: order.customer.id });
                if (useNewProcessor) {
                    return [2 /*return*/, this.newProcessor.processOrder(order)];
                }
                else {
                    legacyResult = this.legacy.processOrder(order);
                    return [2 /*return*/, this.adaptResult(legacyResult)];
                }
                return [2 /*return*/];
            });
        });
    };
    OrderProcessorWithFeatureFlag.prototype.adaptResult = function (legacy) {
        return {
            orderId: legacy.orderId,
            total: legacy.total,
            status: 'completed',
        };
    };
    return OrderProcessorWithFeatureFlag;
}());
// =============================================================================
// PARALLEL RUN: Verify New System
// =============================================================================
// Run both systems and compare results (shadow mode)
var OrderProcessorParallelRun = /** @class */ (function () {
    function OrderProcessorParallelRun(legacy, newProcessor, comparisonLogger) {
        this.legacy = legacy;
        this.newProcessor = newProcessor;
        this.comparisonLogger = comparisonLogger;
    }
    OrderProcessorParallelRun.prototype.processOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var legacyResult, newResult, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        legacyResult = this.legacy.processOrder(order);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.newProcessor.processOrderDryRun(order)];
                    case 2:
                        newResult = _a.sent();
                        // Log comparison for analysis
                        this.comparisonLogger.logComparison({
                            orderId: legacyResult.orderId,
                            legacyTotal: legacyResult.total,
                            newTotal: newResult.total,
                            match: Math.abs(legacyResult.total - newResult.total) < 0.01,
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.comparisonLogger.logError({
                            orderId: legacyResult.orderId,
                            error: error_2.message,
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/, this.adaptResult(legacyResult)];
                }
            });
        });
    };
    OrderProcessorParallelRun.prototype.adaptResult = function (legacy) {
        return {
            orderId: legacy.orderId,
            total: legacy.total,
            status: 'completed',
        };
    };
    return OrderProcessorParallelRun;
}());
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(errors) {
        var _this = _super.call(this, errors.join(', ')) || this;
        _this.errors = errors;
        _this.name = 'ValidationError';
        return _this;
    }
    return ValidationError;
}(Error));
