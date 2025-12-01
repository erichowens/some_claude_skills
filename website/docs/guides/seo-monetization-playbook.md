---
title: SEO & Monetization Playbook
description: Tailored strategies for someclaudeskills.com and your other web projects
sidebar_position: 99
---

# SEO & Monetization Playbook

Tailored strategies for getting your web projects discovered and generating revenue.

## 🎯 someclaudeskills.com

### Current State Assessment

**✅ Already Good:**
- Custom domain with SSL
- Plausible analytics installed
- Open Graph image configured
- Clean URL structure (Docusaurus)
- GitHub repository linked
- Sitemap auto-generated

**🔧 Just Added:**
- `llms.txt` - AI crawler optimization
- `robots.txt` - Proper bot permissions

**⚠️ Needs Work:**
- JSON-LD schema markup
- Meta descriptions per page
- Humans.txt
- Newsletter/email capture
- Sponsorship system

### SEO Action Plan

#### Immediate (This Week)

1. **Add JSON-LD Schema** to homepage and skill pages:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Some Claude Skills",
  "description": "45+ production-ready AI skills for Claude Code",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Cross-platform",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

2. **Create humans.txt** at `/static/humans.txt`:
```
/* TEAM */
Developer: Erich Owens
Site: https://erichowens.com
Twitter: @erichowens
Location: [Your City]

/* SITE */
Last update: 2024/01/XX
Standards: HTML5, CSS3, TypeScript
Software: Docusaurus, React
```

3. **Improve page descriptions** - Each skill doc should have:
   - Unique meta description (150-160 chars)
   - Primary keyword in first 60 chars
   - Call-to-action or benefit statement

#### Short-term (Next 2 Weeks)

4. **Add email capture** - Use Buttondown or ConvertKit:
   - Popup on first visit (delayed 30 seconds)
   - In-line form on homepage
   - Lead magnet: "10 Essential Claude Skills Cheatsheet"

5. **Create canonical skill landing pages** - High-value pages:
   - `/skills/machine-learning` - Category page
   - `/skills/psychology` - Category page
   - `/use-cases/code-review` - Use case pages

6. **Implement breadcrumb schema** for documentation hierarchy

#### Medium-term (Next Month)

7. **Build backlinks:**
   - Submit to Anthropic's community showcase
   - Post on r/ClaudeAI, r/LocalLLaMA
   - Write guest posts on Dev.to, Hashnode
   - Create GitHub Awesome list entry

8. **Content marketing:**
   - Blog post: "How I Built 45+ Claude Skills"
   - Tutorial: "Creating Your First Claude Skill"
   - Video: "Claude Code Skills Demo"

### Monetization Strategy

**Primary: Sponsorships** (Best fit for dev tools)

Create sponsorship tiers:
| Tier | Price | Benefits |
|------|-------|----------|
| Bronze | $100/mo | Logo in README, tweet |
| Silver | $300/mo | + Footer logo, newsletter mention |
| Gold | $750/mo | + Sidebar placement, spotlight post |

**Secondary: Premium Skills**

- Sell skill bundles: "Enterprise ML Pack" ($49)
- Custom skill development: $500-2000
- Implementation consulting: $150/hr

**Tertiary: Affiliate**

- Link to Claude Pro with affiliate code
- Recommend related tools (cursor.sh, codeium)

### Launch Strategy

**Product Hunt Launch Plan:**

1. **2 weeks before:**
   - Polish site, fix all bugs
   - Create GIF/video demo
   - Write compelling tagline
   - Reach out to 20+ tech friends for day-1 support

2. **1 week before:**
   - Schedule launch for Tuesday/Wednesday
   - Prepare social media posts
   - Draft Hacker News Show HN post
   - Create Twitter thread script

3. **Launch day (12:01 AM PST):**
   - Go live on Product Hunt
   - Post Show HN immediately after
   - Tweet thread
   - Email list announcement
   - Reddit posts (r/SideProject, r/ClaudeAI)

4. **Post-launch:**
   - Respond to ALL comments
   - Share milestone updates
   - Thank supporters publicly

---

## 📊 Core Values Web App

### SEO Opportunities

**Target keywords:**
- "personal values assessment"
- "core values quiz"
- "values alignment tool"
- "career values test"

**Content strategy:**
- Create value-specific landing pages ("/values/integrity")
- Blog: "Why Knowing Your Values Matters for Career Success"
- Free tool attracts links naturally

### Monetization Options

1. **Freemium model:**
   - Free: Basic values assessment
   - Premium ($9): Detailed report, PDF export, career matching

2. **B2B licensing:**
   - Team assessments for HR departments
   - White-label for coaches

3. **Lead generation:**
   - Capture emails for coaches/HR professionals
   - Sell leads or consulting

---

## 🪢 Knot Theory Educational App

### SEO Opportunities

**Target keywords:**
- "learn knot theory"
- "mathematical knots tutorial"
- "knot invariants explained"
- "topology education"

**Content strategy:**
- Interactive tutorials rank well (dwell time)
- Create "Knot of the Day" feature
- Target university course searches

### Monetization Options

1. **Educational licensing:**
   - University/school subscriptions
   - Classroom packages

2. **Freemium:**
   - Free: Basic knots
   - Premium: Advanced topics, certificates

3. **Textbook companion:**
   - Partner with topology textbook authors
   - Supplementary material licensing

---

## 🤖 AI Coding Assistant Launch Site

### SEO Opportunities

**Target keywords:**
- "[your tool name] vs cursor"
- "[your tool name] vs copilot"
- "best ai coding assistant 2024"
- "ai pair programming tool"

**Content strategy:**
- Comparison pages rank VERY well
- "How [Tool] Works" technical deep-dive
- Case studies with metrics

### Monetization Strategy

**SaaS pricing (typical for AI coding tools):**

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 50 completions/day |
| Pro | $19/mo | Unlimited, all models |
| Team | $39/user/mo | + Admin, SSO |

**Launch strategy:**

1. **Pre-launch:**
   - Build waitlist (email capture)
   - Beta program with feedback loop
   - Seed Product Hunt hunters

2. **Launch:**
   - Product Hunt + HN + Twitter same day
   - Offer launch discount (20% first year)

3. **Post-launch:**
   - Aggressive content marketing
   - YouTube tutorials
   - Developer community engagement

---

## 📋 Universal Checklist

### Before Any Launch

- [ ] llms.txt created and populated
- [ ] robots.txt allows AI crawlers
- [ ] sitemap.xml generated
- [ ] JSON-LD schema on key pages
- [ ] Open Graph tags with compelling image
- [ ] Twitter Cards configured
- [ ] Analytics installed (Plausible/GA4)
- [ ] Core Web Vitals score above 90
- [ ] Mobile responsive verified
- [ ] Email capture mechanism ready
- [ ] Social proof elements (testimonials, stats)
- [ ] Clear call-to-action on homepage

### Launch Day

- [ ] Product Hunt listing live at 12:01 AM PST
- [ ] Show HN post ready
- [ ] Twitter thread scheduled
- [ ] Reddit posts queued
- [ ] Email blast to list
- [ ] Support friends notified
- [ ] Calendar cleared for comment responses

### Post-Launch (First Week)

- [ ] Respond to all Product Hunt comments
- [ ] Thank every upvoter publicly
- [ ] Share metrics/milestones
- [ ] Fix any reported bugs immediately
- [ ] Gather testimonials
- [ ] Plan next content piece

---

## 🔗 Resources

- [Product Hunt Launch Guide](https://www.producthunt.com/launch)
- [Hacker News Posting Guidelines](https://news.ycombinator.com/newsguidelines.html)
- [JSON-LD Generator](https://technicalseo.com/tools/schema-markup-generator/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [llms.txt Specification](https://llmstxt.org/)

---

*This playbook was generated by the seo-visibility-expert and indie-monetization-strategist skills.*
