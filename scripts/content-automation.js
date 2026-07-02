#!/usr/bin/env node

/**
 * Content Publishing Automation System
 * Automates the workflow from draft → review → publish → distribute
 *
 * Usage: node scripts/content-automation.js <command> [options]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  contentPath: path.join(__dirname, '../_posts'),
  draftPath: path.join(__dirname, '../_drafts'),
  schedulePath: path.join(__dirname, '../_schedule'),
  templatesPath: path.join(__dirname, '../_templates'),

  // Social media templates
  socialPlatforms: ['facebook', 'twitter', 'linkedin', 'instagram'],

  // Publishing schedule (every other week on Mondays)
  publishDays: [1], // Monday = 1
  publishTime: '09:00',

  // Analytics
  analyticsPath: path.join(__dirname, '../_reports/analytics'),
};

// Ensure directories exist
Object.values(CONFIG).forEach(dir => {
  if (typeof dir === 'string' && dir.includes('_')) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
});

/**
 * Content Publishing Automation
 */
class ContentAutomation {
  /**
   * Generate content schedule for next N weeks
   */
  static generateSchedule(weeks = 12) {
    console.log(`\n📅 Generating ${weeks}-week publishing schedule...\n`);

    const schedule = [];
    const today = new Date();
    let currentDate = new Date(today);

    // Find next Monday
    while (currentDate.getDay() !== 1) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate schedule for alternating weeks (every other Monday)
    for (let i = 0; i < weeks; i++) {
      const publishDate = new Date(currentDate);
      publishDate.setDate(currentDate.getDate() + i * 14); // Every 2 weeks

      schedule.push({
        week: i + 1,
        date: publishDate.toISOString().split('T')[0],
        dayOfWeek: 'Monday',
        time: CONFIG.publishTime,
        contentType: this.getContentType(i),
        status: 'scheduled',
      });
    }

    // Save schedule
    const schedulePath = path.join(CONFIG.schedulePath, 'publishing-schedule.json');
    fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));

    console.log('✅ Schedule generated:\n');
    schedule.forEach(item => {
      console.log(`Week ${item.week}: ${item.date} - ${item.contentType}`);
    });

    console.log(`\n📄 Schedule saved to: ${schedulePath}\n`);

    return schedule;
  }

  /**
   * Get content type for week (rotating: blog, case study, video)
   */
  static getContentType(weekIndex) {
    const cycle = weekIndex % 6;
    if (cycle === 0 || cycle === 2 || cycle === 4) return 'Blog Post';
    if (cycle === 1 || cycle === 3) return 'Case Study';
    if (cycle === 5) return 'Video + Blog Post';
    return 'Blog Post';
  }

  /**
   * Create content from template
   */
  static createFromTemplate(type, title, slug) {
    console.log(`\n📝 Creating ${type} from template...\n`);

    const templates = {
      blog: this.getBlogTemplate(),
      'case-study': this.getCaseStudyTemplate(),
      'video-script': this.getVideoTemplate(),
    };

    const template = templates[type];
    if (!template) {
      console.error(`❌ Unknown template type: ${type}`);
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${slug}.md`;
    const filepath = path.join(CONFIG.draftPath, filename);

    const content = template
      .replace(/\{\{TITLE\}\}/g, title)
      .replace(/\{\{DATE\}\}/g, date)
      .replace(/\{\{SLUG\}\}/g, slug);

    fs.writeFileSync(filepath, content);

    console.log(`✅ Created: ${filename}`);
    console.log(`📂 Location: ${filepath}\n`);

    return filepath;
  }

  /**
   * Get blog post template with Tyler's voice and TCNA compliance
   */
  static getBlogTemplate() {
    return `---
layout: post
title: "{{TITLE}}"
meta_title: "{{TITLE}} | Expert Tile Contractor Insights"
meta_description: "{{META_DESCRIPTION}}"
description: "{{DESCRIPTION}}"
date: {{DATE}}
author: "Tyler, Tillerstead LLC"
category: "{{CATEGORY}}"
tags: {{TAGS}}
image: "/assets/img/social/og-image.webp"
featured: true
---

# {{TITLE}}

**Last Updated:** {{DATE}} | **Reading Time:** {{READING_TIME}} minutes

[INTRO - Tyler's Voice Framework]:
- Start with a personal anecdote or observation from 15+ years of tile work
- Include humor or a "war story" that hooks the reader
- Establish credibility (licensed contractor, real experience, not theory)
- Preview what the reader will learn (concrete value prop)
- Use conversational tone: "Look," "Here's the thing," "After 15 years..."

Example Opening:
"Look, I've been installing [topic] in New Jersey for 15 years, and I've seen some *stuff*. The kind of stuff that makes building inspectors cry. [Specific example]. Want to know the difference between [good outcome] and [bad outcome]? [This guide topic]."

## Table of Contents

1. [Why This Matters](#why-matters)
2. [{{SECTION_1}}](#section-1)
3. [{{SECTION_2}}](#section-2)
4. [{{SECTION_3}}](#section-3)
5. [Common Mistakes (And How to Avoid Them)](#common-mistakes)
6. [Pro Tips from the Trenches](#pro-tips)

---

## Why This Matters (And Why Others Get It Wrong) {#why-matters}

[Framework]:
- Explain stakes: What happens if you get this wrong?
- Include cost of mistakes ($X,000-$Y,000)
- Add real example or case study
- Subtle competitor roasting (without naming names)
- Build urgency: Why act now vs. later?

**Technical Accuracy Required:**
- All TCNA method references must be accurate
- NJ HIC requirements must be current
- Building code citations must be verified
- Product recommendations must be legitimate

---

## {{SECTION_1}} {#section-1}

[Content Framework]:
- Use subheadings for scannability
- Include bulleted lists for quick reference
- Add tables for comparisons
- Use checkboxes for checklists
- Include blockquotes for important callouts
- Add humor where appropriate (but stay professional)

**Tyler Voice Elements:**
✅ "Here's what nobody tells you..."
✅ "After 15 years, I can tell you this..."
✅ "You know what's fun? [Sarcastic statement about bad practice]"
✅ "Translation: [Plain English explanation]"
✅ "Run. Fast." (for red flags)

**Technical Requirements:**
- Cite ANSI/TCNA standards where applicable
- Include NJ-specific code requirements
- Reference manufacturer specifications
- Provide cost ranges (be transparent)

---

## {{SECTION_2}} {#section-2}

[War Story Section - Include One Per Post]:

> **Real Talk:** [Brief case study or horror story]
>
> [Details of what went wrong]
> [Financial/structural consequences]
> [What should have been done]
> [Moral of the story]
>
> [Punchline or lesson]

---

## {{SECTION_3}} {#section-3}

[Content continues with Tyler's voice + technical accuracy]

---

## Common Mistakes (And How to Avoid Them) {#common-mistakes}

**❌ WRONG:** [Common misconception or bad practice]  
✅ RIGHT:** [Correct method with TCNA/code reference]

**Cost of Mistake:** $X,XXX-$X,XXX (be specific)

[Repeat for 5-8 common mistakes]

**Pattern to Follow:**
1. State the mistake
2. Explain why it's wrong (technically)
3. Show the correct method
4. Quantify the cost of getting it wrong
5. Add Tyler commentary ("Seriously, don't do this")

---

## Pro Tips from 15 Years in the Trenches {#pro-tips}

💡 **Tip #1:** [Insider knowledge]
- Why it matters
- How to implement
- Expected outcome

[Continue for 5-7 actionable tips]

---

## Final Thoughts: [Wrap-Up Message]

[Framework]:
- Summarize key takeaways (3-5 bullets)
- Reinforce main message
- Call out charlatan contractor red flags
- Build confidence in reader's ability to make informed decision
- Transition to CTA

**Tyler Signature Style:**
"After 15 years of [doing this work], I can tell you this with absolute certainty: [main lesson]. [Supporting statement]. When someone tells you [common bad advice], what they're really saying is [translation]. Run. Fast."

---

## Need Expert Help with {{TOPIC}}?

We're Tillerstead LLC—fully licensed, insured, and we've been [doing this work] in South Jersey for over 15 years.

**What Sets Us Apart:**
- ✅ **Licensed & Insured** - NJ HIC #13VH10808800 ($1M liability)
- ✅ **TCNA-Compliant Methods** - Every project built to last 30+ years
- ✅ **Transparent Pricing** - No surprises, no hidden fees
- ✅ **5-Star Reviews** - Check Google (we don't ghost our clients)
- ✅ **15+ Years Experience** - Still here, still answering our phone

**📞 Get Your Free Consultation:**
- **Call/Text:** [(609) 862-8808](tel:+16098628808)
- **Email:** info@tillerstead.com
- **Schedule Online:** [Book Your Free Estimate](https://tillerstead.com/contact)

**🌍 Service Areas:** Atlantic County, Ocean County, Cape May County, and surrounding South Jersey communities.

---

**Related Articles:**
- [Link to related post 1]
- [Link to related post 2]
- [Link to related post 3]

**Verify Our License:** [NJ Consumer Affairs](https://newjersey.mylicense.com/verification/)

---

**SEO REQUIREMENTS (Fill Before Publishing):**
- Primary Keyword: {{PRIMARY_KEYWORD}}
- Secondary Keywords: {{SECONDARY_KEYWORDS}}
- Meta Description: 150-160 characters, include primary keyword
- Image Alt Text: Descriptive, includes primary keyword
- Internal Links: Minimum 3-5 to other blog posts/service pages
- External Links: 1-2 authoritative sources (TCNA, NJ.gov)
- Schema Markup: Auto-added via post layout

**CONTENT QUALITY CHECKLIST:**
- [ ] 2,500-3,500 words minimum
- [ ] Tyler's voice consistent throughout
- [ ] Technical accuracy verified (TCNA/NJ HIC compliant)
- [ ] At least one war story or case study
- [ ] Humor/sass present but professional
- [ ] Actionable takeaways clear
- [ ] All cost ranges researched and accurate
- [ ] Call-to-action strong and specific
- [ ] Read-aloud test passed (sounds conversational)
- [ ] Competitor-neutral (no direct attacks)
- [ ] Homeowner-protective (warning about red flags)

*Last Updated: {{DATE}}*
`;
  }

  /**
   * Get case study template
   */
  static getCaseStudyTemplate() {
    return `---
layout: post
title: "{{TITLE}}"
meta_title: "{{TITLE}} | Tillerstead Case Study"
meta_description: ""
description: ""
date: {{DATE}}
author: "Tillerstead LLC"
category: "Case Studies"
tags: []
image: "/assets/img/social/og-image.webp"
featured: true
---

# {{TITLE}}

**Project Location:**  
**Completion Date:**  
**Project Duration:**  
**Project Type:**  

---

## Project Overview

[Introduction]

---

## The Problems

- Problem 1
- Problem 2
- Problem 3

---

## Client Goals

**Must-Haves:**
1. 
2. 
3. 

**Budget:** 

---

## Design Solution

[Solution details]

---

## Timeline & Process

### Week 1: [Phase]
- Day 1:
- Day 2:

---

## Cost Breakdown

| Category | Cost |
|----------|------|
| Materials | $ |
| Labor | $ |
| **Total** | **$** |

---

## Client Feedback

> "[Testimonial]"  
> — Client Name, Location

**Rating:** ⭐⭐⭐⭐⭐ (5/5)

---

**Project completed [DATE] | Licensed NJ HIC #13VH10808800**
`;
  }

  /**
   * Get video script template
   */
  static getVideoTemplate() {
    return `# Video Script: {{TITLE}}

**Duration:** X minutes  
**Format:**  
**Target Audience:**  

---

## Opening (0:00-0:30)

**Visual:**  
**Voice-Over:**
> 

---

## [Section] (0:30-X:XX)

**Visual:**  
**Voice-Over:**
> 

---

## Closing

**CTA:**
`;
  }

  /**
   * Generate social media posts for content
   */
  static generateSocialPosts(contentFile) {
    console.log(`\n📱 Generating social media posts...\n`);

    // Read content file
    const content = fs.readFileSync(contentFile, 'utf8');
    const frontmatter = this.parseFrontmatter(content);

    const posts = {
      facebook: this.generateFacebookPost(frontmatter),
      twitter: this.generateTwitterPost(frontmatter),
      linkedin: this.generateLinkedInPost(frontmatter),
      instagram: this.generateInstagramPost(frontmatter),
    };

    // Save to file
    const slug = path.basename(contentFile, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const socialPath = path.join(CONFIG.schedulePath, `social-${slug}.json`);
    fs.writeFileSync(socialPath, JSON.stringify(posts, null, 2));

    console.log('✅ Social media posts generated:\n');
    Object.entries(posts).forEach(([platform, post]) => {
      console.log(`${platform.toUpperCase()}:`);
      console.log(post.text.substring(0, 100) + '...\n');
    });

    console.log(`📄 Saved to: ${socialPath}\n`);

    return posts;
  }

  /**
   * Parse frontmatter from markdown
   */
  static parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match) return {};

    const fm = {};
    match[1].split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        fm[key.trim()] = valueParts
          .join(':')
          .trim()
          .replace(/^["']|["']$/g, '');
      }
    });

    return fm;
  }

  /**
   * Generate Facebook post
   */
  static generateFacebookPost(frontmatter) {
    return {
      platform: 'facebook',
      text: `📖 New Blog Post: ${frontmatter.title}

${frontmatter.description || frontmatter.meta_description}

Learn more and get expert insights on our blog 👇

#TileContractor #BathroomRemodel #HomeImprovement #SouthJersey #NJ`,
      link: `https://tillerstead.com/blog/${frontmatter.date}-${frontmatter.slug || ''}`,
      image: frontmatter.image || '/assets/img/social/og-image.webp',
      cta: 'Learn More',
    };
  }

  /**
   * Generate Twitter post
   */
  static generateTwitterPost(frontmatter) {
    const shortTitle = frontmatter.title.substring(0, 100);
    return {
      platform: 'twitter',
      text: `🔧 ${shortTitle}

${(frontmatter.description || '').substring(0, 150)}

Read more ↓

#TileWork #Waterproofing #HomeReno #NJContractor`,
      link: `https://tillerstead.com/blog/`,
      image: frontmatter.image,
    };
  }

  /**
   * Generate LinkedIn post
   */
  static generateLinkedInPost(frontmatter) {
    return {
      platform: 'linkedin',
      text: `${frontmatter.title}

As a licensed New Jersey Home Improvement Contractor, we believe in transparency and education. This comprehensive guide covers everything homeowners and contractors need to know about ${frontmatter.title.toLowerCase()}.

Key takeaways:
• [Bullet point 1]
• [Bullet point 2]
• [Bullet point 3]

Read the full article and learn how TCNA-compliant installation protects your investment.

#ConstructionIndustry #TileInstallation #Waterproofing #NewJersey #HomeImprovement`,
      link: `https://tillerstead.com/blog/`,
      image: frontmatter.image,
    };
  }

  /**
   * Generate Instagram post caption
   */
  static generateInstagramPost(frontmatter) {
    return {
      platform: 'instagram',
      text: `📚 NEW BLOG POST 📚

${frontmatter.title}

${(frontmatter.description || '').substring(0, 100)}...

Swipe to see key highlights 👉
Link in bio for full article ☝️

.
.
.
#tillerstead #tileinstallation #bathroomremodel #homeimprovement #southjersey #atlanticcounty #oceancounty #capemay #njcontractor #tcna #waterproofing #beforeandafter #homerenovation #contractorlife`,
      images: [frontmatter.image],
      carousel: true,
    };
  }

  /**
   * Generate email newsletter
   */
  static generateNewsletter(contentFiles) {
    console.log(`\n📧 Generating email newsletter...\n`);

    const newsletter = {
      subject: '',
      preheader: '',
      date: new Date().toISOString().split('T')[0],
      articles: [],
      footer: this.getEmailFooter(),
    };

    contentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const fm = this.parseFrontmatter(content);

      newsletter.articles.push({
        title: fm.title,
        description: fm.description || fm.meta_description,
        link: `https://tillerstead.com/blog/`,
        image: fm.image,
        cta: 'Read More',
      });
    });

    // Generate subject based on main article
    if (newsletter.articles.length > 0) {
      newsletter.subject = `New: ${newsletter.articles[0].title}`;
      newsletter.preheader = newsletter.articles[0].description.substring(0, 100);
    }

    // Save newsletter
    const newsletterPath = path.join(CONFIG.schedulePath, `newsletter-${newsletter.date}.json`);
    fs.writeFileSync(newsletterPath, JSON.stringify(newsletter, null, 2));

    console.log('✅ Newsletter generated');
    console.log(`Subject: ${newsletter.subject}`);
    console.log(`Articles: ${newsletter.articles.length}`);
    console.log(`📄 Saved to: ${newsletterPath}\n`);

    return newsletter;
  }

  /**
   * Get email footer template
   */
  static getEmailFooter() {
    return {
      company: 'Tillerstead LLC',
      license: 'Licensed NJ HIC #13VH10808800',
      phone: '(609) 862-8808',
      email: 'contact@tillerstead.com',
      website: 'https://tillerstead.com',
      serviceAreas: 'Atlantic, Ocean & Cape May Counties, NJ',
      unsubscribe: 'https://tillerstead.com/unsubscribe',
    };
  }

  /**
   * Create publishing checklist
   */
  static createPublishingChecklist(contentFile) {
    const checklist = `# Content Publishing Checklist

## Pre-Publishing

### Content Quality
- [ ] Title is compelling and SEO-optimized (60 chars max)
- [ ] Meta description is persuasive (155 chars max)
- [ ] Featured image selected/created (1200x630px)
- [ ] Internal links added (3-5 minimum)
- [ ] External links verified (working)
- [ ] Grammar/spelling checked (Grammarly)
- [ ] Readability score good (Hemingway)
- [ ] Schema markup included (Article type)

### SEO Optimization
- [ ] Primary keyword in title
- [ ] Primary keyword in H1
- [ ] Primary keyword in first paragraph
- [ ] Keywords in headings (H2/H3)
- [ ] Alt text on all images
- [ ] URL slug optimized
- [ ] Related keywords integrated naturally

### Technical
- [ ] Markdown syntax valid
- [ ] Frontmatter complete
- [ ] Code blocks formatted
- [ ] Tables rendering correctly
- [ ] Build test passed (npm run build)

---

## Publishing Day

### Deploy
- [ ] Move from _drafts to _posts
- [ ] Set correct publish date
- [ ] Git commit and push
- [ ] Verify live on production
- [ ] Test all links on live page

### Distribution - Social Media
- [ ] Facebook post scheduled
- [ ] Twitter/X post scheduled
- [ ] LinkedIn post scheduled
- [ ] Instagram carousel created
- [ ] Google Business Profile post

### Distribution - Email
- [ ] Newsletter drafted
- [ ] Email list segmented
- [ ] Preview test sent
- [ ] Scheduled for send

### Analytics Setup
- [ ] Google Search Console notified
- [ ] Google Analytics tagged
- [ ] Conversion tracking verified
- [ ] UTM parameters added (if paid promotion)

---

## Post-Publishing (Week 1)

### Monitoring
- [ ] Check Google Search Console indexing
- [ ] Monitor keyword rankings
- [ ] Track social engagement
- [ ] Review traffic in Analytics
- [ ] Respond to comments/questions

### Amplification
- [ ] Share in relevant Facebook groups
- [ ] Post in LinkedIn industry groups
- [ ] Answer related questions on Reddit/Quora
- [ ] Email to customer list (if haven't already)

### Optimization
- [ ] Review top exit pages (fix if this page)
- [ ] A/B test different CTAs (if low conversion)
- [ ] Update internal links from older posts
- [ ] Create follow-up content based on engagement

---

## Ongoing (Monthly)

### Performance Review
- [ ] Traffic analysis (compared to other posts)
- [ ] Conversion tracking (leads generated)
- [ ] Keyword ranking progress
- [ ] Engagement metrics (time on page, bounce rate)
- [ ] Social shares and backlinks

### Updates
- [ ] Update statistics/data (if outdated)
- [ ] Refresh for seasonal relevance
- [ ] Add new sections based on comments/questions
- [ ] Re-promote top-performing content

---

## Notes

**Published:** [DATE]  
**Primary Keyword:** [KEYWORD]  
**Target Traffic:** [GOAL]  
**Initial Rank:** [POSITION]  
**Comments:**

---

*Generated by Content Automation System*
`;

    const checklistPath = path.join(
      CONFIG.schedulePath,
      `checklist-${path.basename(contentFile, '.md')}.md`
    );

    fs.writeFileSync(checklistPath, checklist);
    console.log(`✅ Publishing checklist created: ${checklistPath}\n`);

    return checklistPath;
  }

  /**
   * Generate analytics report template
   */
  static createAnalyticsReport() {
    const report = `# Content Performance Report
**Report Period:** [START DATE] - [END DATE]

---

## Executive Summary

**Key Metrics:**
- Total Organic Traffic: [NUMBER] visitors
- Total Leads Generated: [NUMBER]
- Conversion Rate: [PERCENT]%
- Top Performing Post: [TITLE]

---

## Traffic Analysis

### Overall Traffic
| Metric | This Period | Last Period | Change |
|--------|-------------|-------------|--------|
| Sessions | | | |
| Users | | | |
| Pageviews | | | |
| Avg Session Duration | | | |
| Bounce Rate | | | |

### Top 10 Posts by Traffic
| Post | Sessions | Users | Avg Time | Bounce % |
|------|----------|-------|----------|----------|
| 1. | | | | |
| 2. | | | | |
| 3. | | | | |

---

## SEO Performance

### Keyword Rankings
| Keyword | Position | Change | Traffic | Difficulty |
|---------|----------|--------|---------|------------|
| | | | | |

### Google Search Console
- Total Impressions: [NUMBER]
- Total Clicks: [NUMBER]
- CTR: [PERCENT]%
- Average Position: [NUMBER]

---

## Conversion Analysis

### Lead Generation
| Source | Leads | Close Rate | Revenue |
|--------|-------|-----------|---------|
| Blog Posts | | | |
| Case Studies | | | |
| Videos | | | |

### Top Converting Posts
| Post | Visitors | Leads | Conv % |
|------|----------|-------|--------|
| 1. | | | |

---

## Content Production

**Published This Period:**
- Blog Posts: [NUMBER]
- Case Studies: [NUMBER]
- Videos: [NUMBER]

**Total Content Library:**
- Blog Posts: [NUMBER]
- Case Studies: [NUMBER]
- Videos: [NUMBER]

---

## Social Media Performance

| Platform | Reach | Engagement | Clicks | Leads |
|----------|-------|------------|--------|-------|
| Facebook | | | | |
| LinkedIn | | | | |
| Instagram | | | | |
| YouTube | | | | |

---

## Recommendations

### What's Working
1. 
2. 
3. 

### Needs Improvement
1. 
2. 
3. 

### Action Items
- [ ] 
- [ ] 
- [ ] 

---

*Report generated: [DATE]*
`;

    const reportPath = path.join(CONFIG.analyticsPath, `content-report-template.md`);
    fs.writeFileSync(reportPath, report);
    console.log(`✅ Analytics report template created: ${reportPath}\n`);

    return reportPath;
  }
}

/**
 * CLI Interface
 */
const commands = {
  schedule: () => ContentAutomation.generateSchedule(26), // 6 months
  template: (type, title, slug) => ContentAutomation.createFromTemplate(type, title, slug),
  social: file => ContentAutomation.generateSocialPosts(file),
  newsletter: (...files) => ContentAutomation.generateNewsletter(files),
  checklist: file => ContentAutomation.createPublishingChecklist(file),
  analytics: () => ContentAutomation.createAnalyticsReport(),

  help: () => {
    console.log(`
📋 Content Automation System - Commands

USAGE:
  node scripts/content-automation.js <command> [options]

COMMANDS:
  schedule              Generate 26-week publishing schedule
  template <type> <title> <slug>   Create content from template
                        Types: blog, case-study, video-script
  social <file>         Generate social media posts for content
  newsletter <files>    Generate email newsletter from content
  checklist <file>      Create publishing checklist for content
  analytics             Create analytics report template
  help                  Show this help message

EXAMPLES:
  npm run automate schedule
  npm run automate template blog "Title Here" "slug-here"
  npm run automate social _posts/2026-01-27-example.md
  npm run automate newsletter _posts/*.md
  npm run automate checklist _posts/2026-01-27-example.md
  npm run automate analytics

WORKFLOW:
  1. Generate schedule → Know what to publish when
  2. Create from template → Start with structure
  3. Write content → Fill in details
  4. Generate social → Auto-create distribution posts
  5. Create checklist → Ensure quality control
  6. Publish → Deploy to production
  7. Track analytics → Measure performance
`);
  },
};

// Execute command
const [, , command, ...args] = process.argv;

if (!command || !commands[command]) {
  commands.help();
  process.exit(0);
}

try {
  commands[command](...args);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}

export default ContentAutomation;
