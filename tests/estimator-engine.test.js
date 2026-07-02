/**
 * Estimator Engine Unit Tests
 * Tests core geometry, tile estimation, and material calculations
 * from assets/js/estimator-engine.js
 *
 * Run: node --input-type=commonjs tests/estimator-engine.test.cjs
 *   OR: node tests/run-estimator-tests.mjs (wrapper)
 */

// Simulate browser global (set by run-estimator-tests.mjs wrapper)
// globalThis.window should already be set.
if (typeof window === 'undefined') globalThis.window = globalThis;

const E = window.TillersteadEstimator;
let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('FAIL:', msg);
  }
}

function assertClose(actual, expected, tolerance, msg) {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
  } else {
    failed++;
    console.error('FAIL:', msg, '— got', actual, 'expected', expected);
  }
}

// ═══════════════════════════════════════════════════
// UNIT CONVERSION
// ═══════════════════════════════════════════════════

assert(E.toDecimalFeet({ feet: 10, inches: 0 }) === 10, 'toDecimalFeet 10ft 0in');
assert(E.toDecimalFeet({ feet: 10, inches: 6 }) === 10.5, 'toDecimalFeet 10ft 6in');
assert(E.toDecimalFeet({ feet: 0, inches: 0 }) === 0, 'toDecimalFeet 0ft 0in');
assert(E.toDecimalFeet(null) === 0, 'toDecimalFeet null');

assert(E.sqInToSqFt(144) === 1, 'sqInToSqFt 144 = 1');
assertClose(E.sqInToSqFt(288), 2, 0.001, 'sqInToSqFt 288 = 2');

assert(E.roundUp(3.1) === 4, 'roundUp 3.1 = 4');
assert(E.roundUp(3) === 3, 'roundUp 3 = 3');

assertClose(E.withWaste(100, 10), 110, 0.001, 'withWaste 100 + 10% = 110');
assertClose(E.withWaste(100, 25), 125, 0.001, 'withWaste 100 + 25% = 125');

assert(E.packsNeeded(25, 10) === 3, 'packsNeeded 25/10 = 3');
assert(E.packsNeeded(20, 10) === 2, 'packsNeeded 20/10 = 2');

// ═══════════════════════════════════════════════════
// WASTE PROFILES
// ═══════════════════════════════════════════════════

assert(E.WASTE_PROFILES.straight.baseWastePercent === 10, 'straight base waste 10%');
assert(E.WASTE_PROFILES.herringbone.baseWastePercent === 25, 'herringbone base waste 25%');
assert(E.totalWastePercent(E.WASTE_PROFILES.straight) === 15, 'straight total waste 15%');
assert(E.totalWastePercent(E.WASTE_PROFILES.diagonal) === 23, 'diagonal total waste 23%');

// ═══════════════════════════════════════════════════
// GEOMETRY — FLOOR ONLY
// ═══════════════════════════════════════════════════

const floorRoom = {
  id: 'r1',
  name: 'Test Floor',
  type: 'bathroom',
  length: { feet: 10, inches: 0 },
  width: { feet: 8, inches: 0 },
  ceilingHeight: { feet: 8, inches: 0 },
  surfaces: [{ kind: 'floor', enabled: true }],
  openings: [],
};

const floorGeom = E.calculateRoomGeometry(floorRoom);
assert(floorGeom.floorSqft === 80, 'Floor 10×8 = 80 sqft');
assert(floorGeom.wallPerimeterFt === 36, 'Perimeter 2*(10+8) = 36 ft');
assert(floorGeom.surfaces.length === 1, 'One surface');
assert(floorGeom.surfaces[0].netSqft === 80, 'Floor net = 80');
assertClose(floorGeom.surfaces[0].perimeterFt, 36, 0.01, 'Floor perimeter = 36');

// ═══════════════════════════════════════════════════
// GEOMETRY — FULL WALLS WITH OPENINGS
// ═══════════════════════════════════════════════════

const wallRoom = {
  id: 'r2',
  name: 'Wall Test',
  type: 'bathroom',
  length: { feet: 10, inches: 0 },
  width: { feet: 8, inches: 0 },
  ceilingHeight: { feet: 8, inches: 0 },
  surfaces: [{ kind: 'full-walls', enabled: true }],
  openings: [
    {
      id: 'door',
      name: 'Door',
      type: 'door',
      width: { feet: 3, inches: 0 },
      height: { feet: 6, inches: 8 },
    },
  ],
};

const wallGeom = E.calculateRoomGeometry(wallRoom);
const wallSurface = wallGeom.surfaces[0];
assert(wallSurface.grossSqft === 288, 'Walls gross = 36 × 8 = 288');
// Door: 3ft × 6.667ft = 20 sqft
assertClose(wallSurface.openingDeductions, 20, 0.1, 'Door deduction ~20 sqft');
assertClose(wallSurface.netSqft, 268, 0.1, 'Walls net ~268 sqft');

// ═══════════════════════════════════════════════════
// GEOMETRY — BACKSPLASH
// ═══════════════════════════════════════════════════

const splashRoom = {
  id: 'r3',
  name: 'Kitchen',
  type: 'kitchen',
  length: { feet: 12, inches: 0 },
  width: { feet: 10, inches: 0 },
  ceilingHeight: { feet: 9, inches: 0 },
  surfaces: [{ kind: 'backsplash', enabled: true }],
  openings: [],
};

const splashGeom = E.calculateRoomGeometry(splashRoom);
// Perimeter = 44, default backsplash height = 1.5ft (18in)
assertClose(splashGeom.surfaces[0].grossSqft, 66, 0.1, 'Backsplash = 44 × 1.5 = 66 sqft');

// ═══════════════════════════════════════════════════
// TILE ESTIMATION — 12×12 STRAIGHT ON 80 SQFT FLOOR
// ═══════════════════════════════════════════════════

const tileSpec = { widthIn: 12, heightIn: 12, tilesPerBox: 10, pattern: 'straight' };
const roomResult = E.estimateRoom(floorRoom, tileSpec);

assert(roomResult.subtotalSqft === 80, 'estimateRoom subtotal = 80');
const tileLine = roomResult.lines.find(l => l.category === 'tile');
// 80 sqft / 1 sqft per tile = 80, +15% waste = 92 tiles
assert(tileLine.adjustedQuantity === 92, 'Tiles needed = 92 (80 × 1.15 rounded up)');
assert(tileLine.packsNeeded === 10, 'Boxes = ceil(92/10) = 10');
assert(tileLine.wastePercent === 15, 'Straight waste = 15%');

// ═══════════════════════════════════════════════════
// TILE ESTIMATION — 12×24 HERRINGBONE ON 80 SQFT
// ═══════════════════════════════════════════════════

const tileSpec2 = { widthIn: 12, heightIn: 24, tilesPerBox: 8, pattern: 'herringbone' };
const roomResult2 = E.estimateRoom(floorRoom, tileSpec2);
const tileLine2 = roomResult2.lines.find(l => l.category === 'tile');

// 80 sqft / 2 sqft per tile = 40 tiles, herringbone waste = 30%
// 40 × 1.30 = 52 tiles
assert(tileLine2.adjustedQuantity === 52, 'Herringbone 12×24 = 52 tiles');
assert(tileLine2.packsNeeded === 7, 'Herringbone boxes = ceil(52/8) = 7');

// ═══════════════════════════════════════════════════
// SUPPORT MATERIAL
// ═══════════════════════════════════════════════════

const mortarLine = roomResult.lines.find(l => l.category === 'mortar');
assert(mortarLine !== null && mortarLine !== undefined, 'Mortar line exists');
assert(mortarLine.packsNeeded > 0, 'Mortar bags > 0');

const groutLine = roomResult.lines.find(l => l.category === 'grout');
assert(groutLine !== null && groutLine !== undefined, 'Grout line exists');
assert(groutLine.packsNeeded > 0, 'Grout bags > 0');

// ═══════════════════════════════════════════════════
// WATERPROOFING — WET AREA CHECK
// ═══════════════════════════════════════════════════

const wetRoom = {
  id: 'r4',
  name: 'Shower',
  type: 'bathroom',
  length: { feet: 5, inches: 0 },
  width: { feet: 4, inches: 0 },
  ceilingHeight: { feet: 8, inches: 0 },
  surfaces: [
    { kind: 'floor', enabled: true },
    { kind: 'shower-walls', enabled: true },
  ],
  openings: [],
};

const wetResult = E.estimateRoom(wetRoom, tileSpec);
const wpLine = wetResult.lines.find(l => l.category === 'waterproofing');
assert(wpLine !== null && wpLine !== undefined, 'Waterproofing line exists for wet area');
assert(wpLine.packsNeeded > 0, 'Waterproofing gallons > 0');

// ═══════════════════════════════════════════════════
// DIAGRAM DATA
// ═══════════════════════════════════════════════════

const diagram = E.generateDiagramData(floorRoom, floorGeom);
assert(diagram.floorPlan.widthFt === 8, 'Diagram floor width = 8');
assert(diagram.floorPlan.lengthFt === 10, 'Diagram floor length = 10');
assert(diagram.wallElevations.length === 4, 'Diagram has 4 wall elevations');

// ═══════════════════════════════════════════════════
// QUICK CALCULATORS
// ═══════════════════════════════════════════════════

const quickFloor = E.quickFloorEstimate({
  lengthFt: 10,
  widthFt: 8,
  tileWidthIn: 12,
  tileHeightIn: 12,
  tilesPerBox: 10,
  pattern: 'straight',
});
assert(quickFloor.grossArea === 80, 'Quick floor area = 80');
assert(quickFloor.tilesNeeded === 92, 'Quick floor tiles = 92');
assert(quickFloor.boxesNeeded === 10, 'Quick floor boxes = 10');

const quickSplash = E.quickBacksplashEstimate({
  wallLengthFt: 10,
  heightIn: 18,
  tileWidthIn: 4,
  tileHeightIn: 4,
  tilesPerBox: 50,
  pattern: 'straight',
});
assert(quickSplash.grossArea === 15, 'Quick backsplash area = 15');
assert(quickSplash.tilesNeeded > 0, 'Quick backsplash tiles > 0');

const quickWall = E.quickWallTileEstimate({
  perimeterFt: 36,
  heightFt: 8,
  tileWidthIn: 12,
  tileHeightIn: 12,
  tilesPerBox: 10,
  pattern: 'straight',
});
assert(quickWall.grossArea === 288, 'Quick wall gross = 288');
assert(quickWall.tilesNeeded > 0, 'Quick wall tiles > 0');

const quickShower = E.quickShowerWallEstimate({
  widthFt: 5,
  depthFt: 4,
  heightFt: 8,
  tileWidthIn: 12,
  tileHeightIn: 12,
  tilesPerBox: 10,
  pattern: 'straight',
});
assert(quickShower.grossArea === 104, 'Quick shower = (2×4 + 5)×8 = 104');
assert(quickShower.tilesNeeded > 0, 'Quick shower tiles > 0');

// ═══════════════════════════════════════════════════
// PROJECT ESTIMATOR
// ═══════════════════════════════════════════════════

const project = {
  id: 'p1',
  name: 'Test Project',
  rooms: [floorRoom, wetRoom],
  tileSpec: tileSpec,
};

const projResult = E.estimateProject(project);
assert(projResult.sections.length === 2, 'Project has 2 sections');
assert(projResult.totalSqft > 0, 'Project total sqft > 0');
assert(projResult.totalEstimateLines.length > 0, 'Project has estimate lines');
assert(projResult.laborHours > 0, 'Project has labor hours');
assert(projResult.warnings.length === 0, 'No project warnings');

// ═══════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════

assert(E.validatePositive(10, 'area').valid === true, 'validatePositive 10 = valid');
assert(E.validatePositive(-1, 'area').valid === false, 'validatePositive -1 = invalid');
assert(E.validatePositive(0, 'area').valid === false, 'validatePositive 0 = invalid');
assert(E.validateNonNegative(0, 'area').valid === true, 'validateNonNegative 0 = valid');
assert(E.validateNonNegative(-1, 'area').valid === false, 'validateNonNegative -1 = invalid');
assert(
  E.validateDimension({ feet: 10, inches: 6 }, 'length').valid === true,
  'validateDimension valid'
);

// ═══════════════════════════════════════════════════
// PRODUCT PROVIDER
// ═══════════════════════════════════════════════════

assert(E.ProductProviderRegistry.getActive().name === 'manual', 'Default provider is manual');
assert(E.ProductProviderRegistry.listProviders().includes('manual'), 'Manual provider registered');
E.ManualProductProvider.addProduct({
  sku: 'TEST-001',
  brand: 'Test',
  title: 'Test Tile',
  unitType: 'box',
  coveragePerUnit: 10,
  source: 'manual',
});
assert(E.ManualProductProvider.getAll().length === 1, 'Product added');

// ═══════════════════════════════════════════════════
// QUICK MORTAR ESTIMATE
// ═══════════════════════════════════════════════════

const mortar1 = E.quickMortarEstimate({ areaSqft: 200, trowelId: '1/4x3/8-sq' });
assert(mortar1 != null, 'quickMortar result exists');
assert(mortar1.bagsMin > 0, 'quickMortar bagsMin > 0');
assert(mortar1.bagsMax >= mortar1.bagsMin, 'quickMortar bagsMax >= bagsMin');
assert(mortar1.note.indexOf('TDS-132') !== -1, 'quickMortar note references TDS');

const mortar2 = E.quickMortarEstimate({ areaSqft: 200, trowelId: '1/2-sq', isLargeFormat: true });
assert(mortar2.warning.indexOf('NOT recommended') !== -1, 'LFT + wrong trowel = warning');

// ═══════════════════════════════════════════════════
// QUICK GROUT ESTIMATE
// ═══════════════════════════════════════════════════

const grout1 = E.quickGroutEstimate({ areaSqft: 100, tileWidthIn: 12, tileLengthIn: 12 });
assert(grout1 != null, 'quickGrout result exists');
assert(grout1.pounds > 0, 'quickGrout pounds > 0');
assert(grout1.bags25lb > 0, 'quickGrout bags > 0');
assertClose(grout1.lbsPerSqFt, grout1.pounds / 100, 0.01, 'quickGrout lbsPerSqFt consistent');

// With explicit joint and thickness
const grout2 = E.quickGroutEstimate({
  areaSqft: 50,
  tileWidthIn: 6,
  tileLengthIn: 6,
  jointWidthIn: 0.25,
  tileThicknessIn: 0.375,
});
assert(grout2.pounds > grout1.pounds * 0.5, 'Smaller tiles need more grout proportionally');

// ═══════════════════════════════════════════════════
// TILLERSTEADFORMULAS BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════

const F = window.TillersteadFormulas;
assert(F != null, 'TillersteadFormulas alias exists');
assert(typeof F.calculateMovementJoints === 'function', 'F.calculateMovementJoints is function');
assert(typeof F.calculateDeflection === 'function', 'F.calculateDeflection is function');
assert(typeof F.calculateHeatedFloorLoad === 'function', 'F.calculateHeatedFloorLoad is function');
assert(typeof F.evaluateMoistureReadings === 'function', 'F.evaluateMoistureReadings is function');
assert(typeof F.calculateThinsetMix === 'function', 'F.calculateThinsetMix is function');
assert(typeof F.estimateSealer === 'function', 'F.estimateSealer is function');
assert(typeof F.calculateDeckMud === 'function', 'F.calculateDeckMud is function');
assert(typeof F.estimatePrimer === 'function', 'F.estimatePrimer is function');
assert(typeof F.estimateSealantTubes === 'function', 'F.estimateSealantTubes is function');
assert(typeof F.calculateBathLayout === 'function', 'F.calculateBathLayout is function');
assert(typeof F.MOVEMENT_JOINT_SPACING === 'object', 'F.MOVEMENT_JOINT_SPACING is object');
assert(typeof F.SEALER_COVERAGE === 'object', 'F.SEALER_COVERAGE is object');
assert(typeof F.PRIMER_COVERAGE === 'object', 'F.PRIMER_COVERAGE is object');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — MOVEMENT JOINTS
// ═══════════════════════════════════════════════════

const mj1 = F.calculateMovementJoints({
  lengthFt: 50,
  widthFt: 30,
  exposure: 'interior',
  tempSwingF: 25,
});
assert(mj1.valid === true, 'movement joints valid');
assert(mj1.spacingFt === 24, 'interior standard = 24 ft');
assert(mj1.jointsLong >= 1, 'at least 1 long joint');
assert(mj1.jointsShort >= 0, 'non-negative short joints');
assert(mj1.totalJoints > 0, 'total joints > 0');

const mj2 = F.calculateMovementJoints({
  lengthFt: 50,
  widthFt: 30,
  exposure: 'exterior',
  tempSwingF: 70,
});
assert(mj2.spacingFt < mj1.spacingFt, 'exterior + high temp = tighter spacing');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — DEFLECTION
// ═══════════════════════════════════════════════════

const def1 = F.calculateDeflection({
  spanFeet: 12,
  joistSpacingInches: 16,
  joistWidthInches: 1.5,
  joistDepthInches: 9.25,
});
assert(def1.valid === true, 'deflection valid');
assert(def1.deflectionRatio > 0, 'deflection ratio > 0');
assert(typeof def1.passesCeramic === 'boolean', 'passesCeramic is boolean');
assert(typeof def1.passesStone === 'boolean', 'passesStone is boolean');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — HEATED FLOOR
// ═══════════════════════════════════════════════════

const hf1 = F.calculateHeatedFloorLoad({ areaSqFt: 50, wattsPerSqFt: 12, voltage: 120 });
assert(hf1.valid === true, 'heated floor valid');
assert(hf1.totalWatts === 600, '50 × 12 = 600W');
assert(hf1.amps === 5, '600/120 = 5A');
assert(hf1.needsRelay === false, '5A < 15A thermostat');

const hf2 = F.calculateHeatedFloorLoad({ areaSqFt: 200, wattsPerSqFt: 15, voltage: 120 });
assert(hf2.needsRelay === true, '200*15/120 = 25A > 15A → relay');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — MOISTURE
// ═══════════════════════════════════════════════════

const mo1 = F.evaluateMoistureReadings({ mverLbs: 3, rhPercent: 70 });
assert(mo1.valid === true, 'moisture valid');
assert(mo1.mverPass === true, '3 <= 5 MVER pass');
assert(mo1.rhPass === true, '70 <= 75 RH pass');
assert(mo1.requiresMitigation === false, 'no mitigation');

const mo2 = F.evaluateMoistureReadings({ mverLbs: 8, rhPercent: 80 });
assert(mo2.requiresMitigation === true, 'high readings → mitigation');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — THINSET MIX
// ═══════════════════════════════════════════════════

const tm1 = F.calculateThinsetMix({ bagWeightLbs: 50, batchWeightLbs: 25 });
assert(tm1.valid === true, 'thinset mix valid');
assert(tm1.batchWeightLbs === 25, 'batch = 25 lbs');
assert(tm1.waterQuartsRange[0] > 0, 'water min > 0');
assert(tm1.waterQuartsRange[1] > tm1.waterQuartsRange[0], 'water max > min');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — SEALER
// ═══════════════════════════════════════════════════

const se1 = F.estimateSealer({ areaSqFt: 400, surface: 'natural_stone', coats: 2 });
assert(se1.valid === true, 'sealer valid');
assert(se1.gallons > 0, 'sealer gallons > 0');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — DECK MUD
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// CATALOG SYSTEM — v1.2.0
// ═══════════════════════════════════════════════════

// -- Confidence computation --
assert(typeof E.computeConfidence === 'function', 'computeConfidence exported');
assert(E.computeConfidence(new Date().toISOString()) === 'high', 'confidence: recent = high');
assert(
  E.computeConfidence(new Date(Date.now() - 3 * 3600000).toISOString()) === 'medium',
  'confidence: 3h ago = medium'
);
assert(
  E.computeConfidence(new Date(Date.now() - 25 * 3600000).toISOString()) === 'low',
  'confidence: 25h ago = low'
);
assert(
  E.computeConfidence(new Date(Date.now() - 8 * 86400000).toISOString()) === 'stale',
  'confidence: 8d ago = stale'
);
assert(E.computeConfidence(null) === 'unknown', 'confidence: null = unknown');
assert(E.computeConfidence(undefined) === 'unknown', 'confidence: undefined = unknown');

// -- CatalogStore --
assert(typeof E.CatalogStore === 'object', 'CatalogStore exported');
E.CatalogStore.clearAll();
const cs = E.CatalogStore;

// upsert & retrieve product
cs.upsertProduct({
  sku: 'TEST-001',
  brand: 'TestBrand',
  title: 'Test Tile 12x24',
  category: 'tile',
  unitType: 'box',
  coveragePerUnit: 16,
  packSize: 8,
  source: 'test',
});
const p1 = cs.getProductBySku('TEST-001');
assert(p1 !== null, 'CatalogStore: getProductBySku found');
assert(p1.brand === 'TestBrand', 'CatalogStore: product brand correct');
assert(p1.category === 'tile', 'CatalogStore: product category correct');

// upsert same sku updates
cs.upsertProduct({
  sku: 'TEST-001',
  brand: 'TestBrand',
  title: 'Test Tile 12x24 UPDATED',
  category: 'tile',
  unitType: 'box',
  source: 'test',
});
const p1u = cs.getProductBySku('TEST-001');
assert(p1u.title === 'Test Tile 12x24 UPDATED', 'CatalogStore: upsert updates existing');

// search products
cs.upsertProduct({
  sku: 'TEST-002',
  brand: 'OtherBrand',
  title: 'Porcelain Wall Tile',
  category: 'tile',
  unitType: 'box',
  source: 'test',
});
cs.upsertProduct({
  sku: 'MOR-001',
  brand: 'TestBrand',
  title: 'Thinset Mortar 50lb',
  category: 'mortar',
  unitType: 'bag',
  source: 'test',
});
const tileSearch = cs.searchProducts('tile');
assert(tileSearch.length >= 2, 'CatalogStore: searchProducts finds tiles');
const brandSearch = cs.searchProducts('TestBrand');
assert(brandSearch.length >= 2, 'CatalogStore: searchProducts finds by brand');

// getProductsByCategory
const mortarCat = cs.getProductsByCategory('mortar');
assert(mortarCat.length === 1, 'CatalogStore: getProductsByCategory mortar = 1');
assert(mortarCat[0].sku === 'MOR-001', 'CatalogStore: mortar product correct');

// upsertProducts bulk
cs.upsertProducts([
  {
    sku: 'GRT-001',
    brand: 'GrBrand',
    title: 'Unsanded Grout',
    category: 'grout',
    unitType: 'bag',
    source: 'test',
  },
  {
    sku: 'GRT-002',
    brand: 'GrBrand',
    title: 'Sanded Grout',
    category: 'grout',
    unitType: 'bag',
    source: 'test',
  },
]);
assert(cs.getProductsByCategory('grout').length === 2, 'CatalogStore: upsertProducts bulk');

// price records
cs.upsertPrice({
  sku: 'TEST-001',
  price: 2.49,
  priceType: 'regular',
  source: 'test',
  observedAt: new Date().toISOString(),
});
const pr = cs.getPrice('TEST-001', 'test');
assert(pr !== null, 'CatalogStore: getPrice found');
assert(pr.price === 2.49, 'CatalogStore: price value correct');

// stock records
cs.upsertStock({
  sku: 'TEST-001',
  storeId: '1234',
  storeName: 'Test Store',
  zipCode: '08401',
  status: 'in-stock',
  quantity: 50,
  observedAt: Date.now(),
  source: 'test',
});
const st = cs.getStock('TEST-001', '1234');
assert(st !== null, 'CatalogStore: getStock found');
assert(st.status === 'in-stock', 'CatalogStore: stock status correct');
assert(st.quantity === 50, 'CatalogStore: stock quantity correct');

// store preference
cs.setStorePreference({ zipCode: '08401', storeName: 'AC Home Depot', storeId: '1234' });
const sp = cs.getStorePreference();
assert(sp !== null, 'CatalogStore: getStorePreference not null');
assert(sp.zipCode === '08401', 'CatalogStore: store pref zip');
assert(sp.storeId === '1234', 'CatalogStore: store pref id');
cs.setStorePreference(null);
assert(cs.getStorePreference() === null, 'CatalogStore: clear store pref');

// getStats
const stats = cs.getStats();
assert(stats.products >= 5, 'CatalogStore: stats products >= 5');
assert(stats.prices >= 1, 'CatalogStore: stats prices >= 1');
assert(stats.stockRecords >= 1, 'CatalogStore: stats stockRecords >= 1');

// getAllProducts
assert(cs.getAllProducts().length >= 5, 'CatalogStore: getAllProducts >= 5');

// -- CSVImportProvider --
assert(typeof E.CSVImportProvider === 'object', 'CSVImportProvider exported');

// Basic CSV import
const csvText = `sku,brand,title,category,unit_type,coverage_per_unit,pack_size,price
CSVT-001,Daltile,Ceramic Floor Tile 12x12,tile,box,15,10,2.29
CSVT-002,MSI,Porcelain Wall Tile 3x6,tile,box,12,20,1.99`;
const csvResult = E.CSVImportProvider.importProducts(csvText);
assert(csvResult.imported === 2, 'CSVImportProvider: imported 2');
assert(
  csvResult.errors.filter(function (e) {
    return e.indexOf('parse error') >= 0;
  }).length === 0,
  'CSVImportProvider: no parse errors'
);
const csvP = cs.getProductBySku('CSVT-001');
assert(csvP !== null, 'CSVImportProvider: product in store');
assert(csvP.brand === 'Daltile', 'CSVImportProvider: brand parsed');

// CSV with empty rows and missing sku
const csvBad = `sku,brand,title,category
,BadBrand,NoSku,tile
CSVT-003,GoodBrand,Good Product,mortar`;
const csvBadResult = E.CSVImportProvider.importProducts(csvBad);
assert(csvBadResult.imported === 1, 'CSVImportProvider: skip no-SKU rows');

// TSV import (tab-delimited)
const tsvText = 'sku\tbrand\ttitle\tcategory\nTSV-001\tTSVBrand\tTSV Tile\ttile';
const tsvResult = E.CSVImportProvider.importProducts(tsvText);
assert(tsvResult.imported === 1, 'CSVImportProvider: TSV import works');

// -- AffiliateFeedProvider --
assert(typeof E.AffiliateFeedProvider === 'object', 'AffiliateFeedProvider exported');

const feedText =
  'product_id\tproduct_name\tbrand_name\tcategory\tprice\tproduct_url\tstock_status\nHD-001\tHome Depot Thinset\tCustom Building Products\tmortar\t12.99\thttps://example.com/p/1\tin-stock\nHD-002\tHome Depot Grout\tPolyblend\tgrout\t8.49\thttps://example.com/p/2\tlimited';
const feedResult = E.AffiliateFeedProvider.importProducts(feedText, { retailer: 'Home Depot' });
assert(feedResult.imported === 2, 'AffiliateFeedProvider: imported 2');
const hdP = cs.getProductBySku('HD-001');
assert(hdP !== null, 'AffiliateFeedProvider: product in store');
assert(hdP.source === 'Home Depot', 'AffiliateFeedProvider: source = Home Depot');

// Affiliate tag appending
const feedWithTag = E.AffiliateFeedProvider.importProducts(
  'product_id\tproduct_name\tproduct_url\nHD-TAG\tTest\thttps://example.com/p/3',
  { retailer: 'HD', affiliateTag: 'tiller-20' }
);
assert(feedWithTag.imported === 1, 'AffiliateFeedProvider: with affiliate tag');
const tagP = cs.getProductBySku('HD-TAG');
assert(tagP.productUrl.indexOf('tiller-20') >= 0, 'AffiliateFeedProvider: affiliate tag in URL');

// -- InternalCatalogProvider --
assert(typeof E.InternalCatalogProvider === 'object', 'InternalCatalogProvider exported');
cs.clearAll();
E.InternalCatalogProvider.seedDefaults();
const internalProducts = cs.getAllProducts().filter(function (p) {
  return p.source === 'internal-catalog';
});
assert(internalProducts.length > 0, 'InternalCatalogProvider: seeded products');
// Should have mortar, grout, waterproofing at minimum from COVERAGE_RULES
const cats = {};
internalProducts.forEach(function (p) {
  cats[p.category] = true;
});
assert(cats['mortar'], 'InternalCatalogProvider: has mortar');
assert(cats['grout'], 'InternalCatalogProvider: has grout');

// -- matchLineToProducts --
assert(typeof E.matchLineToProducts === 'function', 'matchLineToProducts exported');
// Seed with some products for matching
cs.clearAll();
cs.upsertProduct({
  sku: 'M-001',
  brand: 'Versabond',
  title: 'Modified Thinset Mortar 50lb',
  category: 'mortar',
  unitType: 'bag',
  coveragePerUnit: 100,
  source: 'test',
});
cs.upsertProduct({
  sku: 'M-002',
  brand: 'Custom',
  title: 'Unmodified Mortar 50lb',
  category: 'mortar',
  unitType: 'bag',
  coveragePerUnit: 80,
  source: 'test',
});
cs.upsertProduct({
  sku: 'T-001',
  brand: 'Daltile',
  title: 'Porcelain Floor Tile',
  category: 'tile',
  unitType: 'box',
  coveragePerUnit: 16,
  source: 'test',
});

const matchMortarLine = {
  category: 'mortar',
  description: 'Thinset mortar',
  rawQuantity: 100,
  adjustedQuantity: 100,
  packsNeeded: 2,
  packUnit: 'bag',
};
const suggestions = E.matchLineToProducts(matchMortarLine, { maxResults: 3 });
assert(Array.isArray(suggestions), 'matchLineToProducts: returns array');
assert(suggestions.length === 2, 'matchLineToProducts: finds 2 mortar products');
assert(
  suggestions[0].matchScore >= suggestions[1].matchScore,
  'matchLineToProducts: sorted by score desc'
);
assert(
  suggestions[0].product.sku === 'M-001' || suggestions[0].product.sku === 'M-002',
  'matchLineToProducts: returns mortar products'
);
assert(typeof suggestions[0].matchReason === 'string', 'matchLineToProducts: has matchReason');

// No matches for missing category
const noMatch = E.matchLineToProducts(
  { category: 'waterproofing', description: 'membrane' },
  { maxResults: 3 }
);
assert(noMatch.length === 0, 'matchLineToProducts: no match for missing category');

// -- generateShoppingList --
assert(typeof E.generateShoppingList === 'function', 'generateShoppingList exported');

// Create a minimal estimate result
const mockEstimate = {
  lines: [
    {
      id: 'L1',
      roomId: 'R1',
      surfaceKind: 'floor',
      category: 'mortar',
      description: 'Thinset',
      rawQuantity: 200,
      wastePercent: 10,
      adjustedQuantity: 220,
      packUnit: 'bag',
      packsNeeded: 3,
    },
    {
      id: 'L2',
      roomId: 'R1',
      surfaceKind: 'floor',
      category: 'tile',
      description: 'Floor tile',
      rawQuantity: 200,
      wastePercent: 10,
      adjustedQuantity: 220,
      packUnit: 'box',
      packsNeeded: 14,
    },
  ],
};
const shopList = E.generateShoppingList(mockEstimate);
assert(shopList !== null, 'generateShoppingList: returns result');
assert(Array.isArray(shopList.items), 'generateShoppingList: has items array');
assert(shopList.items.length === 2, 'generateShoppingList: 2 items');
assert(shopList.items[0].category === 'mortar', 'generateShoppingList: first item = mortar');
assert(Array.isArray(shopList.items[0].suggestions), 'generateShoppingList: item has suggestions');
assert(shopList.items[0].suggestions.length > 0, 'generateShoppingList: mortar has suggestions');
assert(typeof shopList.generatedAt === 'number', 'generateShoppingList: has generatedAt');

// topPick
const mortarItem = shopList.items[0];
assert(
  mortarItem.topPick === null || typeof mortarItem.topPick === 'object',
  'generateShoppingList: topPick is object or null'
);
if (mortarItem.suggestions.length > 0) {
  assert(mortarItem.topPick !== null, 'generateShoppingList: topPick set when suggestions exist');
}

// CONFIDENCE_THRESHOLDS
assert(typeof E.CONFIDENCE_THRESHOLDS === 'object', 'CONFIDENCE_THRESHOLDS exported');
assert(E.CONFIDENCE_THRESHOLDS.HIGH_MAX_AGE_MS > 0, 'CONFIDENCE_THRESHOLDS: HIGH_MAX_AGE_MS > 0');
assert(
  E.CONFIDENCE_THRESHOLDS.MEDIUM_MAX_AGE_MS > E.CONFIDENCE_THRESHOLDS.HIGH_MAX_AGE_MS,
  'CONFIDENCE_THRESHOLDS: MEDIUM > HIGH'
);
assert(
  E.CONFIDENCE_THRESHOLDS.LOW_MAX_AGE_MS > E.CONFIDENCE_THRESHOLDS.MEDIUM_MAX_AGE_MS,
  'CONFIDENCE_THRESHOLDS: LOW > MEDIUM'
);

// Clean up
cs.clearAll();

// ═══════════════════════════════════════════════════
// v1.3.0 — RECEIPT SCAN PROVIDER
// ═══════════════════════════════════════════════════

assert(typeof E.ReceiptScanProvider === 'object', 'ReceiptScanProvider exported');
assert(
  typeof E.ReceiptScanProvider.parseReceipt === 'function',
  'ReceiptScanProvider: parseReceipt'
);
assert(typeof E.ReceiptScanProvider.applyPrices === 'function', 'ReceiptScanProvider: applyPrices');

// Parse basic receipt text
const receiptText = `STORE #1234  03/12/2026
VERSABOND FLEX 50LB  SKU#VB-50  $18.97
POLYBLEND GROUT 25LB  SKU#PG-25  $12.98
QTY: 2 @ SUBWAY TILE   SKU#ST-3x6  $24.98
SUBTOTAL  $56.93
TAX  $3.41
TOTAL  $60.34`;

const receiptResult = E.ReceiptScanProvider.parseReceipt(receiptText);
assert(receiptResult.parsed >= 3, 'ReceiptScan: parsed >= 3 items');
assert(receiptResult.lines.length >= 3, 'ReceiptScan: lines >= 3');

// Verify SKU extraction
const vbLine = receiptResult.lines.find(function (l) {
  return l.sku === 'VB-50';
});
assert(vbLine !== null && vbLine !== undefined, 'ReceiptScan: found SKU VB-50');
assert(vbLine.price === 18.97, 'ReceiptScan: price = 18.97');

const pgLine = receiptResult.lines.find(function (l) {
  return l.sku === 'PG-25';
});
assert(pgLine !== null && pgLine !== undefined, 'ReceiptScan: found SKU PG-25');
assert(pgLine.price === 12.98, 'ReceiptScan: price = 12.98');

// Verify quantity extraction
const stLine = receiptResult.lines.find(function (l) {
  return l.sku === 'ST-3x6';
});
assert(stLine !== null && stLine !== undefined, 'ReceiptScan: found SKU ST-3x6');
assert(stLine.quantity === 2, 'ReceiptScan: quantity = 2');

// Verify header/footer lines are skipped
assert(
  receiptResult.lines.every(function (l) {
    return !/subtotal|total|tax/i.test(l.rawText);
  }),
  'ReceiptScan: skips subtotal/total/tax'
);

// Apply prices
cs.clearAll();
cs.upsertProduct({
  sku: 'VB-50',
  title: 'VersaBond Flex',
  category: 'mortar',
  unitType: 'bag',
  source: 'test',
});
const applyResult = E.ReceiptScanProvider.applyPrices(receiptResult.lines, {
  storeId: '1234',
  storeName: 'Test Store',
});
assert(applyResult.updated >= 1, 'ReceiptScan: updated >= 1');
assert(applyResult.created >= 1, 'ReceiptScan: created >= 1 (new from receipt)');

// Verify price was stored
const vbPrice = cs.getPrice('VB-50', 'receipt-scan');
assert(vbPrice !== null, 'ReceiptScan: price stored for VB-50');
assert(vbPrice.price === 18.97, 'ReceiptScan: stored price = 18.97');

// Verify stock was set (we bought it, so it was in stock)
const vbStock = cs.getStock('VB-50', '1234');
assert(vbStock !== null, 'ReceiptScan: stock record created');
assert(vbStock.status === 'in-stock', 'ReceiptScan: stock = in-stock');

// Empty/null input
const emptyReceipt = E.ReceiptScanProvider.parseReceipt('');
assert(emptyReceipt.parsed === 0, 'ReceiptScan: empty text = 0 parsed');
assert(emptyReceipt.lines.length === 0, 'ReceiptScan: empty text = 0 lines');
const nullReceipt = E.ReceiptScanProvider.parseReceipt(null);
assert(nullReceipt.parsed === 0, 'ReceiptScan: null = 0 parsed');

// ═══════════════════════════════════════════════════
// v1.3.0 — TOOLKIT SYNC CLIENT
// ═══════════════════════════════════════════════════

assert(typeof E.ToolkitSync === 'object', 'ToolkitSync exported');
assert(typeof E.ToolkitSync.isConfigured === 'function', 'ToolkitSync: isConfigured');
assert(typeof E.ToolkitSync.pushProducts === 'function', 'ToolkitSync: pushProducts');
assert(typeof E.ToolkitSync.pullProducts === 'function', 'ToolkitSync: pullProducts');

// Not configured without baseUrl
assert(E.ToolkitSync.isConfigured() === false, 'ToolkitSync: not configured without URL');

// ═══════════════════════════════════════════════════
// v1.3.0 — CURATED CATALOG
// ═══════════════════════════════════════════════════

assert(Array.isArray(E.CURATED_CATALOG), 'CURATED_CATALOG exported');
assert(E.CURATED_CATALOG.length >= 25, 'CURATED_CATALOG: >= 25 products');

// Verify tile products with dimensions
const tileCurated = E.CURATED_CATALOG.filter(function (p) {
  return p.category === 'tile';
});
assert(tileCurated.length >= 6, 'CURATED_CATALOG: >= 6 tile products');
assert(
  tileCurated.every(function (t) {
    return t.tileWidthIn > 0 && t.tileHeightIn > 0;
  }),
  'CURATED_CATALOG: all tiles have dimensions'
);

// Verify mortar products
const mortarCurated = E.CURATED_CATALOG.filter(function (p) {
  return p.category === 'mortar';
});
assert(mortarCurated.length >= 3, 'CURATED_CATALOG: >= 3 mortar products');

// Verify categories covered
const curatedCats = {};
E.CURATED_CATALOG.forEach(function (p) {
  curatedCats[p.category] = true;
});
assert(curatedCats['tile'], 'CURATED_CATALOG: has tile');
assert(curatedCats['mortar'], 'CURATED_CATALOG: has mortar');
assert(curatedCats['grout'], 'CURATED_CATALOG: has grout');
assert(curatedCats['waterproofing'], 'CURATED_CATALOG: has waterproofing');
assert(curatedCats['self-leveler'], 'CURATED_CATALOG: has self-leveler');
assert(curatedCats['backer-board'], 'CURATED_CATALOG: has backer-board');
assert(curatedCats['sealer'], 'CURATED_CATALOG: has sealer');
assert(curatedCats['sealant'], 'CURATED_CATALOG: has sealant');
assert(curatedCats['primer'], 'CURATED_CATALOG: has primer');

// Verify enhanced seedDefaults includes curated catalog
cs.clearAll();
E.InternalCatalogProvider.seedDefaults();
const allSeeded = cs.getAllProducts().filter(function (p) {
  return p.source === 'internal-catalog';
});
// Should have both COVERAGE_RULES-based + CURATED_CATALOG products
assert(allSeeded.length >= 25, 'seedDefaults: >= 25 internal products after enhanced seed');
// Verify a curated product exists
const versabond = cs.getProductBySku('MOR-MOD-50');
assert(versabond !== null, 'seedDefaults: curated VersaBond found');
assert(versabond.brand === 'Custom Building Products', 'seedDefaults: curated brand correct');

// Verify curated tile products in store
const seededTiles = cs.getProductsByCategory('tile').filter(function (p) {
  return p.source === 'internal-catalog';
});
assert(seededTiles.length >= 6, 'seedDefaults: >= 6 curated tiles');

// ═══════════════════════════════════════════════════
// v1.3.0 — SHOPPING LIST WITH CURATED CATALOG
// ═══════════════════════════════════════════════════

// generateShoppingList should now find curated products
const curatedEstimate = {
  lines: [
    {
      id: 'C1',
      category: 'mortar',
      description: 'Thinset mortar',
      rawQuantity: 200,
      adjustedQuantity: 220,
      packsNeeded: 3,
      packUnit: 'bag',
    },
    {
      id: 'C2',
      category: 'grout',
      description: 'Sanded grout',
      rawQuantity: 100,
      adjustedQuantity: 110,
      packsNeeded: 2,
      packUnit: 'bag',
    },
    {
      id: 'C3',
      category: 'tile',
      description: '12x24 porcelain tile',
      rawQuantity: 200,
      adjustedQuantity: 220,
      packsNeeded: 14,
      packUnit: 'box',
    },
  ],
};
const curatedShopList = E.generateShoppingList(curatedEstimate);
assert(curatedShopList.items.length === 3, 'curatedShoppingList: 3 items');

// Mortar suggestions should include curated products
const curatedMortarItem = curatedShopList.items[0];
assert(curatedMortarItem.suggestions.length > 0, 'curatedShoppingList: mortar has suggestions');
const curatedMortarSkus = curatedMortarItem.suggestions.map(function (s) {
  return s.product.sku;
});
assert(
  curatedMortarSkus.some(function (sku) {
    return sku.startsWith('MOR-') || sku.startsWith('INT-MORTAR');
  }),
  'curatedShoppingList: mortar suggestions include mortar SKUs'
);

// Tile suggestions should include curated tiles
const curatedTileItem = curatedShopList.items[2];
assert(curatedTileItem.suggestions.length > 0, 'curatedShoppingList: tile has suggestions');

// Final cleanup
cs.clearAll();

const dm1 = F.calculateDeckMud({ areaSqFt: 9, runFeet: 3 });
assert(dm1.valid === true, 'deck mud valid');
assert(dm1.bags > 0, 'deck mud bags > 0');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — PRIMER
// ═══════════════════════════════════════════════════

const pr1 = F.estimatePrimer({ areaSqFt: 200, porosity: 'porous' });
assert(pr1.valid === true, 'primer valid');
assert(pr1.gallons > 0, 'primer gallons > 0');

const pr2 = F.estimatePrimer({ areaSqFt: 200, porosity: 'non_porous' });
assert(pr2.gallons < pr1.gallons, 'non-porous needs less primer');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — SEALANT
// ═══════════════════════════════════════════════════

const sl1 = F.estimateSealantTubes({ linearFeet: 50 });
assert(sl1.valid === true, 'sealant valid');
assert(sl1.tubes > 0, 'sealant tubes > 0');

// ═══════════════════════════════════════════════════
// ADVANCED FORMULAS — BATH LAYOUT
// ═══════════════════════════════════════════════════

const bl1 = F.calculateBathLayout({ roomLengthFt: 10, roomWidthFt: 8 });
assert(bl1.valid === true, 'bath layout valid');
assert(bl1.fitsLinear === 'Yes' || bl1.fitsLinear === 'No', 'fitsLinear is Yes/No');

// ═══════════════════════════════════════════════════
// DIAGRAM SVG RENDERER
// ═══════════════════════════════════════════════════

const diagramRoom = {
  id: 'diag-r',
  name: 'Diagram Test',
  type: 'kitchen',
  length: { feet: 12, inches: 0 },
  width: { feet: 10, inches: 0 },
  ceilingHeight: { feet: 8, inches: 0 },
  surfaces: [{ kind: 'floor', enabled: true }],
  openings: [],
};
const diagGeom = E.calculateRoomGeometry(diagramRoom);
const diagData = E.generateDiagramData(diagramRoom, diagGeom);
const svgResult = E.renderDiagramSVG(diagData);
assert(svgResult.indexOf('<svg') !== -1, 'SVG starts with <svg');
assert(svgResult.indexOf('Diagram Test') !== -1, 'SVG has room label');
assert(svgResult.indexOf('120 sq ft') !== -1, 'SVG has area');

// ═══════════════════════════════════════════════════
// EDGE CASES
// ═══════════════════════════════════════════════════

// Zero-dimension tile
const zeroDim = E.quickFloorEstimate({
  lengthFt: 10,
  widthFt: 8,
  tileWidthIn: 0,
  tileHeightIn: 12,
  tilesPerBox: 10,
});
assert(zeroDim.tilesNeeded === 0, 'Zero-width tile returns 0 tiles');

// No surfaces enabled
const noSurfaces = {
  id: 'r-empty',
  name: 'Empty',
  type: 'other',
  length: { feet: 10, inches: 0 },
  width: { feet: 8, inches: 0 },
  ceilingHeight: { feet: 8, inches: 0 },
  surfaces: [{ kind: 'floor', enabled: false }],
  openings: [],
};
const emptyResult = E.estimateRoom(noSurfaces, tileSpec);
assert(emptyResult.subtotalSqft === 0, 'No surfaces = 0 sqft');
assert(emptyResult.notes.length > 0, 'No surfaces note present');

// ═══════════════════════════════════════════════════
// v2.0.0 — DIMENSION SCORING, RETAILER URLs, ENRICHMENT
// ═══════════════════════════════════════════════════

// -- parseTileDimsFromText --
assert(typeof E.parseTileDimsFromText === 'function', 'parseTileDimsFromText exported');

const dims1 = E.parseTileDimsFromText('12x24 Porcelain Tile');
assert(dims1 !== null, 'parseTileDimsFromText: parses 12x24');
assert(dims1.w === 12 && dims1.h === 24, 'parseTileDimsFromText: 12x24 dims correct');

const dims2 = E.parseTileDimsFromText('3×6 Subway Tile');
assert(dims2 !== null, 'parseTileDimsFromText: parses 3×6');
assert(dims2.w === 3 && dims2.h === 6, 'parseTileDimsFromText: 3×6 dims correct');

const dims3 = E.parseTileDimsFromText('24x12 Large Format');
assert(dims3 !== null, 'parseTileDimsFromText: parses 24x12');
assert(dims3.w === 12 && dims3.h === 24, 'parseTileDimsFromText: normalizes w<=h');

const dims4 = E.parseTileDimsFromText('No dimensions here');
assert(dims4 === null, 'parseTileDimsFromText: null for no dims');

const dims5 = E.parseTileDimsFromText('');
assert(dims5 === null, 'parseTileDimsFromText: null for empty');

const dims6 = E.parseTileDimsFromText(null);
assert(dims6 === null, 'parseTileDimsFromText: null for null input');

const dims7 = E.parseTileDimsFromText('6.5X13 Wall Tile');
assert(dims7 !== null, 'parseTileDimsFromText: parses decimal dims');
assert(dims7.w === 6.5 && dims7.h === 13, 'parseTileDimsFromText: 6.5x13 correct');

// -- RetailerURLBuilder --
assert(typeof E.RetailerURLBuilder === 'object', 'RetailerURLBuilder exported');
assert(typeof E.RetailerURLBuilder.buildURL === 'function', 'RetailerURLBuilder: buildURL');
assert(
  typeof E.RetailerURLBuilder.listRetailers === 'function',
  'RetailerURLBuilder: listRetailers'
);

const hdUrl = E.RetailerURLBuilder.buildURL('12345', 'homedepot');
assert(typeof hdUrl === 'string', 'RetailerURLBuilder: HD returns string');
assert(hdUrl.indexOf('homedepot.com') >= 0, 'RetailerURLBuilder: HD URL has homedepot.com');
assert(hdUrl.indexOf('12345') >= 0, 'RetailerURLBuilder: HD URL has SKU');

const lowesUrl = E.RetailerURLBuilder.buildURL('67890', 'lowes');
assert(typeof lowesUrl === 'string', 'RetailerURLBuilder: Lowes returns string');
assert(lowesUrl.indexOf('lowes.com') >= 0, 'RetailerURLBuilder: Lowes URL has lowes.com');

const fdUrl = E.RetailerURLBuilder.buildURL('AAA', 'flooranddecor');
assert(typeof fdUrl === 'string', 'RetailerURLBuilder: F&D returns string');
assert(fdUrl.indexOf('flooranddecor.com') >= 0, 'RetailerURLBuilder: F&D URL correct');

const unknownUrl = E.RetailerURLBuilder.buildURL('SKU', 'unknownretailer');
assert(unknownUrl === null, 'RetailerURLBuilder: unknown retailer returns null');

const retailers = E.RetailerURLBuilder.listRetailers();
assert(Array.isArray(retailers), 'RetailerURLBuilder: listRetailers returns array');
assert(retailers.indexOf('homedepot') >= 0, 'RetailerURLBuilder: lists homedepot');
assert(retailers.indexOf('lowes') >= 0, 'RetailerURLBuilder: lists lowes');

// -- enrichCoverage --
assert(typeof E.enrichCoverage === 'function', 'enrichCoverage exported');

// Seed catalog for enrichment test
E.CatalogStore.clearAll();
E.CatalogStore.upsertProduct({
  sku: 'ENRICH-001',
  brand: 'NoBrand',
  title: 'Some Mortar',
  category: 'mortar',
  unitType: 'bag',
  coveragePerUnit: null,
  source: 'test',
});
E.CatalogStore.upsertProduct({
  sku: 'ENRICH-002',
  brand: 'Daltile',
  title: 'Porcelain Floor Tile 12x24',
  category: 'tile',
  unitType: 'box',
  coveragePerUnit: null,
  source: 'test',
});
const enrichResult = E.enrichCoverage();
assert(typeof enrichResult === 'object', 'enrichCoverage: returns object');
assert(typeof enrichResult.enriched === 'number', 'enrichCoverage: has enriched count');
assert(typeof enrichResult.total === 'number', 'enrichCoverage: has total count');

// -- Enhanced matchLineToProducts with dimension scoring --
E.CatalogStore.clearAll();
E.CatalogStore.upsertProduct({
  sku: 'DIM-001',
  brand: 'Daltile',
  title: 'Porcelain Floor Tile 12x24',
  category: 'tile',
  unitType: 'box',
  coveragePerUnit: 16,
  source: 'test',
  tileWidthIn: 12,
  tileHeightIn: 24,
});
E.CatalogStore.upsertProduct({
  sku: 'DIM-002',
  brand: 'MSI',
  title: 'Ceramic Tile 6x6',
  category: 'tile',
  unitType: 'box',
  coveragePerUnit: 12,
  source: 'test',
  tileWidthIn: 6,
  tileHeightIn: 6,
});

const dimLine = {
  category: 'tile',
  description: '12x24 Porcelain Floor Tile',
  rawQuantity: 100,
  adjustedQuantity: 110,
  packsNeeded: 7,
  packUnit: 'box',
};
const dimSuggestions = E.matchLineToProducts(dimLine, { maxResults: 2 });
assert(dimSuggestions.length === 2, 'matchLineToProducts(dims): finds 2 tile products');
// The 12x24 product should score higher due to exact dimension match
assert(
  dimSuggestions[0].product.sku === 'DIM-001',
  'matchLineToProducts(dims): 12x24 ranked first for 12x24 line'
);
assert(
  dimSuggestions[0].matchScore > dimSuggestions[1].matchScore,
  'matchLineToProducts(dims): exact dim match scores higher'
);

// -- Enhanced generateShoppingList structure --
E.CatalogStore.clearAll();
E.CatalogStore.upsertProduct({
  sku: 'SL-001',
  brand: 'Versabond',
  title: 'Thinset 50lb',
  category: 'mortar',
  unitType: 'bag',
  coveragePerUnit: 100,
  source: 'test',
});
E.CatalogStore.upsertPrice({
  sku: 'SL-001',
  price: 18.97,
  priceType: 'regular',
  source: 'test',
  observedAt: new Date().toISOString(),
});
E.CatalogStore.setStorePreference({
  zipCode: '08401',
  storeName: 'AC Store',
  storeId: '1234',
  retailer: 'homedepot',
});

const slEstimate = {
  lines: [
    {
      id: 'SL1',
      roomId: 'R1',
      surfaceKind: 'floor',
      category: 'mortar',
      description: 'Thinset mortar',
      rawQuantity: 200,
      wastePercent: 10,
      adjustedQuantity: 220,
      packUnit: 'bag',
      packsNeeded: 3,
    },
  ],
};
const sl = E.generateShoppingList(slEstimate);
assert(sl !== null, 'generateShoppingList(v2): returns result');
assert(typeof sl.grouped === 'object', 'generateShoppingList(v2): has grouped');
assert(
  typeof sl.totalEstimatedCost === 'number' || sl.totalEstimatedCost === null,
  'generateShoppingList(v2): has totalEstimatedCost'
);
assert(typeof sl.itemCount === 'number', 'generateShoppingList(v2): has itemCount');
assert(sl.itemCount === 1, 'generateShoppingList(v2): itemCount = 1');
assert(sl.retailer === 'homedepot', 'generateShoppingList(v2): retailer from storePref');
assert(sl.zipCode === '08401', 'generateShoppingList(v2): zipCode from storePref');
assert(typeof sl.generatedAt === 'number', 'generateShoppingList(v2): generatedAt is timestamp');

// Check that suggestions got retailer URLs enriched
if (sl.items[0].suggestions.length > 0) {
  const topSugg = sl.items[0].suggestions[0];
  assert(
    typeof topSugg.product.productUrl === 'string' || topSugg.product.productUrl === undefined,
    'generateShoppingList(v2): suggestion has productUrl or undefined'
  );
}

// Grouped structure
if (sl.grouped['mortar']) {
  assert(sl.grouped['mortar'].length === 1, 'generateShoppingList(v2): grouped mortar has 1 item');
}

// Store preference with retailer field
const sp2 = E.CatalogStore.getStorePreference();
assert(sp2.retailer === 'homedepot', 'CatalogStore: store pref retailer field preserved');

E.CatalogStore.clearAll();

// -- VERSION export --
assert(E.VERSION === '2.0.0', 'VERSION export = 2.0.0');

// ═══════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════

console.log('');
console.log('Estimator Engine Tests:  ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed.');
}
