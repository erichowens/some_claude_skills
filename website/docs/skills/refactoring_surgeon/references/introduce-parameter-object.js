// Introduce Parameter Object
// Replace long parameter lists with structured objects
// =============================================================================
// BEFORE: Long parameter list
// =============================================================================
// ❌ Long parameter list - hard to read, easy to make mistakes
function searchProductsBefore(query, category, minPrice, maxPrice, inStock, sortBy, sortOrder, page, pageSize) {
    // Implementation...
    return [];
}
// Calling code is hard to read and error-prone
var productsBefore = searchProductsBefore('laptop', // query
'electronics', // category
500, // minPrice? maxPrice? Who knows!
2000, // Is this min or max?
true, // What is this boolean?
'price', // sortBy
'asc', // sortOrder
1, // page
20 // pageSize
);
// ✅ Clean function signature
function searchProducts(criteria, options) {
    if (options === void 0) { options = {}; }
    // Destructure with defaults
    var _a = options.sortBy, sortBy = _a === void 0 ? 'relevance' : _a, _b = options.sortOrder, sortOrder = _b === void 0 ? 'desc' : _b, _c = options.pagination, pagination = _c === void 0 ? { page: 1, pageSize: 20 } : _c;
    // Implementation uses clear, named properties
    var results = findProducts(criteria.query);
    if (criteria.category) {
        results = results.filter(function (p) { return p.category === criteria.category; });
    }
    if (criteria.priceRange) {
        var _d = criteria.priceRange, _e = _d.min, min_1 = _e === void 0 ? 0 : _e, _f = _d.max, max_1 = _f === void 0 ? Infinity : _f;
        results = results.filter(function (p) { return p.price >= min_1 && p.price <= max_1; });
    }
    if (criteria.inStockOnly) {
        results = results.filter(function (p) { return p.inStock; });
    }
    // Sort and paginate
    results = sortProducts(results, sortBy, sortOrder);
    var paged = paginateResults(results, pagination);
    return paged;
}
// ✅ Calling code is self-documenting
var products = searchProducts({
    query: 'laptop',
    category: 'electronics',
    priceRange: { min: 500, max: 2000 },
    inStockOnly: true,
}, {
    sortBy: 'price',
    sortOrder: 'asc',
    pagination: { page: 1, pageSize: 20 },
});
// ✅ Easy to use partial criteria
var simpleSearch = searchProducts({ query: 'keyboard' });
var categoryBrowse = searchProducts({ query: '', category: 'monitors' }, { sortBy: 'rating' });
// =============================================================================
// Builder Pattern for Complex Objects
// =============================================================================
// For even more complex scenarios, use a builder
var ProductSearchBuilder = /** @class */ (function () {
    function ProductSearchBuilder() {
        this.criteria = { query: '' };
        this.options = {};
    }
    ProductSearchBuilder.prototype.query = function (query) {
        this.criteria.query = query;
        return this;
    };
    ProductSearchBuilder.prototype.category = function (category) {
        this.criteria.category = category;
        return this;
    };
    ProductSearchBuilder.prototype.priceRange = function (min, max) {
        this.criteria.priceRange = { min: min, max: max };
        return this;
    };
    ProductSearchBuilder.prototype.inStockOnly = function () {
        this.criteria.inStockOnly = true;
        return this;
    };
    ProductSearchBuilder.prototype.sortBy = function (field, order) {
        if (order === void 0) { order = 'desc'; }
        this.options.sortBy = field;
        this.options.sortOrder = order;
        return this;
    };
    ProductSearchBuilder.prototype.page = function (page, pageSize) {
        if (pageSize === void 0) { pageSize = 20; }
        this.options.pagination = { page: page, pageSize: pageSize };
        return this;
    };
    ProductSearchBuilder.prototype.execute = function () {
        return searchProducts(this.criteria, this.options);
    };
    return ProductSearchBuilder;
}());
// ✅ Fluent interface for complex searches
var builderSearch = new ProductSearchBuilder()
    .query('laptop')
    .category('electronics')
    .priceRange(500, 2000)
    .inStockOnly()
    .sortBy('price', 'asc')
    .page(1, 20)
    .execute();
// =============================================================================
// Validation with Parameter Objects
// =============================================================================
// Parameter objects make validation cleaner too
function validateSearchCriteria(criteria) {
    var _a;
    if (!criteria.query && !criteria.category) {
        throw new Error('Must provide query or category');
    }
    if (criteria.priceRange) {
        var _b = criteria.priceRange, _c = _b.min, min = _c === void 0 ? 0 : _c, _d = _b.max, max = _d === void 0 ? Infinity : _d;
        if (min < 0)
            throw new Error('Min price cannot be negative');
        if (max < min)
            throw new Error('Max price must be >= min price');
    }
    if (((_a = criteria.rating) === null || _a === void 0 ? void 0 : _a.min) !== undefined) {
        if (criteria.rating.min < 0 || criteria.rating.min > 5) {
            throw new Error('Rating must be between 0 and 5');
        }
    }
}
