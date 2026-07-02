export default {
  // Use commit SHA in CI for deterministic cache busting; local dev falls back to timestamp.
  hash: process.env.GITHUB_SHA?.slice(0, 12) || `${Date.now()}`,
};
