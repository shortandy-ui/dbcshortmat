// Single explicit entry point (instead of a glob pattern in package.json's
// "main" field) — some build pipelines don't reliably resolve wildcard globs,
// so this just requires each function file directly to register them.
require("./functions/storage");
require("./functions/storage-list");
