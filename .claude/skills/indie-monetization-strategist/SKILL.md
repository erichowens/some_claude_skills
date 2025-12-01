---
name: indie-monetization-strategist
description: "Monetization strategies for indie developers, solopreneurs, and small teams. Covers freemium models, SaaS pricing, sponsorships, donations, email list building, and passive income for developer tools, content sites, and educational apps. Activate on 'monetization', 'make money', 'pricing', 'freemium', 'SaaS', 'sponsorship', 'donations', 'passive income', 'indie hacker'. NOT for enterprise sales, B2B outbound, VC fundraising, or large-scale advertising (use enterprise/marketing skills)."
allowed-tools: Read,Write,Edit,Bash,Glob,Grep,WebFetch,WebSearch
---

# Indie Monetization Strategist

Turn your side projects into sustainable income streams. This skill focuses on realistic, battle-tested monetization strategies for indie developers and solopreneurs.

## When to Use

**Use for:**
- Choosing monetization models for dev tools
- Setting up freemium/premium tiers
- Pricing strategy decisions
- Email list building for launches
- Sponsorship and donation systems
- Passive income optimization
- Content monetization

**NOT for:**
- Enterprise B2B sales processes
- VC fundraising/pitch decks
- Large-scale advertising campaigns
- Affiliate marketing schemes

## The Indie Monetization Stack

```
┌─────────────────────────────────────────────┐
│           PREMIUM PRODUCTS                  │
│  SaaS subscriptions, one-time purchases     │
│  → Highest revenue, requires product-market │
├─────────────────────────────────────────────┤
│           SERVICES & CONSULTING             │
│  Custom work, implementation, training      │
│  → Trade time for money, but validates      │
├─────────────────────────────────────────────┤
│           PASSIVE/SEMI-PASSIVE              │
│  Sponsorships, donations, affiliates        │
│  → Lower friction, good for content/tools   │
├─────────────────────────────────────────────┤
│           LIST BUILDING                     │
│  Email subscribers, community members       │
│  → Foundation for all monetization          │
└─────────────────────────────────────────────┘
```

## Monetization Decision Tree

```
Is your project...

A DEVELOPER TOOL?
├── Open source? → Sponsorships + Premium features/hosting
├── Closed source? → Freemium SaaS or one-time purchase
└── CLI tool? → Pay-what-you-want + Pro tier

AN EDUCATIONAL RESOURCE?
├── Course/tutorial? → One-time purchase or membership
├── Reference site? → Sponsorships + Premium content
└── Interactive app? → Freemium with advanced features

A CONTENT SITE?
├── Technical blog? → Sponsorships + Newsletter premium tier
├── Showcase/portfolio? → Consulting leads + Sponsorships
└── Community site? → Membership + Sponsorships
```

## Model Deep Dives

### Freemium SaaS

**The 80/20 rule**: 80% of users stay free, 20% of free features drive conversion

**Tier structure:**
```
FREE TIER (Lead generation)
- Core functionality works fully
- Usage limits (not feature gates)
- Watermarks/branding acceptable
- Goal: Get users hooked

PRO TIER ($9-29/mo typical)
- Higher/no usage limits
- No branding/watermarks
- Priority support
- Team features
- Goal: Convert serious users

TEAM/ENTERPRISE ($49-199/mo)
- Admin controls
- SSO/compliance
- SLA guarantees
- Goal: Capture business value
```

**Anti-pattern**: Don't cripple the free tier so much it's useless. Users who never experience value never convert.

**What to gate (good):**
- Usage volume (API calls, storage, exports)
- Team collaboration features
- White-labeling/custom branding
- Priority support/SLA
- Advanced analytics

**What NOT to gate (bad):**
- Core functionality that demonstrates value
- Basic features competitors offer free
- Security features (never gate security)

### Sponsorships

**Where to get sponsors:**
- GitHub Sponsors - For open source projects
- Open Collective - For community projects
- Direct outreach - For established projects
- Sponsorship marketplaces (EthicalAds, Carbon Ads)

**Sponsorship pricing formula:**
```
Monthly visitors × $0.01-0.05 = Base sponsorship rate

Example:
50,000 monthly visitors × $0.02 = $1,000/month potential

Factors that increase rate:
+ Developer audience (2-3x)
+ Niche focus (1.5-2x)
+ High engagement (1.5x)
+ Multiple placements available (additive)
```

**Sponsorship tiers template:**
```markdown
## Sponsor Some Claude Skills

### 🥉 Bronze - $100/month
- Logo in README sponsors section
- Thank you tweet

### 🥈 Silver - $500/month
- Everything in Bronze
- Logo on website footer
- Monthly newsletter mention

### 🥇 Gold - $1,000/month
- Everything in Silver
- Logo in documentation sidebar
- Dedicated sponsor spotlight post
- Logo in all video content

### 💎 Platinum - $2,500/month
- Everything in Gold
- Custom integration example
- Co-branded content opportunity
- Direct Slack channel access
```

### Donations / Pay-What-You-Want

**When donations work:**
- Strong community/emotional connection
- Open source with clear value
- Educational content that helped careers
- Tools that saved significant time/money

**Platforms:**
- GitHub Sponsors (best for developers)
- Buy Me a Coffee (low friction)
- Ko-fi (creator-friendly)
- Patreon (for ongoing content)
- Stripe Payment Links (direct, lowest fees)

**Donation psychology:**
- Anchor with suggested amounts ($5, $15, $50)
- Show what donations fund ("$5 = 1 hour of development")
- Thank donors publicly (with permission)
- Provide exclusive perks for ongoing supporters

### Email List Building

**The foundation of all monetization.** Build your list before you need it.

**Lead magnets for developers:**
- Cheatsheets/quick reference guides
- Starter templates/boilerplates
- Exclusive tutorials/deep dives
- Early access to new features
- Behind-the-scenes content

**Email sequence template:**
```
Day 0: Welcome + Deliver lead magnet
Day 3: Your best content piece
Day 7: Your story/why you built this
Day 14: Soft pitch (premium feature/product)
Day 21: Social proof + testimonials
Day 30: Direct pitch with deadline
```

**Tools:**
- Buttondown (developer-focused, simple)
- ConvertKit (creator economy standard)
- Mailchimp (free tier, but clunky)
- Resend (if you want to self-host)

## Pricing Psychology

### The Decoy Effect

```
BASIC: $9/month
- Feature A
- Feature B

PRO: $29/month ← Target
- Everything in Basic
- Feature C
- Feature D
- Feature E

ENTERPRISE: $99/month ← Decoy (makes Pro look reasonable)
- Everything in Pro
- Feature F
- Priority support
```

### Price Anchoring

Always show the higher price first, then the discount:
```
❌ Bad: "Only $29/month!"
✅ Good: "$49/month → $29/month (save 40%)"
```

### Annual vs Monthly

```
Monthly: $29/month
Annual: $19/month (billed $228/year)
         ↑
    Save 34% + lock in users

Offer both, but highlight annual.
Annual subscribers have 5x lower churn.
```

## Platform-Specific Strategies

### For someclaudeskills.com (Skills Marketplace)

**Monetization stack:**
1. **Sponsorships** - Primary revenue
   - Sidebar sponsor spots
   - Newsletter sponsors
   - "Featured skill" placements

2. **Premium skills** - Secondary
   - Sell premium skill packs
   - License commercial-use skills

3. **Consulting leads** - Tertiary
   - "Need custom skills? Contact us"
   - Implementation services

4. **Affiliate** - Passive
   - Link to Claude Pro/API with affiliate
   - Related tools and services

### For Educational Apps

**Monetization stack:**
1. **Freemium with progress gates**
   - First N lessons free
   - Full curriculum requires upgrade

2. **One-time purchase option**
   - Lifetime access at 2-3x annual price
   - Appeals to commitment-averse users

3. **Certificates/credentials**
   - Completion certificates (paid)
   - Portfolio-worthy projects (premium)

### For Developer Tools

**Monetization stack:**
1. **Open core model**
   - Core tool free and open source
   - Paid cloud hosting option
   - Enterprise features closed source

2. **Usage-based pricing**
   - Free tier: 1,000 API calls/month
   - Pro: 50,000 calls for $29/month
   - Enterprise: Unlimited for $199/month

## Common Anti-Patterns

### Premature Monetization
**Symptom**: Adding payments before product-market fit
**Problem**: Optimizing revenue for something nobody wants
**Solution**: Validate with free users first. If people won't use it free, they won't pay.

### Race to the Bottom Pricing
**Symptom**: Pricing way below competitors
**Problem**: Signals low quality, attracts worst customers
**Solution**: Price based on value delivered, not competitor copying. Premium pricing attracts premium customers.

### Feature Bloat to Justify Price
**Symptom**: Adding features nobody asked for to justify higher tiers
**Problem**: Complexity kills products
**Solution**: Charge more for LESS but BETTER. Simplicity is a feature.

### Ignoring Existing Monetization
**Symptom**: Building new revenue streams instead of optimizing existing
**Problem**: Switching costs, divided focus
**Solution**: 2x your conversion rate before adding new revenue streams.

## Quick Implementation Guides

### Add Stripe Payments (5 minutes)

```typescript
// 1. Install
npm install @stripe/stripe-js stripe

// 2. Create checkout session (API route)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: 'price_xxxxx', // Your Stripe price ID
      quantity: 1,
    }],
    mode: 'subscription', // or 'payment' for one-time
    success_url: 'https://yoursite.com/success',
    cancel_url: 'https://yoursite.com/pricing',
  });
  return Response.json({ url: session.url });
}

// 3. Redirect to checkout
const response = await fetch('/api/checkout', { method: 'POST' });
const { url } = await response.json();
window.location.href = url;
```

### Add GitHub Sponsors

1. Go to github.com/sponsors
2. Set up sponsor profile
3. Create tiers ($1, $5, $10, $25 suggested)
4. Add sponsor button to repos
5. Add sponsors section to README

### Add Buy Me a Coffee

```html
<!-- Simple button -->
<a href="https://buymeacoffee.com/yourusername" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
       alt="Buy Me A Coffee"
       style="height: 60px; width: 217px;">
</a>
```

## Revenue Benchmarks (Indie Scale)

| Stage | Monthly Revenue | What it means |
|-------|-----------------|---------------|
| Ramen Profitable | $2-5k | Can quit day job (barely) |
| Comfortable | $10-20k | Good indie income |
| Scaling | $50k+ | Time to consider hiring |

**Reality check**: Most indie projects earn $0-500/month. Getting to $2k/month puts you in the top 10% of indie hackers.

## The Patient Path (Cory Zue's Framework)

1. **Start consulting** - Validates skills, builds runway
2. **Build small products** - $100-1k/month each
3. **Stack revenue streams** - Multiple small wins
4. **Find the winner** - One product takes off
5. **Double down** - Focus on what works

**Key insight**: Most successful indie hackers took 3-5 years to reach "overnight success." Plan for the long game.

## Reference Files

| File | Contents |
|------|----------|
| `references/pricing-templates.md` | Copy-paste pricing page templates |
| `references/email-sequences.md` | Full email sequence examples |
| `references/stripe-integration.md` | Complete Stripe setup guide |

---

**This skill guides**: Monetization Strategy | Pricing Psychology | Freemium Models | Sponsorships | Email Marketing | Indie Hacker Revenue
