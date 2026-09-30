const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = path.resolve(__dirname, '../apps/mobile_vione');
const monorepoRoot = path.resolve(__dirname, '..');

const mobileReact = path.resolve(projectRoot, 'node_modules/react');

const resolveRequest = (context, moduleName, platform) => {
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
  return context.resolveRequest(context, moduleName, platform);
};

// Test resolving from node_modules/react-native
const rnFile = path.resolve(monorepoRoot, 'node_modules/react-native/Libraries/Renderer/shims/React.js');
console.log('Testing custom resolver hook...');
const mockContext = {
  originModulePath: rnFile,
  resolveRequest: (ctx, name) => ({ filePath: 'fallback:' + name, type: 'sourceFile' }),
};

const resolved = resolveRequest(mockContext, 'react', 'android');
console.log('Resolved for react-native:', resolved);
console.log('Resolved version:', require(resolved.filePath).version);
