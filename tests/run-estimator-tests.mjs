// ESM wrapper: setup browser shim, load engine, run tests
globalThis.window = globalThis;

// localStorage shim for CatalogStore tests
if (!globalThis.localStorage) {
  const _store = {};
  globalThis.localStorage = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null; },
    setItem(k, v) { _store[k] = String(v); },
    removeItem(k) { delete _store[k]; },
    clear() { for (const k in _store) delete _store[k]; },
  };
}

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Load engine IIFE via require (side-effect: sets window.TillersteadEstimator)
require('../assets/js/estimator-engine.js');

// Load and run the test suite
require('./estimator-engine.test.js');
