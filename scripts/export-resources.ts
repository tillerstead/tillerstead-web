#!/usr/bin/env node
/**
 * Tillerstead resource catalog export
 *
 * Standalone replacement for the Evident resource-bridge export pipeline.
 * Writes static JSON resource files under public/resources/.
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

import {
  LAND_USE_CHECKLISTS,
  PROPERTY_RECORD_GUIDES,
  TAX_ASSESSMENT_FACTORS,
} from '../src/lib/resource-provider';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'resources');

type CatalogEntry = {
  id: string;
  title: string;
  tags: string[];
  data: unknown;
  metadata: { source: string; domain: string };
};

function run(): void {
  const entries: CatalogEntry[] = [];

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

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(
    resolve(OUTPUT_DIR, 'catalog.json'),
    JSON.stringify(
      {
        providerId: 'tillerstead',
        domain: 'property',
        resourceTypes: [
          'property.records_overview',
          'property.land_use_checklist',
          'property.tax_assessment',
          'property.environmental_compliance',
        ],
        generatorVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        entries,
      },
      null,
      2
    )
  );

  process.stdout.write(`Tillerstead: exported ${entries.length} entries to ${OUTPUT_DIR}/catalog.json\n`);
}

run();
