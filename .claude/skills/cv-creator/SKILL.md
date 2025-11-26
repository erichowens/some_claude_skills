---
name: cv-creator
description: Professional CV and resume builder that transforms career narratives into ATS-optimized, multi-format resumes. Integrates with career-biographer for structured career data and competitive-cartographer for strategic positioning. Generates PDF, DOCX, LaTeX, JSON Resume, HTML, and Markdown formats optimized for 2025 hiring standards.
allowed-tools: Read,Write,Edit,WebFetch,WebSearch
---

# CV Creator

## 🎉 Production Implementation Available!

**CV Creator is now a complete, production-ready TypeScript application!**

- 📦 **GitHub**: [github.com/erichowens/cv-creator](https://github.com/erichowens/cv-creator)
- ⚡ **Status**: Production-ready (~2,000 LOC)
- ✅ **ATS Score**: 95/100 achieved
- 🚀 **Deploy**: `npm install && npm run example`

Built through multi-skill orchestration (8 skills, 9 phases), this implementation generates:
- ATS-optimized PDF resumes (&lt;5 sec)
- Deploy-ready portfolio websites (&lt;1 sec)
- Detailed validation reports

[View the artifact](https://erichowens.github.io/some_claude_skills/artifacts) documenting the full production journey.

---

A specialized resume builder that transforms structured career data and competitive positioning insights into ATS-optimized, professionally formatted resumes and CVs.

## Quick Start

**Minimal example to generate a resume:**

```
User: "Create a resume for senior software engineer roles"

CV Creator:
1. Request CareerProfile (from biographer or direct input)
2. Request PositioningStrategy (from cartographer or skip)
3. Request target role/company (optional for optimization)
4. Generate resume with clean formatting
5. Calculate ATS score and provide recommendations
6. Export in requested formats (PDF, DOCX, JSON Resume)
```

**Key principle**: ATS compatibility first, human readability second, visual flair never.

## Core Capabilities

### 1. Multi-Format Resume Generation

Generate professional resumes in multiple formats:

- **PDF**: ATS-compatible, clean typography, print-ready
- **DOCX**: Editable Word format for recruiter modifications
- **JSON Resume**: Structured data format following jsonresume.org schema
- **HTML**: Web-based responsive resume
- **Markdown**: Version-controlled, git-friendly format
- **LaTeX**: Professional academic/research CVs (optional)

### 2. ATS Optimization Engine

Ensure resumes pass applicant tracking systems:

- **Keyword Analysis**: Extract and match keywords from job descriptions
- **Formatting Validation**: Single-column layout, standard fonts, no graphics
- **Section Structure**: Professional Summary, Core Skills, Work Experience, Education
- **Scoring System**: 0-100 ATS compatibility score with specific recommendations
- **Parsing Simulation**: Test how ATS systems will read the resume

### 3. Template System

Four professionally designed templates optimized for different use cases:

**Modern Minimalist** (Default - Best for Tech Roles)
- Clean sans-serif typography (Calibri, Tahoma, Arial)
- Single-column layout with generous whitespace
- Clear visual hierarchy
- Ideal for: Software Engineers, Data Scientists, Product Managers

**Professional Traditional** (Conservative Industries)
- Serif typography (Georgia, Times New Roman)
- Formal, structured layout
- Conservative color palette
- Ideal for: Finance, Legal, Senior Executives, Academia

**Creative Hybrid** (Design-Forward Tech)
- Modern sans-serif with subtle accent color (1-2 colors max)
- Balanced visual interest with ATS compatibility
- Clean but distinctive
- Ideal for: Design Engineers, UX Researchers, Creative Technologists

**Academic CV** (Research & Academia)
- LaTeX-based professional formatting
- Publications, citations, research sections
- Multi-page support
- Ideal for: PhD Candidates, Professors, Research Scientists

### 4. Strategic Integration

#### From Career Biographer

```typescript
interface CareerProfile {
  // Identity
  name: string;
  headline: string;
  summary: string;

  // Timeline
  timelineEvents: Array<{
    date: string;
    type: 'role_change' | 'patent' | 'award' | 'publication' | 'milestone';
    title: string;
    description: string;
    impact: string;
    tags: string[];
  }>;

  // Skills
  skills: Array<{
    category: 'technical' | 'leadership' | 'domain' | 'soft';
    name: string;
    proficiency: number; // 0-100
    yearsOfExperience: number;
  }>;

  // Projects
  projects: Array<{
    name: string;
    role: string;
    description: string;
    technologies: string[];
    impact: string;
    metrics: string[];
  }>;
}
```

#### From Competitive Cartographer

```typescript
interface PositioningStrategy {
  positioning: {
    headline: string;
    differentiators: string[];
    messaging: string;
  };

  contentStrategy: {
    tone: string;
    depth: string;
  };
}
```

## Resume Generation Protocol

### Step 1: Gather Inputs

**Required:**
- CareerProfile (from biographer or user-provided JSON)

**Optional but recommended:**
- PositioningStrategy (from cartographer)
- Target Role (e.g., "Senior Backend Engineer")
- Target Company (e.g., "Google")
- Job Description URL or text (for keyword optimization)

### Step 2: Generate Professional Summary

Transform career data into a compelling 2-4 line summary:

**Formula:**
```
[Seniority Level] + [Technical Focus] with [Years] years building [Domain].
[Key Achievement with Metric]. Expertise in [Top 3-5 Skills].
[Current Goal or Target Role].
```

**Example:**
```
Senior Backend Engineer with 8 years building scalable distributed systems.
Led microservices migration serving 10M+ users with 40% latency reduction.
Expertise in Go, Kubernetes, gRPC, and cloud-native architecture.
Seeking principal engineering role focused on infrastructure optimization.
```

**What to avoid:**
- Generic buzzwords ("passionate", "results-oriented")
- Objective statements ("Seeking a challenging role...")
- Listing achievements (save for Work Experience section)

### Step 3: Create Core Skills Section

Select and prioritize 15-20 technical skills:

**Prioritization criteria:**
1. Mentioned in job description (if provided)
2. Highest proficiency level from CareerProfile
3. Most years of experience
4. Relevant to target role

**Format:**
```
Core Skills:
Go, Kubernetes, Docker, gRPC, PostgreSQL, Redis, Microservices Architecture,
Distributed Systems, AWS, Terraform, CI/CD, System Design, API Design,
Performance Optimization, Monitoring & Observability
```

**What to avoid:**
- Generic skills ("Problem Solving", "Team Player")
- Too many skills (&gt;25 overwhelming, &lt;10 insufficient)
- Listing skills not mentioned elsewhere in resume

### Step 4: Format Work Experience

Transform timeline events into results-oriented bullet points:

**Bullet point formula:**
```
[Action Verb] + [What you did] + [How/Why you did it] + [Quantifiable Result]
```

**Examples:**
```
✓ Led microservices migration from monolith architecture, reducing API latency by 40% and improving deployment frequency from weekly to daily releases

✓ Architected event-driven system handling 10M+ daily active users using Kubernetes, Go, and gRPC with 99.99% uptime SLA

✓ Mentored team of 5 junior engineers through code reviews and pair programming, resulting in 50% faster onboarding time and promotion of 3 engineers within 18 months
```

**Common action verbs:**
- **Leadership**: Led, Managed, Directed, Coordinated, Mentored
- **Technical**: Architected, Built, Designed, Implemented, Optimized
- **Impact**: Reduced, Increased, Improved, Accelerated, Scaled
- **Innovation**: Pioneered, Created, Launched, Introduced, Developed

**What to avoid:**
- Starting with "Responsible for..." or "Duties included..."
- Listing technologies without context
- Vague metrics ("significantly improved", "greatly reduced")
- Bullets longer than 2 lines

### Step 5: Format Education

Keep education section concise:

**Format:**
```
Bachelor of Science in Computer Science
University of California, Berkeley | 2015

Master of Science in Distributed Systems
Stanford University | 2017
```

**When to include GPA:**
- Recent graduate (&lt;5 years) AND GPA ≥3.5
- Otherwise, omit

**What to avoid:**
- Listing coursework (unless applying for first job)
- Including high school education
- Redundant information (location if already in header)

### Step 6: Apply Template Styling

Select appropriate template based on:
- Target industry (tech = Minimalist, finance = Traditional)
- Career stage (early career = cleaner, senior = more content)
- Personal brand (creative roles = Creative Hybrid)
- Academic roles = Academic CV template

### Step 7: Generate ATS Analysis

Calculate ATS score based on:

**Formatting Compliance (30 points):**
- Single-column layout: 10 points
- Standard fonts: 10 points
- No graphics/images: 10 points

**Section Structure (20 points):**
- Has Professional Summary: 5 points
- Has Core Skills: 5 points
- Has Work Experience: 5 points
- Has Education: 5 points

**Content Quality (30 points):**
- Summary length 100-500 chars: 10 points
- Skills section 10-25 skills: 10 points
- Experience bullets have metrics: 10 points

**Keyword Optimization (20 points):**
- If job description provided: calculate keyword coverage
- If not: award 15 points for general optimization

**Total Score:** 0-100

### Step 8: Provide Recommendations

Generate specific, actionable improvements:

**Example recommendations:**
```
ATS Score: 87/100

✓ Strengths:
- Clean single-column formatting passes ATS parsing
- Professional summary is concise and role-specific
- Work experience bullets include quantifiable metrics

⚠️ Improvements:
- Add "Terraform" to Core Skills section (mentioned 3x in job description)
- Increase keyword coverage from 75% to 85% by including "CI/CD pipeline"
- Consider adding certification section with "AWS Certified Solutions Architect"
```

## Best Practices

### Content Optimization

**1. Lead with Impact, Not Responsibilities**
❌ "Responsible for maintaining database infrastructure"
✓ "Optimized database queries and indexing strategy, reducing query latency by 60% and infrastructure costs by $50K annually"

**2. Use Specific Metrics**
❌ "Improved system performance"
✓ "Reduced API response time from 500ms to 200ms (60% improvement)"

**3. Show Career Progression**
❌ Listing same responsibilities for each role
✓ Each role shows increased scope, leadership, or technical complexity

**4. Tailor for Each Application**
- Reorder skills to match job description priority
- Emphasize relevant experience in recent roles
- Adjust professional summary for target company

### Formatting Rules

**Do:**
- ✓ Use standard fonts (Calibri, Arial, Georgia, Times New Roman)
- ✓ Font size 10-12pt for body, 14-16pt for headers
- ✓ Single-column layout (no tables, no text boxes)
- ✓ Standard section headers ("Work Experience", not "My Journey")
- ✓ Consistent date format (MM/YYYY or Month YYYY)
- ✓ Plain bullet points (•, -, or standard symbols)
- ✓ Margins 0.5-1 inch

**Don't:**
- ✗ Use graphics, images, logos, or headshots
- ✗ Include headers/footers (info can be lost in ATS)
- ✗ Use tables or columns
- ✗ Add special characters or emojis
- ✗ Use creative section names
- ✗ Include personal information (age, marital status, photo)

### Length Guidelines

**1 page:** Entry-level (0-3 years experience)
**1-2 pages:** Mid-level (3-10 years experience)
**2 pages:** Senior-level (10+ years experience)

**Never exceed 2 pages**, even for very senior roles.

## Integration Workflows

### Three-Skill Orchestrated Workflow

```
User: "I need a resume for FAANG senior backend engineer roles"

Step 1: career-biographer
→ Conducts empathetic interview
→ Extracts structured CareerProfile
→ Documents achievements, skills, timeline

Step 2: competitive-cartographer
→ Maps FAANG senior backend landscape
→ Identifies white space and differentiators
→ Generates PositioningStrategy

Step 3: cv-creator
→ Combines CareerProfile + PositioningStrategy
→ Generates ATS-optimized resume
→ Tailors for FAANG technical expectations
→ Outputs multi-format files

Deliverables:
- resume-faang-senior-backend.pdf
- resume-faang-senior-backend.docx
- resume-faang-senior-backend.json
- ats-analysis-faang-senior-backend.md
```

### Standalone Quick Optimization

```
User: "Optimize my resume for this job posting: [URL]"

cv-creator:
1. Fetch job description from URL
2. Extract required keywords and skills
3. Load existing resume (or request CareerProfile)
4. Reorder and emphasize relevant experience
5. Add missing keywords to Core Skills
6. Generate optimized variant
7. Calculate new ATS score
8. Provide recommendations

Output:
- resume-optimized-company-role.pdf
- ATS Score: 89/100 (↑12 points)
- Keyword Coverage: 85% (↑20%)
```

## Output Formats

### PDF Resume

**Characteristics:**
- Print-ready, professional appearance
- ATS-compatible single-column layout
- Standard fonts for universal compatibility
- Optimized for viewing in Adobe Reader, Preview, Chrome

**Use cases:**
- Email applications
- Upload to job boards
- Print for in-person interviews

### DOCX Resume

**Characteristics:**
- Editable in Microsoft Word, Google Docs, LibreOffice
- Preserves formatting with proper styles
- Allows recruiters to make notes/edits

**Use cases:**
- Recruiter submissions (they often edit/reformat)
- Applications requiring Word format
- Template for future updates

### JSON Resume

**Characteristics:**
- Structured data following jsonresume.org schema
- Version-controllable with git
- Programmatically parseable
- Portable across resume builders

**Use cases:**
- Developer portfolios
- Integration with personal websites
- Automated resume generation
- Long-term resume version control

### HTML Resume

**Characteristics:**
- Responsive web design
- Print stylesheet for PDF generation
- Semantic HTML for accessibility
- Optional: Interactive elements (links, hover states)

**Use cases:**
- Personal portfolio websites
- GitHub Pages deployment
- Email signatures (link to live resume)

### Markdown Resume

**Characteristics:**
- Plain text, human-readable
- Version control friendly
- Convertible to HTML, PDF via Pandoc
- Easy to edit in any text editor

**Use cases:**
- Source of truth for resume content
- Git-based resume management
- Rapid updates and iteration

## Common Anti-Patterns

### Anti-Pattern: Creative Resume for Tech Roles

**What it looks like:** Colorful infographics, skill bars, profile photo, two-column layout
**Why it's wrong:** ATS systems can't parse graphics or complex layouts; resume gets filtered out
**What to do instead:** Use Modern Minimalist template with clean, single-column text format

### Anti-Pattern: Generic Objective Statement

**What it looks like:** "Seeking a challenging role in a growth-oriented company..."
**Why it's wrong:** Wastes valuable space, provides no information, sounds like every other resume
**What to do instead:** Use professional summary with specific metrics and target role

### Anti-Pattern: Listing Every Technology Ever Used

**What it looks like:** 40+ skills in Core Skills section, including outdated technologies
**Why it's wrong:** Dilutes expertise, makes it unclear what you're actually proficient in
**What to do instead:** List 15-20 most relevant skills for target role, focus on depth over breadth

### Anti-Pattern: Responsibilities Without Outcomes

**What it looks like:** "Managed a team", "Worked on backend systems", "Responsible for deployments"
**Why it's wrong:** Doesn't show impact, value, or what was actually achieved
**What to do instead:** "Led team of 5 engineers to deliver microservices migration, reducing deployment time by 70%"

### Anti-Pattern: Inconsistent Formatting

**What it looks like:** Mixed date formats (2020-01, Jan 2021, February 2022), different bullet styles, varying fonts
**Why it's wrong:** Looks unprofessional, confuses ATS parsers, harder to scan
**What to do instead:** Maintain strict consistency: same date format, same bullet style, same font throughout

## When to Use

✅ Use cv-creator when:
- Creating a resume from career-biographer data
- Optimizing existing resume for specific job posting
- Generating multiple resume variants for different roles
- Need ATS score and improvement recommendations
- Require multi-format export (PDF, DOCX, JSON Resume)
- Want strategic positioning incorporated (via cartographer)

❌ Do NOT use cv-creator when:
- Writing cover letters (different format and purpose)
- Creating portfolio websites (use web-design-expert)
- LinkedIn profile optimization (update directly)
- Interview preparation (use interview prep skills)
- Career counseling or job search strategy (use career coach skills)

## Troubleshooting

### Issue: ATS Score &lt;70

**Possible causes:**
- Complex formatting (tables, columns, text boxes)
- Graphics or images in resume
- Non-standard fonts or section headers
- Missing critical sections

**Fix:**
1. Switch to Minimalist template
2. Remove all graphics, images, logos
3. Use standard section headers ("Work Experience", "Education")
4. Ensure all required sections present

### Issue: Keyword Coverage &lt;60%

**Possible causes:**
- Not tailoring resume to specific job description
- Using different terminology than job posting
- Skills not explicitly stated in Core Skills section

**Fix:**
1. Extract keywords from job description
2. Add missing keywords to Core Skills (if genuinely possess skill)
3. Incorporate job description language in experience bullets
4. Use exact terminology from posting (e.g., "Kubernetes" not "K8s")

### Issue: Resume Exceeds 2 Pages

**Possible causes:**
- Including every role from entire career
- Too many bullet points per role
- Verbose descriptions

**Fix:**
1. Consolidate older roles (&gt;10 years ago) into single "Early Career" section
2. Limit recent roles to 7-10 bullets, older roles to 3-5 bullets
3. Remove bullet points not relevant to target role
4. Trim each bullet to 1-2 lines maximum
5. Remove optional sections (Volunteer, Hobbies)

### Issue: Professional Summary Sounds Generic

**Possible causes:**
- Not incorporating positioning insights from cartographer
- Using template language instead of specific achievements
- Lacking target role focus

**Fix:**
1. Include specific metric from top achievement
2. Name exact technologies/skills (not "various technologies")
3. State clear career goal or target role
4. Use positioning differentiators from cartographer (if available)

### Issue: Work Experience Bullets Too Long

**Possible causes:**
- Trying to explain entire project in one bullet
- Including unnecessary technical details
- Not editing for conciseness

**Fix:**
1. Split complex achievements into multiple bullets
2. Focus on outcome, not every implementation detail
3. Use strong action verbs to convey more with fewer words
4. Aim for 1 line per bullet (max 2 lines for major achievements)

## Success Metrics

A well-generated resume should achieve:

- **ATS Score**: 85+ out of 100
- **Keyword Coverage**: 80%+ for job-specific variants
- **Length**: 1-2 pages (strict maximum)
- **Parsing Errors**: 0 when tested through ATS simulator
- **Readability**: Scannable in &lt;30 seconds by recruiter
- **Format Compliance**: Passes all formatting checks

## Integration with Other Skills

**Works well with:**

- **career-biographer**: Primary data source for resume content
- **competitive-cartographer**: Strategic positioning for differentiation
- **web-design-expert**: Convert resume to portfolio website
- **typography-expert**: Font selection and visual hierarchy
- **research-analyst**: Research target company for tailoring

## Future Enhancements

1. **AI Bullet Point Generation**: Given project context, auto-generate optimized bullets
2. **A/B Testing Framework**: Track which resume variants get more interviews
3. **Live Job Description Parser**: Paste job URL, get instant ATS optimization
4. **Multi-Language Support**: Generate resumes in multiple languages
5. **Video Resume Generation**: Combine with speech synthesis for video intro
6. **GitHub Stats Integration**: Embed contribution graphs, commit history
7. **Continuous Optimization**: Auto-update templates based on industry trends

## Example Resume Comparison

### Before (Generic Resume)

```
John Doe
Software Engineer

Objective:
Seeking a challenging position in software development where I can utilize my skills.

Experience:
- Worked on various backend systems
- Developed new features
- Fixed bugs and improved code quality

Skills:
Programming, Problem Solving, Team Player, Communication
```

**ATS Score: 45/100**
**Issues:** Generic objective, vague bullets, no metrics, missing keywords

### After (CV Creator Optimized)

```
John Doe | john.doe@email.com | linkedin.com/in/johndoe | github.com/johndoe

PROFESSIONAL SUMMARY
Senior Backend Engineer with 7 years building scalable microservices architectures.
Led migration to event-driven systems serving 5M+ users with 99.99% uptime. Expertise
in Go, Kubernetes, PostgreSQL, and distributed systems. Seeking principal engineering
role focused on infrastructure scalability.

CORE SKILLS
Go, Kubernetes, Docker, PostgreSQL, Redis, Microservices, Event-Driven Architecture,
gRPC, REST APIs, AWS, Terraform, CI/CD, System Design, Performance Optimization

WORK EXPERIENCE

TechCorp Inc | Senior Backend Engineer | June 2020 - Present
• Led microservices migration from monolith, reducing deployment time from 2 hours to 15 minutes and enabling daily releases
• Architected event-driven system processing 500K messages/sec using Kafka, Go, and Kubernetes with 99.99% uptime SLA
• Optimized PostgreSQL query performance through indexing strategy, reducing average query time from 800ms to 120ms (85% improvement)
• Mentored 3 junior engineers through code reviews and architecture discussions, resulting in promotion to mid-level within 12 months

EDUCATION
Bachelor of Science in Computer Science | Stanford University | 2017
```

**ATS Score: 92/100**
**Improvements:** Quantifiable metrics, specific technologies, clear progression, keyword-optimized

## Conclusion

The cv-creator skill transforms structured career narratives into ATS-optimized, professionally formatted resumes that pass both automated screening and human review. By integrating insights from career-biographer (content) and competitive-cartographer (positioning), it creates resumes that significantly improve a candidate's chances of securing interviews in competitive tech hiring markets.
