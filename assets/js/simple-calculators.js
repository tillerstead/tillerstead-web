(function () {
  'use strict';

  function round(value, digits) {
    var factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function initTileCalculator() {
    var form = document.getElementById('simple-tile-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var area = parseFloat(document.getElementById('tile-area').value) || 0;
      var lengthIn = parseFloat(document.getElementById('tile-length').value) || 0;
      var widthIn = parseFloat(document.getElementById('tile-width').value) || 0;
      var wastePct = parseFloat(document.getElementById('tile-waste').value) || 0;
      var perBox = parseFloat(document.getElementById('tile-per-box').value) || 0;

      if (area <= 0 || lengthIn <= 0 || widthIn <= 0) return;

      var tileAreaSqIn = lengthIn * widthIn;
      var projectAreaSqIn = area * 144;
      var rawTiles = projectAreaSqIn / tileAreaSqIn;
      var totalTiles = Math.ceil(rawTiles * (1 + wastePct / 100));
      var coverage = round(area * (1 + wastePct / 100), 1);
      var boxes = perBox > 0 ? Math.ceil(totalTiles / perBox) : null;

      document.getElementById('tile-result-count').textContent = String(totalTiles);
      document.getElementById('tile-result-coverage').textContent = String(coverage);
      document.getElementById('tile-result-boxes').textContent =
        boxes === null ? 'n/a' : String(boxes);
      document.getElementById('simple-tile-results').classList.remove('hidden');
    });
  }

  function initMaterialEstimator() {
    var form = document.getElementById('simple-material-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var length = parseFloat(document.getElementById('mat-length').value) || 0;
      var width = parseFloat(document.getElementById('mat-width').value) || 0;
      var height = parseFloat(document.getElementById('mat-height').value) || 0;
      var wetPercent = parseFloat(document.getElementById('mat-wet-percent').value) || 0;

      if (length <= 0 || width <= 0 || height <= 0) return;

      var floorArea = length * width;
      var perimeter = 2 * (length + width);
      var wallArea = perimeter * height * (wetPercent / 100);
      var totalTileArea = (floorArea + wallArea) * 1.12;
      var backerSheets = Math.ceil(totalTileArea / 15);
      var membraneRolls = Math.ceil(totalTileArea / 54);

      document.getElementById('mat-result-tile').textContent = String(round(totalTileArea, 1));
      document.getElementById('mat-result-board').textContent = String(backerSheets);
      document.getElementById('mat-result-membrane').textContent = String(membraneRolls);
      document.getElementById('simple-material-results').classList.remove('hidden');
    });
  }

  function initProjectPlanner() {
    var form = document.getElementById('simple-planner-form');
    if (!form) return;

    var baseDaysBySize = {
      small: 3,
      medium: 6,
      large: 10,
    };

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var size = document.getElementById('plan-size').value;
      var crew = parseFloat(document.getElementById('plan-crew').value) || 1;
      var complexity = parseFloat(document.getElementById('plan-complexity').value) || 1;
      var base = baseDaysBySize[size] || baseDaysBySize.medium;

      var effectiveDays = (base * complexity) / Math.max(crew / 2, 0.5);
      var prep = Math.max(1, Math.round(effectiveDays * 0.25));
      var waterproof = Math.max(1, Math.round(effectiveDays * 0.2));
      var setting = Math.max(1, Math.round(effectiveDays * 0.4));
      var finish = Math.max(1, Math.round(effectiveDays * 0.15));
      var total = prep + waterproof + setting + finish;

      document.getElementById('plan-result-prep').textContent = String(prep);
      document.getElementById('plan-result-waterproof').textContent = String(waterproof);
      document.getElementById('plan-result-setting').textContent = String(setting);
      document.getElementById('plan-result-finish').textContent = String(finish);
      document.getElementById('plan-result-total').textContent = String(total);
      document.getElementById('simple-planner-results').classList.remove('hidden');
    });
  }

  function initRoiCalculator() {
    var form = document.getElementById('simple-roi-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var cost = parseFloat(document.getElementById('roi-cost').value) || 0;
      var homeValue = parseFloat(document.getElementById('roi-home-value').value) || 0;
      var liftPercent = parseFloat(document.getElementById('roi-lift-percent').value) || 0;
      var savings = parseFloat(document.getElementById('roi-savings').value) || 0;

      if (cost <= 0 || homeValue <= 0) return;

      var lift = homeValue * (liftPercent / 100);
      var net = lift - cost;
      var roiPercent = (net / cost) * 100;
      var annualBenefit = lift * 0.02 + savings;
      var paybackYears = annualBenefit > 0 ? cost / annualBenefit : null;

      document.getElementById('roi-result-lift').textContent = formatCurrency(lift);
      document.getElementById('roi-result-net').textContent = formatCurrency(net);
      document.getElementById('roi-result-percent').textContent = round(roiPercent, 1) + '%';
      document.getElementById('roi-result-payback').textContent =
        paybackYears === null ? 'n/a' : round(paybackYears, 1) + ' years';
      document.getElementById('simple-roi-results').classList.remove('hidden');
    });
  }

  initTileCalculator();
  initMaterialEstimator();
  initProjectPlanner();
  initRoiCalculator();
})();
