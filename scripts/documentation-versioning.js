#!/usr/bin/env node

/**
 * Documentation Versioning System for WRFCoin Frontend
 * Implements Git-based versioning for component documentation
 * Part of Task 45.12 - Documentation Versioning System
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentationVersioning {
  constructor() {
    this.rootPath = path.join(__dirname, '..');
    this.versionsPath = path.join(this.rootPath, 'docs/versions');
    this.currentVersion = this.getCurrentVersion();
    this.versionsManifest = path.join(this.versionsPath, 'versions.json');
  }

  /**
   * Get current version from package.json or git tag
   */
  getCurrentVersion() {
    try {
      // Try to get version from git tag
      const gitTag = execSync(
        'git describe --tags --abbrev=0 2>/dev/null || echo ""',
        { encoding: 'utf8' }
      ).trim();
      if (gitTag) {
        return gitTag.replace(/^v/, ''); // Remove 'v' prefix if present
      }

      // Fallback to package.json version
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.rootPath, 'package.json'), 'utf8')
      );
      return packageJson.version || '1.0.0';
    } catch (error) {
      console.warn('Could not determine version, using default 1.0.0');
      return '1.0.0';
    }
  }

  /**
   * Initialize versioning system
   */
  initialize() {
    console.log('🚀 Initializing documentation versioning system...');

    // Create versions directory
    if (!fs.existsSync(this.versionsPath)) {
      fs.mkdirSync(this.versionsPath, { recursive: true });
    }

    // Initialize versions manifest
    this.initializeVersionsManifest();

    // Create version management scripts
    this.createVersionManagementScripts();

    // Set up git hooks for automatic versioning
    this.setupGitHooks();

    console.log('✅ Documentation versioning system initialized');
  }

  /**
   * Initialize versions manifest file
   */
  initializeVersionsManifest() {
    let manifest = {
      currentVersion: this.currentVersion,
      versions: [],
      defaultVersion: this.currentVersion,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Load existing manifest if it exists
    if (fs.existsSync(this.versionsManifest)) {
      try {
        const existing = JSON.parse(
          fs.readFileSync(this.versionsManifest, 'utf8')
        );
        manifest = {
          ...existing,
          currentVersion: this.currentVersion,
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.warn('Could not load existing manifest, creating new one');
      }
    }

    // Ensure current version is in the versions list
    if (!manifest.versions.find(v => v.version === this.currentVersion)) {
      manifest.versions.push({
        version: this.currentVersion,
        createdAt: new Date().toISOString(),
        gitHash: this.getGitHash(),
        branch: this.getGitBranch(),
        components: this.getComponentCount(),
        documentation: {
          storybook: true,
          typedoc: true,
          mdx: true,
        },
        status: 'current',
      });
    }

    // Sort versions by semantic version
    manifest.versions.sort((a, b) =>
      this.compareVersions(b.version, a.version)
    );

    fs.writeFileSync(this.versionsManifest, JSON.stringify(manifest, null, 2));
    console.log(
      `📄 Versions manifest updated with ${manifest.versions.length} versions`
    );
  }

  /**
   * Create a new documentation version
   */
  createVersion(versionNumber = null, options = {}) {
    const version = versionNumber || this.getCurrentVersion();
    const versionPath = path.join(this.versionsPath, version);

    console.log(`📦 Creating documentation version ${version}...`);

    // Create version directory
    if (!fs.existsSync(versionPath)) {
      fs.mkdirSync(versionPath, { recursive: true });
    }

    // Build Storybook for this version
    this.buildStorybookVersion(version, versionPath);

    // Generate TypeDoc for this version
    this.generateTypeDocVersion(version, versionPath);

    // Copy component MDX files
    this.copyComponentDocs(version, versionPath);

    // Create version metadata
    this.createVersionMetadata(version, versionPath, options);

    // Update versions manifest
    this.updateVersionsManifest(version, options);

    // Create version index page
    this.createVersionIndexPage(version, versionPath);

    console.log(`✅ Documentation version ${version} created successfully`);
    return version;
  }

  /**
   * Build Storybook for specific version
   */
  buildStorybookVersion(version, versionPath) {
    console.log(`📚 Building Storybook for version ${version}...`);

    try {
      // Build Storybook
      execSync('npm run build-storybook', {
        cwd: this.rootPath,
        stdio: 'inherit',
      });

      // Copy Storybook build to version directory
      const storybookSource = path.join(this.rootPath, 'storybook-static');
      const storybookDest = path.join(versionPath, 'storybook');

      if (fs.existsSync(storybookSource)) {
        this.copyDirectory(storybookSource, storybookDest);
        console.log(`✅ Storybook for version ${version} built successfully`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to build Storybook for version ${version}:`,
        error.message
      );
    }
  }

  /**
   * Generate TypeDoc for specific version
   */
  generateTypeDocVersion(version, versionPath) {
    console.log(`📖 Generating TypeDoc for version ${version}...`);

    try {
      const typedocOutput = path.join(versionPath, 'typedoc');

      execSync(
        `npx typedoc --out "${typedocOutput}" src/components --theme default --exclude "**/*.stories.*" --exclude "**/*.test.*"`,
        {
          cwd: this.rootPath,
          stdio: 'inherit',
        }
      );

      console.log(`✅ TypeDoc for version ${version} generated successfully`);
    } catch (error) {
      console.error(
        `❌ Failed to generate TypeDoc for version ${version}:`,
        error.message
      );
    }
  }

  /**
   * Copy component documentation files
   */
  copyComponentDocs(version, versionPath) {
    const docsSource = path.join(this.rootPath, 'docs/components');
    const docsDest = path.join(versionPath, 'components');

    if (fs.existsSync(docsSource)) {
      this.copyDirectory(docsSource, docsDest);
      console.log(`✅ Component docs for version ${version} copied`);
    }
  }

  /**
   * Create version metadata file
   */
  createVersionMetadata(version, versionPath, options) {
    const metadata = {
      version: version,
      createdAt: new Date().toISOString(),
      gitHash: this.getGitHash(),
      gitBranch: this.getGitBranch(),
      gitTag: this.getGitTag(),
      components: this.getComponentCount(),
      author: this.getGitAuthor(),
      message: options.message || `Documentation version ${version}`,
      changelog: options.changelog || [],
      migrationGuide: options.migrationGuide || '',
      breakingChanges: options.breakingChanges || [],
      features: options.features || [],
      bugfixes: options.bugfixes || [],
      documentation: {
        storybook: fs.existsSync(path.join(versionPath, 'storybook')),
        typedoc: fs.existsSync(path.join(versionPath, 'typedoc')),
        components: fs.existsSync(path.join(versionPath, 'components')),
      },
      size: this.getDirectorySize(versionPath),
    };

    fs.writeFileSync(
      path.join(versionPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  /**
   * Update versions manifest with new version
   */
  updateVersionsManifest(version, options) {
    const manifest = JSON.parse(fs.readFileSync(this.versionsManifest, 'utf8'));

    // Mark previous current version as archived
    manifest.versions.forEach(v => {
      if (v.status === 'current') {
        v.status = 'archived';
      }
    });

    // Add or update this version
    const existingIndex = manifest.versions.findIndex(
      v => v.version === version
    );
    const versionData = {
      version: version,
      createdAt: new Date().toISOString(),
      gitHash: this.getGitHash(),
      branch: this.getGitBranch(),
      components: this.getComponentCount(),
      documentation: {
        storybook: true,
        typedoc: true,
        mdx: true,
      },
      status: 'current',
      changelog: options.changelog || [],
      breakingChanges: options.breakingChanges || [],
    };

    if (existingIndex >= 0) {
      manifest.versions[existingIndex] = versionData;
    } else {
      manifest.versions.push(versionData);
    }

    // Update manifest metadata
    manifest.currentVersion = version;
    manifest.lastUpdated = new Date().toISOString();

    // Sort versions
    manifest.versions.sort((a, b) =>
      this.compareVersions(b.version, a.version)
    );

    fs.writeFileSync(this.versionsManifest, JSON.stringify(manifest, null, 2));
  }

  /**
   * Create version index page
   */
  createVersionIndexPage(version, versionPath) {
    const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WRFCoin Component Documentation v${version}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 40px; background: #f8f9fa;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .version-badge { 
            display: inline-block; padding: 8px 16px; background: #0066cc; 
            color: white; border-radius: 20px; font-weight: bold; margin-bottom: 20px;
        }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: white; padding: 30px; border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-decoration: none; color: inherit;
            transition: transform 0.2s; 
        }
        .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .card h3 { margin: 0 0 10px 0; color: #0066cc; }
        .badge { 
            display: inline-block; padding: 4px 8px; background: #e3f2fd; 
            color: #1565c0; border-radius: 4px; font-size: 12px; margin: 5px 5px 0 0;
        }
        .nav { margin-bottom: 30px; text-align: center; }
        .nav a { margin: 0 15px; color: #0066cc; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="version-badge">v${version}</div>
            <h1>WRFCoin Component Documentation</h1>
            <p>Enterprise-grade component library documentation for version ${version}</p>
        </div>
        
        <div class="nav">
            <a href="../">← Back to Latest</a>
            <a href="../versions.html">All Versions</a>
            <a href="./changelog.html">Changelog</a>
        </div>
        
        <div class="cards">
            <a href="./storybook/index.html" class="card">
                <h3>📚 Component Library</h3>
                <p>Interactive component showcase with live examples and comprehensive documentation</p>
                <div class="badge">Storybook</div>
                <div class="badge">v${version}</div>
            </a>
            <a href="./typedoc/index.html" class="card">
                <h3>📖 API Reference</h3>
                <p>TypeScript API documentation with detailed type information</p>
                <div class="badge">TypeDoc</div>
                <div class="badge">v${version}</div>
            </a>
            <a href="./components/" class="card">
                <h3>📝 Component Docs</h3>
                <p>Individual component documentation and usage guidelines</p>
                <div class="badge">MDX</div>
                <div class="badge">v${version}</div>
            </a>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(versionPath, 'index.html'), indexContent);
  }

  /**
   * Create version management scripts
   */
  createVersionManagementScripts() {
    // Create version creation script
    const createVersionScript = `#!/usr/bin/env node

const DocumentationVersioning = require('./documentation-versioning.js');

const args = process.argv.slice(2);
const version = args[0];
const message = args[1] || \`Documentation version \${version || 'auto'}\`;

const versioning = new DocumentationVersioning();

if (version) {
  versioning.createVersion(version, { message });
} else {
  versioning.createVersion(null, { message });
}
`;

    fs.writeFileSync(
      path.join(__dirname, 'create-version.js'),
      createVersionScript
    );

    // Make executable
    try {
      execSync('chmod +x scripts/create-version.js', { cwd: this.rootPath });
    } catch (error) {
      // Ignore chmod errors on Windows
    }

    // Update package.json scripts
    this.updatePackageJsonScripts();
  }

  /**
   * Update package.json with versioning scripts
   */
  updatePackageJsonScripts() {
    const packageJsonPath = path.join(this.rootPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'docs:version': 'node scripts/create-version.js',
      'docs:version:major': 'npm version major && npm run docs:version',
      'docs:version:minor': 'npm version minor && npm run docs:version',
      'docs:version:patch': 'npm version patch && npm run docs:version',
      'docs:versions:list': 'node scripts/documentation-versioning.js list',
      'docs:versions:clean': 'node scripts/documentation-versioning.js clean',
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('📦 Package.json updated with versioning scripts');
  }

  /**
   * Set up git hooks for automatic versioning
   */
  setupGitHooks() {
    const gitHooksPath = path.join(this.rootPath, '.git/hooks');

    if (!fs.existsSync(gitHooksPath)) {
      console.log('⚠️  Git hooks directory not found, skipping hook setup');
      return;
    }

    const postCommitHook = `#!/bin/sh
# Auto-generate documentation version on tag creation

if git describe --exact-match --tags HEAD 2>/dev/null; then
  echo "Tag detected, creating documentation version..."
  cd frontend
  npm run docs:version
fi
`;

    const hookPath = path.join(gitHooksPath, 'post-commit');
    fs.writeFileSync(hookPath, postCommitHook);

    try {
      execSync(`chmod +x "${hookPath}"`);
      console.log('🪝 Git post-commit hook installed');
    } catch (error) {
      console.warn('Could not make git hook executable');
    }
  }

  /**
   * List all available versions
   */
  listVersions() {
    if (!fs.existsSync(this.versionsManifest)) {
      console.log('No versions found. Run initialize first.');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(this.versionsManifest, 'utf8'));

    console.log('\n📚 Available Documentation Versions:\n');
    console.log(`Current Version: ${manifest.currentVersion}`);
    console.log(`Total Versions: ${manifest.versions.length}\n`);

    manifest.versions.forEach(version => {
      const status =
        version.status === 'current' ? '🟢 CURRENT' : '🔵 ARCHIVED';
      const date = new Date(version.createdAt).toLocaleDateString();
      console.log(`${status} v${version.version} (${date})`);
      console.log(`    Components: ${version.components || 'Unknown'}`);
      console.log(`    Git Hash: ${version.gitHash || 'Unknown'}`);
      if (version.breakingChanges && version.breakingChanges.length > 0) {
        console.log(
          `    ⚠️  Breaking Changes: ${version.breakingChanges.length}`
        );
      }
      console.log('');
    });
  }

  /**
   * Clean old versions (keep last 10)
   */
  cleanOldVersions(keepCount = 10) {
    if (!fs.existsSync(this.versionsManifest)) {
      console.log('No versions found.');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(this.versionsManifest, 'utf8'));

    if (manifest.versions.length <= keepCount) {
      console.log(
        `Only ${manifest.versions.length} versions found, no cleanup needed.`
      );
      return;
    }

    // Sort by creation date and keep the most recent
    const sortedVersions = manifest.versions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const versionsToDelete = sortedVersions.slice(keepCount);

    console.log(`🗑️  Cleaning ${versionsToDelete.length} old versions...`);

    versionsToDelete.forEach(version => {
      const versionPath = path.join(this.versionsPath, version.version);
      if (fs.existsSync(versionPath)) {
        this.removeDirectory(versionPath);
        console.log(`   Deleted v${version.version}`);
      }
    });

    // Update manifest
    manifest.versions = sortedVersions.slice(0, keepCount);
    manifest.lastUpdated = new Date().toISOString();

    fs.writeFileSync(this.versionsManifest, JSON.stringify(manifest, null, 2));
    console.log(`✅ Cleanup complete. ${keepCount} versions retained.`);
  }

  // Utility methods
  getGitHash() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getGitBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  getGitTag() {
    try {
      return execSync(
        'git describe --exact-match --tags HEAD 2>/dev/null || echo ""',
        { encoding: 'utf8' }
      ).trim();
    } catch (error) {
      return '';
    }
  }

  getGitAuthor() {
    try {
      return execSync('git config user.name', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'Unknown';
    }
  }

  getComponentCount() {
    try {
      const componentsPath = path.join(this.rootPath, 'src/components');
      const files = execSync(
        `find "${componentsPath}" -name "*.jsx" -o -name "*.tsx" | wc -l`,
        { encoding: 'utf8' }
      );
      return parseInt(files.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  getDirectorySize(dirPath) {
    try {
      const size = execSync(`du -sh "${dirPath}" | cut -f1`, {
        encoding: 'utf8',
      }).trim();
      return size;
    } catch (error) {
      return 'unknown';
    }
  }

  compareVersions(a, b) {
    const aParts = a.split('.').map(num => parseInt(num));
    const bParts = b.split('.').map(num => parseInt(num));

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart > bPart) return 1;
      if (aPart < bPart) return -1;
    }

    return 0;
  }

  copyDirectory(src, dest) {
    try {
      execSync(`cp -r "${src}" "${dest}"`, { stdio: 'ignore' });
    } catch (error) {
      // Fallback for Windows
      try {
        execSync(`xcopy "${src}" "${dest}" /E /I /Q`, { stdio: 'ignore' });
      } catch (winError) {
        console.warn(`Could not copy directory from ${src} to ${dest}`);
      }
    }
  }

  removeDirectory(dirPath) {
    try {
      execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
    } catch (error) {
      // Fallback for Windows
      try {
        execSync(`rmdir /S /Q "${dirPath}"`, { stdio: 'ignore' });
      } catch (winError) {
        console.warn(`Could not remove directory ${dirPath}`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const versioning = new DocumentationVersioning();
  const command = process.argv[2];

  switch (command) {
    case 'init':
    case 'initialize':
      versioning.initialize();
      break;
    case 'create':
      const version = process.argv[3];
      const message = process.argv[4];
      versioning.createVersion(version, { message });
      break;
    case 'list':
      versioning.listVersions();
      break;
    case 'clean':
      const keepCount = parseInt(process.argv[3]) || 10;
      versioning.cleanOldVersions(keepCount);
      break;
    default:
      console.log(`
Documentation Versioning System

Commands:
  init                     Initialize versioning system
  create [version] [msg]   Create new documentation version
  list                     List all versions
  clean [count]            Clean old versions (keep last N)

Examples:
  node documentation-versioning.js init
  node documentation-versioning.js create 1.2.0 "Added new components"
  node documentation-versioning.js list
  node documentation-versioning.js clean 5
`);
  }
}

module.exports = DocumentationVersioning;
