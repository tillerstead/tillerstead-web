import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCatalog, writeCatalog } from '@evident-technologies/resource-bridge/export';
import type { ResourceCatalogEntry } from '@evident-technologies/types/schemas';

import {
  LAND_USE_CHECKLISTS,
  PROPERTY_RECORD_GUIDES,
  TAX_ASSESSMENT_FACTORS,
} from '../src/lib/resource-provider';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'resources');
const META_JSON = resolve(__dirname, '..', 'product.meta.json');

function run(): void {
  const entries: ResourceCatalogEntry[] = [];

  for (const guide of PROPERTY_RECORD_GUIDES) {
    entries.push({
      id: `records-${guide.id}`,
      title: guide.title,
      tags: ['property', 'records', guide.county],
      data: guide,
      metadata: { source: 'property-record-guides', domain: 'property' },
    });
  }

  for (const checklist of LAND_USE_CHECKLISTS) {
    entries.push({
      id: `land-use-${checklist.id}`,
      title: `${checklist.activity} land-use checklist`,
      tags: ['property', 'land-use', checklist.activity],
      data: checklist,
      metadata: { source: 'land-use-checklists', domain: 'property' },
    });
  }

  entries.push({
    id: 'tax-assessment-factors',
    title: 'Property tax assessment factors',
    tags: ['property', 'tax-assessment'],
    data: { factors: TAX_ASSESSMENT_FACTORS },
    metadata: { source: 'assessment-guide', domain: 'property' },
  });

  const catalog = buildCatalog({
    providerId: 'tillerstead',
    domain: 'property',
    resourceTypes: [
      'property.records_overview',
      'property.land_use_checklist',
      'property.tax_assessment',
      'property.environmental_compliance',
    ],
    generatorVersion: '0.0.0',
    entries,
  });

  writeCatalog(catalog, OUTPUT_DIR, META_JSON);
  process.stdout.write(`Tillerstead: exported ${entries.length} entries\n`);
}

run();
