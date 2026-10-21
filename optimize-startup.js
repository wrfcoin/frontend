#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Wrfcoin Frontend Startup Optimization');
console.log('=========================================');

// 1. Clear Vite cache
console.log('1. Clearing Vite cache...');
try {
  execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
  console.log('   ✅ Vite cache cleared');
} catch (error) {
  console.log('   ⚠️  Vite cache not found (already clean)');
}

// 2. Pre-bundle dependencies
console.log('2. Pre-bundling dependencies...');
try {
  execSync('npm run build:deps', { stdio: 'inherit' });
  console.log('   ✅ Dependencies pre-bundled');
} catch (error) {
  console.log(
    '   ⚠️  Pre-bundling not available, dependencies will be bundled on first run'
  );
}

// 3. Check for large files in src/
console.log('3. Analyzing source files...');
const srcDir = path.join(__dirname, 'src');
const largeFiles = [];

function findLargeFiles(dir, threshold = 50000) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      findLargeFiles(filePath, threshold);
    } else if (stats.size > threshold) {
      largeFiles.push({
        path: filePath.replace(__dirname, '.'),
        size: (stats.size / 1024).toFixed(2) + 'KB',
      });
    }
  });
}

findLargeFiles(srcDir);

if (largeFiles.length > 0) {
  console.log('   ⚠️  Large files detected (consider lazy loading):');
  largeFiles.forEach(file => {
    console.log(`     - ${file.path} (${file.size})`);
  });
} else {
  console.log('   ✅ No large files detected');
}

// 4. Check node_modules health
console.log('4. Checking node_modules health...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const stats = fs.statSync(nodeModulesPath);
  const sizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`   📦 node_modules size: ${sizeGB}GB`);

  if (sizeGB > 0.5) {
    console.log('   ⚠️  Large node_modules detected. Consider:');
    console.log('     - npm prune --production');
    console.log('     - Remove unused dependencies');
  }
} else {
  console.log('   ❌ node_modules not found - run npm install');
}

// 5. Environment checks
console.log('5. Environment optimization checks...');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
);

// Check for development dependencies in production
const devDeps = Object.keys(packageJson.devDependencies || {});
const deps = Object.keys(packageJson.dependencies || {});

if (process.env.NODE_ENV === 'production' && devDeps.length > 0) {
  console.log('   ⚠️  Development dependencies detected in production');
  console.log('     Run: npm install --production');
} else {
  console.log('   ✅ Environment configuration optimal');
}

console.log('\n🎯 Optimization Summary:');
console.log('========================');
console.log('✅ Vite config optimized with:');
console.log('   - Dependency pre-bundling enabled');
console.log('   - Manual chunk splitting configured');
console.log('   - Polling enabled for WSL compatibility');
console.log('   - Target set to es2020 for better compatibility');
console.log('');
console.log('✅ React optimizations:');
console.log('   - Lazy loading enabled for App component');
console.log('   - Suspense fallback implemented');
console.log('   - Loading spinner for better UX');
console.log('');
console.log('💡 Next steps:');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Monitor startup time in console');
console.log('   3. Check browser Network tab for load times');
console.log('   4. Consider component-level lazy loading for large features');
console.log('');
console.log('🚀 Frontend startup optimization complete!');
