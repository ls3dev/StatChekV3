const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Add support for the packages in the monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add the Convex package to extraNodeModules
config.resolver.extraNodeModules = {
  '@statcheck/convex': path.resolve(workspaceRoot, 'packages/convex'),
};

// Enable package exports for Better Auth
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
