const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Gioi han so worker Metro de tranh OOM / crash jest-worker tren Windows
config.maxWorkers = 2;

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. FORCE Metro to strictly resolve 'react', 'react/jsx-runtime', etc. to mobile's React 18.3.1
const mobileReact = path.resolve(projectRoot, 'node_modules/react');
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: mobileReact,
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return {
      filePath: path.resolve(mobileReact, 'index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react/jsx-runtime') {
    return {
      filePath: path.resolve(mobileReact, 'jsx-runtime.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return {
      filePath: path.resolve(mobileReact, 'jsx-dev-runtime.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName.startsWith('react/')) {
    const sub = moduleName.slice('react/'.length);
    const subPath = path.resolve(mobileReact, sub.endsWith('.js') ? sub : `${sub}.js`);
    return {
      filePath: subPath,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

