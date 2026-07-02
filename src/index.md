---
layout: layouts/base.njk
templateEngineOverride: njk
title: Home
description: Professional home improvement and land stewardship services for New Jersey homeowners and contractors.
meta_description: 'Contract remodeling for New Jersey interiors: bathroom updates, flooring installation, backsplash packages, and selective demolition plus prep.'
permalink: false
---

{# Hero Section #}
{% set hero = {
  eyebrow: "Rebuilding for Service",
  title: "Professional Home Improvement for New Jersey",
  subtitle: "Licensed general contractor focused on contract remodeling scopes: bathrooms, flooring, kitchen backsplash, selective demolition, and finish installs. Quality workmanship. Transparent pricing.",
  cta_text: "Request Early Access",
  cta_href: "/early-access",
  secondary_cta: { text: "Learn More", href: "/services/" }
} %}
{% include "components/hero.njk" %}

{# Services Overview #}

<section class="py-16 md:py-24 bg-white">
  <div class="mx-auto max-w-6xl px-6">

    <div class="max-w-2xl mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Services</h2>
      <p class="text-lg text-slate-600">
        From bathrooms and flooring to backsplash and interior prep work, Tillerstead delivers contract remodeling scopes with clear communication and accountable execution.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

      {# Service 1: Tile Systems #}
      {% set card = {
        icon: "tools",
        title: "Tile & Waterproofing Systems",
        description: "TCNA-aware tile layout, shower waterproofing, substrate prep, and interior surface installation.",
        href: "/guides/tcna-tile-interior"
      } %}
      {% include "components/service-card.njk" %}

      {# Service 2: Renovation #}
      {% set card = {
        icon: "tools",
        title: "Home Renovation",
        description: "Kitchen and bathroom remodels, whole-home renovations, and custom improvements tailored to your vision.",
        href: "/guides/renovation"
      } %}
      {% include "components/service-card.njk" %}

      {# Service 3: Demo & Prep #}
      {% set card = {
        icon: "shield-check",
        title: "Selective Demo & Prep",
        description: "Controlled demolition, substrate correction, moisture prep, and jobsite protection before finish installation.",
        href: "/guides/repairs"
      } %}
      {% include "components/service-card.njk" %}

      {# Service 4: Finish Installation #}
      {% set card = {
        icon: "guide",
        title: "Finish Installation",
        description: "Bathroom finish packages, flooring installs, kitchen backsplash systems, trim and close-out detail work.",
        href: "/guides/renovation"
      } %}
      {% include "components/service-card.njk" %}

      {# Service 5: Estimates & Consulting #}
      {% set card = {
        icon: "calculation",
        title: "Free Estimates",
        description: "Detailed project assessments, cost estimates, and expert consulting to help you make informed decisions.",
        href: "/early-access"
      } %}
      {% include "components/service-card.njk" %}

      {# Service 6: Tools & Resources #}
      {% set card = {
        icon: "calculation",
        title: "Tools & Guides",
        description: "Tile calculators, interior estimators, and planning guides for bathroom, flooring, and backsplash scopes.",
        href: "/tools/"
      } %}
      {% include "components/service-card.njk" %}

    </div>

  </div>
</section>

{# Features Section #}

<section class="py-16 md:py-24 bg-slate-50">
  <div class="mx-auto max-w-6xl px-6">

    <div class="max-w-2xl mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Tillerstead?</h2>
      <p class="text-lg text-slate-600">
        We combine disciplined project sequencing, transparent scope control, and clean finish standards to deliver dependable remodeling outcomes.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

      {# Feature: Licensed & Insured #}
      <div class="flex gap-4">
        <div class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Licensed & Insured</h4>
          <p class="text-slate-600 text-sm">Full general contractor licensing and comprehensive insurance coverage for your protection.</p>
        </div>
      </div>

      {# Feature: Quality Workmanship #}
      <div class="flex gap-4">
        <div class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m2-1l-2-1m2 1v2.5"></path>
          </svg>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Scope Discipline</h4>
          <p class="text-slate-600 text-sm">Defined work phases, documented changes, and measurable completion criteria from demo through install.</p>
        </div>
      </div>

      {# Feature: Transparent Pricing #}
      <div class="flex gap-4">
        <div class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Transparent Pricing</h4>
          <p class="text-slate-600 text-sm">Line-item proposals tied to scope phases so bathroom, flooring, and backsplash costs stay legible.</p>
        </div>
      </div>

      {# Feature: Expert Resources #}
      <div class="flex gap-4">
        <div class="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
          </svg>
        </div>
        <div>
          <h4 class="font-semibold text-slate-900 mb-2">Remodeling Resources</h4>
          <p class="text-slate-600 text-sm">Guides and calculators built around real interior contracting scopes and install workflows.</p>
        </div>
      </div>

    </div>

  </div>
</section>

{# Tools Section #}

<section class="py-16 md:py-24 bg-white">
  <div class="mx-auto max-w-6xl px-6">

    <div class="max-w-2xl mb-12">
      <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Contractor Tools</h2>
      <p class="text-lg text-slate-600">Use our calculators and estimators to plan demolition, prep, and finish installation with realistic quantities and sequencing.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

      {# Calculator links #}
      <a href="/tools/tcna-tile-calculator" class="p-6 rounded-lg border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all">
        <h4 class="font-semibold text-slate-900 mb-2">TCNA Tile Calculator</h4>
        <p class="text-slate-600 text-sm">Estimate tile quantity, coverage, waste, and setting material for interior installations.</p>
      </a>

      <a href="/tools/material-estimator" class="p-6 rounded-lg border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all">
        <h4 class="font-semibold text-slate-900 mb-2">Material Estimator</h4>
        <p class="text-slate-600 text-sm">Calculate material needs for bathroom packages, flooring replacement, and backsplash runs.</p>
      </a>

      <a href="/tools/project-planner" class="p-6 rounded-lg border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all">
        <h4 class="font-semibold text-slate-900 mb-2">Project Planner</h4>
        <p class="text-slate-600 text-sm">Plan your project timeline, budget, and milestones with our simple planner.</p>
      </a>

      <a href="/guides/" class="p-6 rounded-lg border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all">
        <h4 class="font-semibold text-slate-900 mb-2">Homeowner Guides</h4>
        <p class="text-slate-600 text-sm">Learn about TCNA tile standards, interior renovation planning, selective demo, and finish installation best practices.</p>
      </a>

    </div>

  </div>
</section>

{# CTA Section #}

<section class="py-16 md:py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
  <div class="mx-auto max-w-4xl px-6 text-center">

    <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Remodel?</h2>
    <p class="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
      Request early access to get scope planning for bathroom, flooring, backsplash, and interior installation projects.
    </p>

    <a href="/early-access" class="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-amber-500 text-slate-950 font-semibold hover:bg-amber-400 transition-colors">
      Request Early Access
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
      </svg>
    </a>

  </div>
</section>
