const ts = require('typescript');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');

function parse(source, file = 'source.tsx') {
  return ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}
function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, child => visit(child, callback));
}
function family(path) {
  const match = path.match(/^\/api\/([\w-]+)(?:\/([\w-]+))?/);
  if (!match) return null;
  // A mounted /api/v1/rewards must not authorize /api/v1/defi.
  return /^v\d+$/.test(match[1]) ? `${match[1]}/${match[2] || ''}` : match[1];
}
function apiFamilies(source) {
  const found = new Set();
  const tree = parse(source);
  const receivers = new Map();
  const scopeOf = node => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isBlock(current) || ts.isClassDeclaration(current) || ts.isSourceFile(current)) return current;
    }
    return tree;
  };
  const bind = (scope, name, known) => {
    if (!receivers.has(scope)) receivers.set(scope, new Map());
    receivers.get(scope).set(name, known);
  };
  bind(tree, 'apiClient', true);
  const isClient = node => {
    const name = node.getText(tree);
    for (let current = node; current; current = current.parent) {
      const bindings = receivers.get(current);
      if (bindings?.has(name)) return bindings.get(name);
    }
    return false;
  };
  const constructors = new Set(['ApiClient']);
  visit(tree, node => {
    if (ts.isImportDeclaration(node) && /apiClient|^\.\/client$/.test(node.moduleSpecifier.text)) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const item of bindings.elements) {
          if ((item.propertyName?.text || item.name.text) === 'apiClient') bind(tree, item.name.text, true);
          if ((item.propertyName?.text || item.name.text) === 'ApiClient') constructors.add(item.name.text);
        }
      }
    }
  });
  visit(tree, node => {
    // A local unrelated client shadows an imported/constructed receiver.
    if (ts.isVariableDeclaration(node)) {
      const known = node.initializer && ts.isNewExpression(node.initializer) &&
        constructors.has(node.initializer.expression.getText(tree));
      bind(scopeOf(node), node.name.getText(tree), Boolean(known));
    }
    if (ts.isPropertyDeclaration(node) && ts.isIdentifier(node.name)) {
      const known = node.initializer && ts.isNewExpression(node.initializer) &&
        constructors.has(node.initializer.expression.getText(tree));
      bind(scopeOf(node), `this.${node.name.text}`, Boolean(known));
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isNewExpression(node.right) && constructors.has(node.right.expression.getText(tree))) {
      let owner = node.parent;
      while (owner && !ts.isClassDeclaration(owner) && !ts.isSourceFile(owner)) owner = owner.parent;
      bind(owner || tree, node.left.getText(tree), true);
    }
  });
  visit(tree, node => {
    let value = ts.isStringLiteralLike(node) ? node.text : '';
    if (ts.isTemplateExpression(node)) {
      value = node.head.text;
      const base = node.templateSpans[0].expression.getText(tree);
      const tail = node.templateSpans[0].literal.text;
      // An external block-explorer link (`${EXPLORER_BASE_URL}/tx/${hash}`) is
      // an href, not a backend call. Exempt ONLY that constant with a /tx/ or
      // /address/ path; any other base or path keeps its API shape.
      const explorerLink = /^(?:EXPLORER_BASE_URL|explorerBaseUrl)$/.test(base) && /^\/(?:tx|address)\//.test(tail);
      if (!value && !explorerLink && /(?:BASE|API|ENDPOINT)/i.test(base)) {
        value = `/api${tail}`;
      }
    }
    const result = family(value);
    if (result) found.add(result);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        /^(get|post|put|patch|delete|request|getWithFallback|postWithFallback)$/.test(node.expression.name.text) &&
        isClient(node.expression.expression)) {
      const arg = node.arguments[0];
      const paths = arg && ts.isArrayLiteralExpression(arg) ? arg.elements : [arg];
      for (const path of paths) {
        const relative = path && (ts.isStringLiteralLike(path) ? path.text : ts.isTemplateExpression(path) ? path.head.text : '');
        if (relative?.startsWith('/')) {
          const called = family(relative.startsWith('/api/') ? relative : `/api${relative}`);
          if (called) found.add(called);
        }
      }
    }
  });
  return [...found].sort();
}
function checksum(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
function validateManifest(manifest) {
  const { checksum: recorded, ...payload } = manifest;
  if (!/^[a-f0-9]{40}$/.test(payload.backendCommit) || !payload.families?.length ||
      checksum(payload) !== recorded) throw new Error('Invalid generated backend manifest');
}
function checkSurface(callers, manifest, baseline) {
  validateManifest(manifest);
  if (!callers.length) throw new Error('VOID: no API callers');
  const unknown = callers.filter(value => !manifest.families.includes(value));
  const added = unknown.filter(value => !baseline.includes(value));
  const stale = baseline.filter(value => !unknown.includes(value));
  if (added.length || stale.length) throw new Error(`API surface: added=${added.join(',')} stale=${stale.join(',')}`);
}

// Inventory concrete mounts and routes, never treating a bare /api mount as
// authority for every family. Backend sources are read by Git at one revision.
function mountedFamilies(source, readSource) {
  const found = new Set();
  const imports = new Map();
  const tree = parse(source);
  for (const node of tree.statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause) continue;
    const names = node.importClause.namedBindings;
    if (names && ts.isNamedImports(names)) {
      for (const item of names.elements) imports.set(item.name.text, node.moduleSpecifier.text);
    }
  }
  function add(path) { const value = family(path); if (value) found.add(value); }
  function router(module, prefix) {
    const body = readSource(module);
    visit(parse(body), node => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
          /^(get|post|put|patch|delete|all|use)$/.test(node.expression.name.text) &&
          node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        add(`${prefix}${node.arguments[0].text}`);
      }
    });
  }
  visit(tree, node => {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
        ts.isIdentifier(node.left) && node.left.text === 'path' && ts.isStringLiteral(node.right)) add(node.right.text);
    if (!ts.isCallExpression(node)) return;
    const expression = node.expression.getText(tree);
    const first = node.arguments[0];
    if (expression === 'safeMount' && first && ts.isStringLiteral(first)) {
      if (first.text === '/api') router(node.arguments[1].text, '/api');
      else add(first.text);
    }
    if (expression === 'app.use' && first && ts.isStringLiteral(first)) {
      if (first.text !== '/api') add(first.text);
      else {
        const handler = node.arguments[1];
        if (handler && ts.isCallExpression(handler)) {
          const module = imports.get(handler.expression.getText(tree));
          if (!module) throw new Error(`Unrecognized bare /api factory: ${handler.getText(tree)}`);
          router(module, '/api');
        }
        // enhancedApiProbes exposes only non-API health/readiness paths.
        else if (handler?.getText(tree) !== 'enhancedApiProbes.router') throw new Error('Unrecognized bare /api router');
      }
    }
  });
  return [...found].sort();
}
function generateManifest(repo) {
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const backendCommit = git('rev-parse', 'origin/main');
  const sourcePath = 'server/enhanced_unified_api_optimized.ts';
  const payload = {
    backendCommit, backendShortSha: backendCommit.slice(0, 12), sourcePath,
    families: mountedFamilies(git('show', `${backendCommit}:${sourcePath}`), module => {
      const base = `server/${module.replace(/^\.\//, '').replace(/\.js$/, '')}`;
      for (const suffix of ['.ts', '.js']) {
        try { return git('show', `${backendCommit}:${base}${suffix}`); } catch { /* try source extension */ }
      }
      throw new Error(`Cannot inventory router ${module}`);
    }),
  };
  return { ...payload, checksum: checksum(payload) };
}
module.exports = { apiFamilies, mountedFamilies, checksum, validateManifest, checkSurface, generateManifest };

// First operation tranche: WeatherService only. Explicit base bindings are
// required; unsupported URL syntax refuses instead of claiming broad coverage.
function apiOperations(source, baseBindings = {}) {
  const tree = parse(source);
  const variables = new Map();
  const clients = new Map();
  const constructors = new Set();
  const bindings = new Map(Object.entries(baseBindings));
  visit(tree, node => {
    if (ts.isImportDeclaration(node) && /apiClient|^\.\/client$/.test(node.moduleSpecifier.text)) {
      const names = node.importClause?.namedBindings;
      if (names && ts.isNamedImports(names)) for (const item of names.elements) {
        if ((item.propertyName?.text || item.name.text) === 'ApiClient') constructors.add(item.name.text);
      }
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const entries = variables.get(node.name.text) || [];
      variables.set(node.name.text, [...entries, node.initializer]);
    }
  });
  function receiverKey(node, receiver) {
    if (!receiver.startsWith('this.')) return receiver;
    let parent = node.parent;
    while (parent && !ts.isClassDeclaration(parent) && !ts.isClassExpression(parent)) parent = parent.parent;
    if (!parent) throw new Error('Operation field outside class');
    return `${parent.pos}:${receiver}`;
  }
  function value(node, dynamic = false, seen = new Set()) {
    if (!node) throw new Error('Missing operation URL');
    const name = node.getText(tree);
    if (bindings.has(name)) return bindings.get(name);
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isParenthesizedExpression(node)) return value(node.expression, dynamic, seen);
    if (ts.isIdentifier(node) && variables.has(name)) {
      if (seen.has(name)) throw new Error('Cyclic operation URL');
      if (variables.get(name).length !== 1) throw new Error('Unsupported shadowed operation binding');
      return value(variables.get(name)[0], dynamic, new Set([...seen, name]));
    }
    if (ts.isObjectLiteralExpression(node)) {
      return Object.fromEntries(node.properties.map(p => {
        if (!ts.isPropertyAssignment(p)) throw new Error('Unsupported operation base object');
        return [p.name.text, value(p.initializer, false, seen)];
      }));
    }
    if (ts.isPropertyAccessExpression(node)) {
      const parent = value(node.expression, false, seen);
      if (parent && typeof parent === 'object' && node.name.text in parent) return parent[node.name.text];
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      return value(node.left, dynamic, seen) + value(node.right, dynamic, seen);
    }
    if (ts.isTemplateExpression(node)) {
      return node.head.text + node.templateSpans.map((span, index) => {
        // Encoded dynamic arguments must occupy complete path segments.
        const encoded = ts.isCallExpression(span.expression) &&
          span.expression.expression.getText(tree) === 'encodeURIComponent' &&
          span.expression.arguments.length === 1;
        if (encoded && dynamic) {
          const previous = index === 0 ? node.head.text : node.templateSpans[index - 1].literal.text;
          if (!previous.endsWith('/') || !/^(?:[/?]|$)/.test(span.literal.text)) {
            throw new Error('Unsupported partial operation parameter');
          }
        }
        return (encoded && dynamic ? ':parameter' : value(span.expression, false, seen)) + span.literal.text;
      }).join('');
    }
    throw new Error(`Unsupported operation URL/base: ${name}`);
  }
  function base(node) {
    if (!ts.isNewExpression(node) || !constructors.has(node.expression.getText(tree))) return null;
    const options = value(node.arguments[0]);
    if (typeof options?.baseUrl !== 'string' || !/^\/api(?:\/[^?#]*)?$/.test(options.baseUrl)) {
      throw new Error('Unsupported operation client base');
    }
    return options.baseUrl.replace(/\/+$/, '');
  }
  visit(tree, node => {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isNewExpression(node.initializer)) {
      const prefix = base(node.initializer); if (prefix !== null) clients.set(node.name.getText(tree), prefix);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isNewExpression(node.right)) {
      const prefix = base(node.right); if (prefix !== null) clients.set(receiverKey(node, node.left.getText(tree)), prefix);
    }
    if (ts.isPropertyDeclaration(node) && node.initializer && ts.isNewExpression(node.initializer)) {
      const prefix = base(node.initializer); if (prefix !== null) clients.set(receiverKey(node, `this.${node.name.getText(tree)}`), prefix);
    }
  });
  const result = [];
  visit(tree, node => {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
    const receiver = receiverKey(node, node.expression.expression.getText(tree));
    if (!clients.has(receiver)) return;
    if (variables.get(receiver)?.length > 1) throw new Error('Unsupported shadowed operation client');
    const method = node.expression.name.text;
    if (!/^(get|post|put|patch|delete)$/.test(method)) throw new Error(`Unsupported operation method: ${method}`);
    const suffix = value(node.arguments[0], true);
    if (typeof suffix !== 'string' || !suffix.startsWith('/')) throw new Error('Unsupported operation path');
    result.push({ method: method.toUpperCase(), path: clients.get(receiver) + suffix });
  });
  return result;
}

function checkOperations(callers, manifest, expectedBackendCommit) {
  const { checksum: recorded, ...payload } = manifest;
  if (checksum(payload) !== recorded || !payload.operations?.length ||
      !/^[a-f0-9]{40}$/.test(payload.backendCommit)) throw new Error('Invalid operation manifest');
  if (payload.backendCommit !== expectedBackendCommit) throw new Error('Stale backend operation pin');
  if (!callers.length) throw new Error('VOID: no operation callers');
  for (const caller of callers) {
    const path = caller.path.split('?')[0];
    const found = payload.operations.some(route => {
      if (caller.method !== route.method) return false;
      const pattern = route.path.split('/').map(part => part.startsWith(':') ? '[^/]+' :
        part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/');
      return new RegExp(`^${pattern}$`).test(path);
    });
    if (!found) throw new Error(`Unmounted operation: ${caller.method} ${caller.path}`);
  }
}

function generateOperationManifest(repo) {
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const backendCommit = git('rev-parse', 'origin/main').trim();
  const sourcePath = 'server/enhanced_unified_api_optimized.ts';
  const entry = git('show', `${backendCommit}:${sourcePath}`);
  const entryTree = parse(entry);
  let weatherMounted = false, detailsMounted = false, detailsImported = false;
  let ownerMounted = false, ownerImported = false;
  visit(entryTree, node => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === './routes/station-detail-routes.js' &&
        node.importClause?.namedBindings?.getText(entryTree).includes('createStationDetailRouter')) detailsImported = true;
    if (ts.isImportDeclaration(node) && node.moduleSpecifier.text === './routes/station-owner-routes.js' &&
        node.importClause?.namedBindings?.getText(entryTree).includes('createStationOwnerRouter')) ownerImported = true;
    if (!ts.isCallExpression(node)) return;
    if (node.expression.getText(entryTree) === 'app.use' && node.arguments[0]?.text === '/api' &&
        ts.isCallExpression(node.arguments[1]) && node.arguments[1].expression.getText(entryTree) === 'createStationOwnerRouter') ownerMounted = true;
    if (node.expression.getText(entryTree) === 'safeMount' && node.arguments[0]?.text === '/api/weather' &&
        node.arguments[1]?.text === './routes/weather-routes') weatherMounted = true;
    if (node.expression.getText(entryTree) === 'app.use' && node.arguments[0]?.text === '/api' &&
        ts.isCallExpression(node.arguments[1]) && node.arguments[1].expression.getText(entryTree) === 'createStationDetailRouter') detailsMounted = true;
  });
  if (!weatherMounted || !detailsMounted || !detailsImported || !ownerMounted || !ownerImported) throw new Error('Weather operation tranche is not canonically mounted');
  const sources = [{ path: sourcePath, sha256: createHash('sha256').update(entry).digest('hex') }];
  const operations = [];
  for (const [path, prefix] of [['server/routes/weather-routes.js', '/api/weather'], ['server/routes/station-detail-routes.ts', '/api'], ['server/routes/station-owner-routes.ts', '/api']]) {
    const source = git('show', `${backendCommit}:${path}`);
    sources.push({ path, sha256: createHash('sha256').update(source).digest('hex') });
    const tree = parse(source);
    visit(tree, node => {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression) ||
          node.expression.expression.getText(tree) !== 'router' ||
          !/^(get|post|put|patch|delete)$/.test(node.expression.name.text) ||
          !ts.isStringLiteral(node.arguments[0])) return;
      operations.push({ method: node.expression.name.text.toUpperCase(), path: prefix + node.arguments[0].text,
        sourcePath: path, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1 });
    });
  }
  operations.sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
  const payload = { backendCommit, sourcePath, sources, operations };
  return { ...payload, checksum: checksum(payload) };
}
module.exports.apiOperations = apiOperations;
module.exports.checkOperations = checkOperations;
module.exports.generateOperationManifest = generateOperationManifest;
