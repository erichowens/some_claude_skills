---
name: personal-finance-coach
description: Expert personal finance coach with deep knowledge of tax optimization, investment theory (MPT, factor investing), retirement mathematics (Trinity Study, SWR research), and wealth-building strategies grounded in academic research
version: 1.0.0
category: Business & Professional
tags:
  - personal-finance
  - investing
  - tax-optimization
  - retirement-planning
  - factor-investing
  - wealth-building
author: Erich Owens
---

# Personal Finance Coach

Expert personal finance coach grounded in academic research and quantitative analysis, not platitudes.

## Investment Theory (The Real Foundation)

### Modern Portfolio Theory (Markowitz, 1952)

```
CORE INSIGHT: Risk is not just about individual assets,
              but how they move TOGETHER.

EFFICIENT FRONTIER
├── Set of portfolios with maximum return for given risk
├── All rational investors should be on this frontier
├── Below frontier = inefficient (can do better)
└── Above frontier = impossible

PORTFOLIO VARIANCE:
σ²_p = Σᵢ Σⱼ wᵢwⱼσᵢσⱼρᵢⱼ

Where:
├── wᵢ, wⱼ = weights of assets i, j
├── σᵢ, σⱼ = standard deviations
└── ρᵢⱼ = correlation coefficient

KEY IMPLICATION:
├── Uncorrelated assets reduce portfolio risk
├── Even adding a "risky" asset can reduce total risk
└── Diversification is the "only free lunch"
```

```python
import numpy as np
from scipy.optimize import minimize

def optimize_portfolio(returns: np.ndarray, cov_matrix: np.ndarray,
                      target_return: float = None,
                      risk_free_rate: float = 0.03) -> dict:
    """
    Find optimal portfolio weights using mean-variance optimization.

    Args:
        returns: Expected returns for each asset (annual)
        cov_matrix: Covariance matrix of returns
        target_return: If specified, minimize risk for this return
        risk_free_rate: Risk-free rate for Sharpe calculation

    Returns:
        dict with optimal weights, expected return, volatility, Sharpe ratio
    """
    n_assets = len(returns)

    def portfolio_volatility(weights):
        return np.sqrt(weights @ cov_matrix @ weights)

    def portfolio_return(weights):
        return weights @ returns

    def neg_sharpe(weights):
        ret = portfolio_return(weights)
        vol = portfolio_volatility(weights)
        return -(ret - risk_free_rate) / vol

    # Constraints: weights sum to 1
    constraints = [{'type': 'eq', 'fun': lambda w: np.sum(w) - 1}]

    if target_return:
        constraints.append({
            'type': 'eq',
            'fun': lambda w: portfolio_return(w) - target_return
        })
        objective = portfolio_volatility
    else:
        objective = neg_sharpe

    # Bounds: 0-100% in each asset (no shorting)
    bounds = tuple((0, 1) for _ in range(n_assets))

    # Initial guess: equal weight
    init_weights = np.ones(n_assets) / n_assets

    result = minimize(objective, init_weights, method='SLSQP',
                     bounds=bounds, constraints=constraints)

    weights = result.x
    return {
        'weights': weights,
        'return': portfolio_return(weights),
        'volatility': portfolio_volatility(weights),
        'sharpe': (portfolio_return(weights) - risk_free_rate) /
                  portfolio_volatility(weights)
    }
```

### Factor Investing (Fama-French and Beyond)

```
CAPM (1964): E[Rᵢ] = Rf + βᵢ(E[Rm] - Rf)
└── Single factor: Market risk

FAMA-FRENCH 3-FACTOR (1992):
E[Rᵢ] = Rf + βᵢ(Rm - Rf) + sᵢSMB + hᵢHML
├── SMB: Small Minus Big (size premium)
└── HML: High Minus Low (value premium)

FAMA-FRENCH 5-FACTOR (2014):
Added:
├── RMW: Robust Minus Weak (profitability)
└── CMA: Conservative Minus Aggressive (investment)

MOMENTUM FACTOR (Carhart, 1997):
├── Winners continue winning short-term
├── 12-month momentum, skip most recent month
└── High turnover, tax-inefficient

FACTOR PREMIUMS (Historical, not guaranteed):
├── Market: 5-7% over risk-free
├── Size: 2-3% (small > large)
├── Value: 3-5% (cheap > expensive)
├── Momentum: 4-6% (but volatile)
├── Profitability: 2-3%
└── Low volatility: Market return at lower risk

PRACTICAL IMPLEMENTATION:
├── DFA, Avantis, AQR: Academic factor funds
├── Vanguard Value (VTV): Simple value tilt
├── iShares Small-Cap Value (IJS): Size + value
└── Dimensional US Small Cap Value (DFSV): Gold standard
```

### Sequence of Returns Risk

```
THE RETIREMENT KILLER

Two scenarios, same AVERAGE return:

SCENARIO A (Good sequence):
Year 1: +20%, Year 2: +15%, Year 3: -10%
$1M portfolio with $40K withdrawal:
├── End Y1: $1M × 1.20 - $40K = $1.16M
├── End Y2: $1.16M × 1.15 - $40K = $1.294M
├── End Y3: $1.294M × 0.90 - $40K = $1.125M
└── RESULT: $1.125M remaining

SCENARIO B (Bad sequence):
Year 1: -10%, Year 2: +15%, Year 3: +20%
├── End Y1: $1M × 0.90 - $40K = $860K
├── End Y2: $860K × 1.15 - $40K = $949K
├── End Y3: $949K × 1.20 - $40K = $1.099M
└── RESULT: $1.099M remaining

SAME AVERAGE RETURN, $26K DIFFERENCE!

Early losses + withdrawals = permanent damage

MITIGATION STRATEGIES:
├── Bond tent: Higher bonds at retirement, reduce over time
├── Bucket strategy: 2-3 years in cash/bonds
├── Dynamic withdrawal: Reduce spending in down markets
├── Part-time work: Reduce withdrawals early
└── CAPE-based withdrawal: Adjust for market valuation
```

## Tax Optimization

### Account Location Strategy

```
ASSET LOCATION (Where to hold what)

TAX-DEFERRED (Traditional 401k/IRA):
├── Bonds and bond funds (highest tax drag)
├── REITs (dividends taxed as ordinary income)
├── High-yield bonds
├── Actively managed funds (high turnover)
└── Commodities

TAX-FREE (Roth 401k/IRA):
├── Highest expected growth assets
├── Small-cap value (highest expected return)
├── International small value
├── Anything you want to grow tax-free forever
└── Assets you'll hold longest

TAXABLE BROKERAGE:
├── Total stock market index (tax-efficient)
├── Tax-managed funds
├── Municipal bonds (if in high bracket)
├── ETFs over mutual funds (tax efficiency)
├── Assets held >1 year (long-term rates)
└── Loss harvesting candidates

MATH EXAMPLE:
$100K bonds at 5% yield, 35% tax bracket:
├── In taxable: $5K × 0.65 = $3.25K after-tax
└── In tax-deferred: $5K grows, taxed at withdrawal

$100K stocks at 10% return:
├── In Roth: $10K growth, NEVER taxed
└── In taxable: Qualified divs at 15%, LTCG at 15%
```

### Tax-Loss Harvesting

```python
def tax_loss_harvest(positions: list[dict], threshold: float = 0.03) -> list[dict]:
    """
    Identify tax-loss harvesting opportunities.

    Args:
        positions: List of {ticker, cost_basis, current_value, purchase_date}
        threshold: Minimum loss % to harvest (transaction costs matter)

    Returns:
        List of positions to harvest with replacement suggestions
    """
    from datetime import datetime, timedelta

    harvest_candidates = []

    # Replacement map (similar but not "substantially identical")
    replacements = {
        'VTI': ['ITOT', 'SCHB', 'SPTM'],  # Total US market
        'VXUS': ['IXUS', 'SCHF', 'IEFA'],  # International
        'BND': ['AGG', 'SCHZ', 'IUSB'],    # Total bond
        'VNQ': ['SCHH', 'IYR', 'XLRE'],    # REITs
    }

    for pos in positions:
        loss_pct = (pos['current_value'] - pos['cost_basis']) / pos['cost_basis']
        days_held = (datetime.now() - pos['purchase_date']).days

        if loss_pct < -threshold:
            # Check wash sale window
            harvest_candidates.append({
                'ticker': pos['ticker'],
                'loss': pos['current_value'] - pos['cost_basis'],
                'loss_pct': loss_pct,
                'short_term': days_held < 365,
                'replacement': replacements.get(pos['ticker'], ['Cash']),
                'tax_savings_estimate': estimate_tax_savings(
                    pos['cost_basis'] - pos['current_value'],
                    days_held < 365
                )
            })

    return sorted(harvest_candidates, key=lambda x: x['tax_savings_estimate'], reverse=True)

def estimate_tax_savings(loss: float, short_term: bool,
                        income_bracket: float = 0.32,
                        ltcg_rate: float = 0.15) -> float:
    """
    Estimate tax savings from harvesting a loss.

    Short-term losses offset short-term gains (higher rate) first.
    """
    if short_term:
        return loss * income_bracket
    else:
        return loss * ltcg_rate
```

### Roth Conversion Ladder

```
FOR EARLY RETIREMENT (before 59.5)

PROBLEM: Can't access 401k/IRA without 10% penalty

SOLUTION: Roth Conversion Ladder

HOW IT WORKS:
Year 0: Retire with $1M in Traditional IRA
Year 1: Convert $50K from Traditional → Roth
        Pay taxes on $50K (no penalty for conversion)
Year 2: Convert another $50K
...
Year 6: Year 1's $50K conversion is now accessible
        (5-year seasoning rule)

ANNUAL PROCESS:
├── Convert amount needed for Year+5 spending
├── Pay taxes now at (hopefully) lower rate
├── Wait 5 years for each conversion
└── Withdraw contributions (not earnings) tax/penalty-free

TAX BRACKETS TO FILL:
2024 Single:
├── 10%: $0 - $11,600
├── 12%: $11,600 - $47,150
└── 22%: $47,150 - $100,525

STRATEGY: Fill up to 22% bracket with conversions
         while keeping total income low for ACA subsidies

EXAMPLE:
├── Spouse 1 converts $47K to fill 12% bracket
├── Spouse 2 converts $47K to fill 12% bracket
├── Total: $94K converted at 12% = $11,280 tax
├── After 5 years: Access $94K/year tax & penalty-free
└── Meanwhile: Live on taxable or Roth contributions
```

## Withdrawal Mathematics

### The Trinity Study (Updated Research)

```
ORIGINAL TRINITY STUDY (Cooley, Hubbard, Walz, 1998):
├── Analyzed 1926-1995 data
├── 30-year retirement periods
├── Various stock/bond allocations
└── Conclusion: 4% withdrawal rate had ~95% success

UPDATED RESEARCH (Bengen, Kitces, ERN, etc.):

VARIABLE SWR BY STARTING VALUATION:
├── CAPE < 12: 5.0%+ SWR historically safe
├── CAPE 12-18: 4.0% SWR historically safe
├── CAPE 18-25: 3.5% SWR more prudent
├── CAPE > 25: 3.0-3.5% SWR recommended
└── Current CAPE (2024): ~33 → Be conservative

DYNAMIC WITHDRAWAL STRATEGIES:

1. GUYTON-KLINGER GUARDRAILS:
   ├── Start at 4-5%
   ├── If withdrawal rate rises 20% above initial: cut 10%
   ├── If withdrawal rate falls 20% below initial: raise 10%
   └── Higher initial rate, but flexibility required

2. VPW (Variable Percentage Withdrawal):
   ├── Recalculate each year based on:
   │   remaining_years = life_expectancy - current_age
   │   withdrawal = portfolio / remaining_years
   ├── Adjusts for portfolio performance
   └── Never runs out, but income varies

3. CAPE-BASED WITHDRAWAL:
   ├── SWR = 1 / (CAPE × 0.5)
   ├── When CAPE = 20: SWR = 1 / 10 = 10%... too high
   ├── Better: SWR = min(5%, 1/CAPE + 1%)
   └── Adjusts to market valuation
```

```python
def simulate_retirement(portfolio: float, allocation: tuple,
                       withdrawal_rate: float, years: int = 30,
                       simulations: int = 10000) -> dict:
    """
    Monte Carlo retirement simulation.

    Args:
        portfolio: Starting portfolio value
        allocation: (stocks_pct, bonds_pct)
        withdrawal_rate: Initial withdrawal as % of portfolio
        years: Retirement length
        simulations: Number of Monte Carlo runs

    Returns:
        Success rate, median ending value, percentiles
    """
    import numpy as np

    # Historical parameters (adjust for expectations)
    stock_return = 0.07  # Real return
    stock_vol = 0.18
    bond_return = 0.02   # Real return
    bond_vol = 0.06
    correlation = 0.0    # Stock-bond correlation

    stock_pct, bond_pct = allocation
    initial_withdrawal = portfolio * withdrawal_rate

    results = []

    for _ in range(simulations):
        value = portfolio
        withdrawal = initial_withdrawal

        for year in range(years):
            # Generate correlated returns
            z1 = np.random.normal()
            z2 = correlation * z1 + np.sqrt(1 - correlation**2) * np.random.normal()

            stock_r = stock_return + stock_vol * z1
            bond_r = bond_return + bond_vol * z2

            portfolio_return = stock_pct * stock_r + bond_pct * bond_r

            # Beginning of year withdrawal
            value -= withdrawal
            if value <= 0:
                value = 0
                break

            # Growth
            value *= (1 + portfolio_return)

            # Inflation adjustment (withdrawal grows with inflation)
            withdrawal *= 1.03  # 3% inflation assumption

        results.append(value)

    results = np.array(results)
    success_rate = np.mean(results > 0)

    return {
        'success_rate': success_rate,
        'median_ending': np.median(results[results > 0]) if success_rate > 0 else 0,
        'percentile_10': np.percentile(results, 10),
        'percentile_25': np.percentile(results, 25),
        'percentile_75': np.percentile(results, 75),
        'percentile_90': np.percentile(results, 90),
        'failures': int((1 - success_rate) * simulations)
    }

# Example
"""
result = simulate_retirement(
    portfolio=1_000_000,
    allocation=(0.6, 0.4),
    withdrawal_rate=0.04,
    years=30
)
print(f"Success rate: {result['success_rate']:.1%}")
print(f"Median ending: ${result['median_ending']:,.0f}")
"""
```

## Emergency Fund Calculation

```
TRADITIONAL ADVICE: 3-6 months expenses

ACTUAL CALCULATION:

FACTORS TO CONSIDER:
├── Job security (industry, skills, location)
├── Income volatility (W-2 vs 1099)
├── Number of income sources
├── Fixed vs variable expenses
├── Debt obligations
├── Health/family situation
└── Risk tolerance

FORMULA:
EF = (Monthly_Essential_Expenses) ×
     (Expected_Unemployment_Duration) ×
     (Safety_Factor)

EXPECTED UNEMPLOYMENT DURATION:
├── < $50K salary: 1 month per $10K
├── $50K-$100K: 1.5 months per $10K
├── > $100K: 2 months per $10K
└── Add 50% if specialized field

SAFETY FACTORS:
├── Stable W-2, dual income: 1.0×
├── Single income, stable: 1.5×
├── Variable income: 2.0×
├── Self-employed: 2.5×
└── Health issues/dependents: Add 0.5×

EXAMPLE:
├── $80K salary, tech worker, single income
├── Essential expenses: $4K/month
├── Expected unemployment: 80K/10K × 1.5 = 12 months
├── Safety factor: 1.5 (single income)
├── EF = $4K × 12 × 1.5 = $72K
└── Round: $75K emergency fund
```

## FIRE Calculations

```
FINANCIAL INDEPENDENCE NUMBER

STANDARD: Annual Expenses × 25
(Assumes 4% SWR)

CONSERVATIVE: Annual Expenses × 33
(Assumes 3% SWR, more appropriate today)

FAT FIRE: Annual Expenses × 33 + Buffer
├── Includes luxury spending
├── Healthcare buffer
├── "Nice to have" budget
└── Typically $2.5M+

LEAN FIRE: Minimal Expenses × 25
├── Bare bones budget
├── Geographic arbitrage
├── $500K - $1M range
└── Less margin for error

COAST FIRE:
├── Save enough that growth alone funds retirement
├── Formula: FI_number / (1 + growth_rate)^years_to_retirement
├── Example: Need $2M at 65, currently 35
│   └── Coast number: $2M / 1.07^30 = $263K
└── After hitting coast number, can reduce savings rate

BARISTA FIRE:
├── Enough to part-time work for benefits
├── Portfolio covers most expenses
├── Job covers health insurance + discretionary
└── Common: $500K-$1M + part-time income
```

## Disclaimer

```
IMPORTANT NOTICES:

This is educational information, NOT personalized financial advice.

FOR PERSONALIZED ADVICE, CONSULT:
├── Fee-only fiduciary financial advisor
├── CPA for tax situations
├── Estate attorney for planning
└── Licensed insurance professional

I DO NOT:
├── Know your complete financial picture
├── Account for state/local taxes
├── Provide tax preparation services
├── Recommend specific securities for purchase
└── Guarantee any investment returns

TAX LAWS:
├── Change frequently
├── Vary by jurisdiction
├── Have exceptions and phase-outs
└── Require professional guidance for complex situations

INVESTMENTS:
├── Past performance ≠ future results
├── All investing involves risk
├── You can lose money
└── Academic research may not hold in future
```
