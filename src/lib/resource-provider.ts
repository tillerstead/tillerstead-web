import { createResourceProvider } from '@evident-technologies/resource-bridge/provider-sdk';
import type {
  ConfidenceLevel,
  ResourceQuery,
  ResourceResult,
  ResourceSource,
} from '@evident-technologies/types';

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

type HandlerResult = {
  results: ResourceResult[];
  sources: ResourceSource[];
  confidence: ConfidenceLevel;
  limitations?: string[];
};

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

export async function handleResourceQuery(query: ResourceQuery): Promise<HandlerResult> {
  switch (query.queryType) {
    case 'property.records_overview':
      return handlePropertyRecords(query);
    case 'property.land_use_checklist':
      return handleLandUseChecklist(query);
    case 'property.tax_assessment':
      return handleTaxAssessment(query);
    case 'property.environmental_compliance':
      return handleEnvironmentalCompliance(query);
    default:
      throw new Error(`Unsupported query type: ${query.queryType}`);
  }
}

async function handlePropertyRecords(_query: ResourceQuery): Promise<HandlerResult> {
  return {
    results: PROPERTY_RECORD_GUIDES.map(guide => ({
      resultId: `records-${guide.id}`,
      title: guide.title,
      relevance: 0.9,
      data: guide,
    })),
    sources: [
      {
        name: 'Tillerstead property records guide',
        retrievedAt: new Date().toISOString(),
        license: 'Proprietary',
        sourceConfidence: 'medium',
      },
    ],
    confidence: 'medium',
    limitations: [
      'Guides are optimized for intake and dispute preparation, not direct county filing automation.',
    ],
  };
}

async function handleLandUseChecklist(query: ResourceQuery): Promise<HandlerResult> {
  const { activity } = query.parameters as { activity?: string };
  const matches = LAND_USE_CHECKLISTS.filter(item => !activity || item.activity === activity);

  return {
    results: matches.map(item => ({
      resultId: `land-use-${item.id}`,
      title: `${item.activity} checklist`,
      relevance: 1,
      data: item,
    })),
    sources: [
      {
        name: 'Tillerstead land-use checklist library',
        retrievedAt: new Date().toISOString(),
        license: 'Proprietary',
        sourceConfidence: 'medium',
      },
    ],
    confidence: matches.length > 0 ? 'medium' : 'low',
    limitations: [
      'Users should confirm municipal zoning, NJDEP, and permit triggers with local authorities before work begins.',
    ],
  };
}

async function handleTaxAssessment(query: ResourceQuery): Promise<HandlerResult> {
  const { municipality } = query.parameters as { municipality?: string };
  return {
    results: [
      {
        resultId: `tax-assessment-${municipality ?? 'general'}`,
        title: municipality ? `${municipality} tax assessment factors` : 'Tax assessment factors',
        relevance: 1,
        data: {
          municipality: municipality ?? null,
          factors: TAX_ASSESSMENT_FACTORS,
          evidencePackage: [
            'assessment notice',
            'prior year card',
            'photos',
            'repair estimates',
            'comparable sales',
          ],
        },
      },
    ],
    sources: [
      {
        name: 'Tillerstead assessment review guide',
        retrievedAt: new Date().toISOString(),
        license: 'Proprietary',
        sourceConfidence: 'medium',
      },
    ],
    confidence: 'medium',
    limitations: [
      'Assessment guidance is a preparation aid and does not replace appraisal or tax appeal counsel.',
    ],
  };
}

async function handleEnvironmentalCompliance(query: ResourceQuery): Promise<HandlerResult> {
  const { activity } = query.parameters as { activity?: string };
  return {
    results: [
      {
        resultId: `environmental-${activity ?? 'general'}`,
        title: 'Environmental and site-prep compliance',
        relevance: 1,
        data: {
          activity: activity ?? null,
          checklist: [
            'Review runoff, erosion, and stormwater impacts.',
            'Identify wetlands, floodplain, and buffer restrictions.',
            'Preserve disposal manifests and material safety information.',
            'Photograph preexisting grade, vegetation, and drainage conditions.',
          ],
        },
      },
    ],
    sources: [
      {
        name: 'Tillerstead environmental compliance notes',
        retrievedAt: new Date().toISOString(),
        license: 'Proprietary',
        sourceConfidence: 'medium',
      },
    ],
    confidence: 'medium',
    limitations: [
      'NJDEP-specific permitting thresholds are summarized here and should be verified against current local conditions.',
    ],
  };
}

export const tillersteadProvider = createResourceProvider({
  providerId: TILLERSTEAD_PROVIDER_DESCRIPTOR.providerId,
  providerName: TILLERSTEAD_PROVIDER_DESCRIPTOR.providerName,
  contractVersion: TILLERSTEAD_PROVIDER_DESCRIPTOR.contractVersion,
  handlers: {
    'property.records_overview': handlePropertyRecords,
    'property.land_use_checklist': handleLandUseChecklist,
    'property.tax_assessment': handleTaxAssessment,
    'property.environmental_compliance': handleEnvironmentalCompliance,
  },
});
