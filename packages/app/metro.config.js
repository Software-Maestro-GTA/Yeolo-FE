const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
// This points to the monorepo root (Yeolo-FE)
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (so we can import from @yeolo/common)
config.watchFolders = [workspaceRoot];

// 2. Force Metro to resolve modules from both the local node_modules and the monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Disable hierarchical lookup to ensure symlinked monorepo packages resolve correctly
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
