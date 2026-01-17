// Replace Conditional with Polymorphism
// Transform type-checking switch/if statements into polymorphic classes
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
// =============================================================================
// BEFORE: Type checking with switch/if
// =============================================================================
// ❌ Type checking with switch/if - violates Open/Closed Principle
var EmployeeBefore = /** @class */ (function () {
    function EmployeeBefore() {
    }
    EmployeeBefore.prototype.calculatePay = function () {
        var _a, _b;
        switch (this.type) {
            case 'engineer':
                return this.baseSalary;
            case 'manager':
                return this.baseSalary + ((_a = this.teamSize) !== null && _a !== void 0 ? _a : 0) * 100;
            case 'salesperson':
                return this.baseSalary + ((_b = this.commission) !== null && _b !== void 0 ? _b : 0);
            default:
                throw new Error('Unknown employee type');
        }
    };
    EmployeeBefore.prototype.getTitle = function () {
        switch (this.type) {
            case 'engineer':
                return 'Software Engineer';
            case 'manager':
                return 'Engineering Manager';
            case 'salesperson':
                return 'Sales Representative';
            default:
                return 'Employee';
        }
    };
    return EmployeeBefore;
}());
// =============================================================================
// AFTER: Polymorphic solution
// =============================================================================
// ✅ Abstract base class defines the contract
var Employee = /** @class */ (function () {
    function Employee(baseSalary) {
        this.baseSalary = baseSalary;
    }
    // Shared behavior stays in base class
    Employee.prototype.getBaseSalary = function () {
        return this.baseSalary;
    };
    return Employee;
}());
// ✅ Each type is its own class with specific behavior
var Engineer = /** @class */ (function (_super) {
    __extends(Engineer, _super);
    function Engineer() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Engineer.prototype.calculatePay = function () {
        return this.baseSalary;
    };
    Engineer.prototype.getTitle = function () {
        return 'Software Engineer';
    };
    return Engineer;
}(Employee));
var Manager = /** @class */ (function (_super) {
    __extends(Manager, _super);
    function Manager(baseSalary, teamSize) {
        var _this = _super.call(this, baseSalary) || this;
        _this.teamSize = teamSize;
        return _this;
    }
    Manager.prototype.calculatePay = function () {
        var BONUS_PER_REPORT = 100;
        return this.baseSalary + this.teamSize * BONUS_PER_REPORT;
    };
    Manager.prototype.getTitle = function () {
        return 'Engineering Manager';
    };
    // Manager-specific methods
    Manager.prototype.getTeamSize = function () {
        return this.teamSize;
    };
    return Manager;
}(Employee));
var Salesperson = /** @class */ (function (_super) {
    __extends(Salesperson, _super);
    function Salesperson(baseSalary, commission) {
        var _this = _super.call(this, baseSalary) || this;
        _this.commission = commission;
        return _this;
    }
    Salesperson.prototype.calculatePay = function () {
        return this.baseSalary + this.commission;
    };
    Salesperson.prototype.getTitle = function () {
        return 'Sales Representative';
    };
    // Salesperson-specific methods
    Salesperson.prototype.getCommission = function () {
        return this.commission;
    };
    return Salesperson;
}(Employee));
var EmployeeFactory = /** @class */ (function () {
    function EmployeeFactory() {
    }
    EmployeeFactory.create = function (type, data) {
        var _a, _b;
        switch (type) {
            case 'engineer':
                return new Engineer(data.baseSalary);
            case 'manager':
                return new Manager(data.baseSalary, (_a = data.teamSize) !== null && _a !== void 0 ? _a : 0);
            case 'salesperson':
                return new Salesperson(data.baseSalary, (_b = data.commission) !== null && _b !== void 0 ? _b : 0);
            default:
                throw new Error("Unknown employee type: ".concat(type));
        }
    };
    return EmployeeFactory;
}());
// =============================================================================
// Adding New Types - The Payoff
// =============================================================================
// ✅ Adding a new type is EASY - just add a new class
var Contractor = /** @class */ (function (_super) {
    __extends(Contractor, _super);
    function Contractor(baseSalary, hourlyRate, hoursWorked) {
        var _this = _super.call(this, baseSalary) || this;
        _this.hourlyRate = hourlyRate;
        _this.hoursWorked = hoursWorked;
        return _this;
    }
    Contractor.prototype.calculatePay = function () {
        return this.hourlyRate * this.hoursWorked;
    };
    Contractor.prototype.getTitle = function () {
        return 'Independent Contractor';
    };
    return Contractor;
}(Employee));
// Just update the factory
var EmployeeFactoryV2 = /** @class */ (function () {
    function EmployeeFactoryV2() {
    }
    EmployeeFactoryV2.create = function (type, data) {
        var _a, _b;
        switch (type) {
            case 'engineer':
                return new Engineer(data.baseSalary);
            case 'manager':
                return new Manager(data.baseSalary, (_a = data.teamSize) !== null && _a !== void 0 ? _a : 0);
            case 'salesperson':
                return new Salesperson(data.baseSalary, (_b = data.commission) !== null && _b !== void 0 ? _b : 0);
            case 'contractor':
                return new Contractor(0, data.hourlyRate, data.hoursWorked);
            default:
                throw new Error("Unknown employee type: ".concat(type));
        }
    };
    return EmployeeFactoryV2;
}());
// =============================================================================
// Usage Examples
// =============================================================================
function demonstratePolymorphism() {
    // Create different employee types
    var employees = [
        EmployeeFactory.create('engineer', { baseSalary: 100000 }),
        EmployeeFactory.create('manager', { baseSalary: 120000, teamSize: 5 }),
        EmployeeFactory.create('salesperson', { baseSalary: 60000, commission: 25000 }),
    ];
    // Polymorphic behavior - no type checking needed!
    for (var _i = 0, employees_1 = employees; _i < employees_1.length; _i++) {
        var employee = employees_1[_i];
        console.log("".concat(employee.getTitle(), ": $").concat(employee.calculatePay()));
    }
    // Output:
    // Software Engineer: $100000
    // Engineering Manager: $120500
    // Sales Representative: $85000
    // Calculate total payroll - works with ANY employee type
    var totalPayroll = employees.reduce(function (sum, emp) { return sum + emp.calculatePay(); }, 0);
    console.log("Total Payroll: $".concat(totalPayroll));
}
var HourlyPayStrategy = /** @class */ (function () {
    function HourlyPayStrategy() {
    }
    HourlyPayStrategy.prototype.calculate = function (baseSalary, context) {
        var HOURLY_RATE = baseSalary / 2080; // Annual to hourly
        return HOURLY_RATE * context.hoursWorked;
    };
    return HourlyPayStrategy;
}());
var SalaryPayStrategy = /** @class */ (function () {
    function SalaryPayStrategy() {
    }
    SalaryPayStrategy.prototype.calculate = function (baseSalary) {
        return baseSalary / 12; // Monthly salary
    };
    return SalaryPayStrategy;
}());
var EmployeeWithStrategy = /** @class */ (function () {
    function EmployeeWithStrategy(baseSalary, payStrategy) {
        this.baseSalary = baseSalary;
        this.payStrategy = payStrategy;
    }
    EmployeeWithStrategy.prototype.calculateMonthlyPay = function (context) {
        return this.payStrategy.calculate(this.baseSalary, context);
    };
    // Can change strategy at runtime
    EmployeeWithStrategy.prototype.setPayStrategy = function (strategy) {
        this.payStrategy = strategy;
    };
    return EmployeeWithStrategy;
}());
