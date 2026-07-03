/**
 * Tillerstead — static public resource data
 *
 * Standalone replacement for the Evident resource-bridge/provider-sdk types.
 * This file exports plain data used by the public site; no external dependencies.
 */

type ConfidenceLevel = 'high' | 'medium' | 'low';

type ResourceSource = {
  name: string;
  url?: string;
  authority?: string;
};

type ResourceResult = {
  id: string;
  title: string;
  summary?: string;
  data: unknown;
};

type ResourceQuery = {
  resourceType?: string;
  jurisdiction?: string;
  id?: string;
};

export const PROPERTY_RECORD_GUIDES = [
  {
    id: 'nj-property-records',
    title: 'New Jersey property records intake',
    county: 'statewide',
    summary:
      'Collect deed chain, parcel identifiers, tax cards, permits, surveys, and recorded easements before evaluating a dispute.',
    records: ['deed history', 'tax card', 'parcel map', 'permit log', 'survey'],
  },
  {
    id: 'improvement-documentation',
    title: 'Improvement evidence package',
    county: 'statewide',
    summary:
      'Pair before/after photos, contracts, invoices, inspection notes, and code references for each phase of work.',
    records: ['contracts', 'change orders', 'inspection notes', 'photos', 'material invoices'],
  },
] as const;

export const LAND_USE_CHECKLISTS = [
  {
    id: 'lot-clearing',
    activity: 'lot-clearing',
    jurisdiction: 'NJ',
    checklist: [
      'Confirm zoning district and principal permitted use.',
      'Review tree removal, stormwater, and grading permit thresholds.',
      'Document neighboring setbacks, drainage paths, and utility conflicts.',
      'Preserve contractor logs, deliveries, and disposal receipts.',
    ],
  },
  {
    id: 'bath-remodel',
    activity: 'bathroom-remodel',
    jurisdiction: 'NJ',
    checklist: [
      'Verify permit scope for plumbing, electrical, and structural changes.',
      'Document waterproofing assembly, inspection dates, and approved materials.',
      'Retain lien-waiver and progress-payment milestones.',
      'Track punch-list completion against contract language.',
    ],
  },
] as const;

export const TAX_ASSESSMENT_FACTORS = [
  'parcel size and usable area',
  'improvement age and finish quality',
  'permitted versus unpermitted additions',
  'comparable sales and neighborhood adjustment',
  'stormwater, wetlands, or access limitations',
] as const;

export const TILLERSTEAD_PROVIDER_DESCRIPTOR = {
  providerId: 'tillerstead',
  providerName: 'Tillerstead',
  contractVersion: '1.0.0',
  resourceTypes: [
    'property.records_overview',
    'property.land_use_checklist',
    'property.tax_assessment',
    'property.environmental_compliance',
  ],
} as const;

export async function handleResourceQuery(query: ResourceQuery): Promise<{
  results: ResourceResult[];
  sources: ResourceSource[];
  confidence: ConfidenceLevel;
  limitations?: string[];
}> {
  const results: ResourceResult[] = [];

  if (!query.resourceType || query.resourceType.includes('records')) {
    for (const guide of PROPERTY_RECORD_GUIDES) {
      results.push({
        id: `records-${guide.id}`,
        title: guide.title,
        summary: guide.summary,
        data: guide,
      });
    }
  }

  if (!query.resourceType || query.resourceType.includes('land_use')) {
    for (const checklist of LAND_USE_CHECKLISTS) {
      results.push({
        id: `land-use-${checklist.id}`,
        title: `${checklist.activity} land-use checklist`,
        data: checklist,
      });
    }
  }

  if (!query.resourceType || query.resourceType.includes('tax_assessment')) {
    results.push({
      id: 'tax-assessment-factors',
      title: 'Property tax assessment factors',
      data: { factors: TAX_ASSESSMENT_FACTORS },
    });
  }

  return {
    results,
    sources: [{ name: 'Tillerstead public guides', authority: 'tillerstead.com' }],
    confidence: 'high',
    limitations: ['Static reference data only — not a legal or tax opinion.'],
  };
}
