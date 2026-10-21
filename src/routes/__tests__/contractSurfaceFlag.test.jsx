/** @jest-environment node */
import { readFileSync } from 'node:fs';

import { jest } from '@jest/globals';
import React from 'react';

import {
  filterContractSurfaceNavigation,
  filterPublicNavigation,
  filterPublicRouteNavigation,
  isContractSurfacesEnabled,
  isContractSurfacePath,
  isFullStudioEnabled,
  isPublicTestnetPath,
} from '../../config/contractSurfacePolicy';

const CONTRACT_ROUTE_PATHS = [
  '/defi',
  '/staking/vault',
  '/staking/liquid',
  '/bridge',
  '/bridge/monitor',
  '/bridge/analytics',
  '/bridge/optimizer',
  '/bridge/liquidity',
  '/bridge/tracker',
  '/bridge/portfolio',
  '/bridge/security',
  '/carbon/reporting',
  '/smart-contracts',
  '/smart-contract-graph',
];

const CONTRACT_FEATURE_KEYS = new Set([
  'contractSurfaces',
  'crossChain',
  'carbon',
  'defi',
  'staking',
  'liquidStaking',
  'smartContracts',
  'carbonReporting',
  'bridgeAdvanced',
]);

const PUBLIC_CORE_PATHS = new Set([
  '/',
  '/terms',
  '/privacy',
  '/api-terms',
  '/security',
  '/downloads',
]);

function collectPaths(node, paths = []) {
  if (!React.isValidElement(node)) return paths;
  if (typeof node.props.path === 'string') paths.push(node.props.path);
  React.Children.forEach(node.props.children, child => collectPaths(child, paths));
  return paths;
}

function flattenNavigation(items, paths = []) {
  return items.flatMap(item => [
    item.path,
    ...flattenNavigation(item.submenu ?? []),
    ...flattenNavigation(item.children ?? []),
  ]);
}

async function routePathsForContractFlag(rawValue) {
  const enabled = isContractSurfacesEnabled(rawValue);

  jest.resetModules();
  jest.unstable_mockModule('../../config/features', () => {
    const flags = new Proxy(
      {},
      {
        get: (_target, prop) =>
          CONTRACT_FEATURE_KEYS.has(String(prop)) ? enabled : true,
      },
    );
    return { default: flags, FEATURES: flags };
  });

  // Jest's experimental ESM loader cannot safely link these React import
  // graphs in parallel after resetModules(), so keep the imports serialized.
  const { default: dashboardRoutes } = await import('../dashboardRoutes');
  const { default: weatherRoutes } = await import('../weatherRoutes');
  const { default: defiRoutes } = await import('../defiRoutes');

  return [dashboardRoutes(), weatherRoutes(), defiRoutes()].flatMap(tree =>
    collectPaths(tree),
  );
}

describe('VITE_ENABLE_CONTRACT_SURFACES policy', () => {
  it.each([
    ['omitted', undefined],
    ['empty', ''],
    ['false', 'false'],
    ['case variant', 'TRUE'],
    ['leading whitespace', ' true'],
    ['trailing whitespace', 'true '],
    ['numeric text', '1'],
    ['boolean true', true],
  ])('hides contract surfaces for %s values', async (_label, rawValue) => {
    expect(isContractSurfacesEnabled(rawValue)).toBe(false);

    const paths = await routePathsForContractFlag(rawValue);
    // Positive controls: the route collectors and all three modules executed.
    expect(paths).toEqual(
      expect.arrayContaining(['/dashboard', '/weather/dashboard', '/fair-launch']),
    );
    for (const path of CONTRACT_ROUTE_PATHS) {
      expect(paths).not.toContain(path);
    }
  });

  it('exposes every inventoried route only for the exact string true', async () => {
    expect(isContractSurfacesEnabled('true')).toBe(true);

    const paths = await routePathsForContractFlag('true');
    expect(paths).toEqual(expect.arrayContaining(CONTRACT_ROUTE_PATHS));
  });
});

describe('public-testnet policy', () => {
  const omittedValues = [
    undefined,
    '',
    'false',
    'TRUE',
    ' true',
    'true ',
    '0',
    '1',
    'disabled',
    true,
    false,
    null,
  ];

  it.each(omittedValues)(
    'exposes minimal core paths for raw VITE_ENABLE_FULL_STUDIO=%p',
    rawValue => {
      const isFullStudio = isFullStudioEnabled(rawValue);
      const disallowedPaths = [
        '/resources',
        '/resources/wiki',
        '/dashboard',
        '/miner',
        '/pop',
        '/pop/submit',
        '/fair-launch',
        '/data/upload',
        '/climate/reports',
        '/quality',
        '/realtime/activity',
        '/realtime/status',
        '/realtime/status/history',
        '/alerts/remediation',
        '/alerts/remediation/desk',
        '/resilience',
        '/settings',
        '/settings/integrations',
        '/settings/modules',
        '/notifications',
        '/notifications/preferences',
        '/accessibility',
        '/accessibility/shortcuts',
        '/language',
        '/language/translations',
        '/exports',
        '/exports/templates',
        '/weather/forecast-coverage',
        '/weather/dashboard',
        '/forecast',
        '/forecast/studio',
        '/fleet',
        '/wallet',
        '/wallet/onboarding',
        '/wallet/abc',
        '/earnings',
        '/earnings/history',
      ];

      expect(isFullStudio).toBe(false);
      for (const path of PUBLIC_CORE_PATHS) {
        expect(isPublicTestnetPath(path, isFullStudio)).toBe(true);
      }

      for (const path of disallowedPaths) {
        expect(isPublicTestnetPath(path, isFullStudio)).toBe(false);
      }

      expect(isPublicTestnetPath('/onboarding/qr', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/onboarding/auto-detect', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/identity/names', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/resources', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/resources/wiki', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/analytics/unified', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/integrations/story-protocol', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/language/translations', isFullStudio)).toBe(false);
      expect(isPublicTestnetPath('/wallet/abc/xyz', isFullStudio)).toBe(false);
    },
  );

  it('unlocks all paths only for exact full-studio true', () => {
    const isFullStudio = isFullStudioEnabled('true');
    expect(isFullStudio).toBe(true);
    expect(isPublicTestnetPath('/dashboard', isFullStudio)).toBe(true);
    expect(isPublicTestnetPath('/resources', isFullStudio)).toBe(false);
    expect(isPublicTestnetPath('/wallet', isFullStudio)).toBe(false);
    expect(isPublicTestnetPath('/wallet/onboarding', isFullStudio)).toBe(false);
    expect(isPublicTestnetPath('/earnings', isFullStudio)).toBe(false);
    expect(isPublicTestnetPath('/earnings/rewards', isFullStudio)).toBe(false);
    expect(isPublicTestnetPath('/onboarding/qr', isFullStudio)).toBe(false);
    expect(isPublicTestnetPath('/wallet/abc', isFullStudio)).toBe(false);
  });

  describe('operator preview (frontend#348)', () => {
    const previewPaths = [
      '/wallet', '/wallet/onboarding', '/connect-station', '/onboarding/qr',
      '/miner', '/pop/submit', '/governance', '/nfts', '/leaderboard',
      '/identity/names', '/earnings', '/settings', '/notifications/preferences',
      '/fleet', '/forecast/studio',
    ];
    const neverPublicPaths = [
      '/debug', '/mcp', '/system', '/systems', '/zk', '/sharding',
      '/fair-launch', '/defi', '/bridge', '/resources', '/referrals',
      '/validators', '/network/mempool', '/oracle/slashing', '/integrations',
      '/weather/forecast-coverage', '/exports', '/language', '/accessibility',
    ];

    it('preview families stay hidden with full studio on but preview off', () => {
      for (const path of previewPaths) {
        expect(isPublicTestnetPath(path, true, false, false)).toBe(false);
        // frontend#437 / W28: the public build flag admits the exact /wallet and /connect-station of these
        // preview paths, and no descendant.
        expect(isPublicTestnetPath(path, true, true)).toBe(['/wallet', '/connect-station'].includes(path));
      }
    });

    it('preview alone (full studio off) exposes nothing new', () => {
      for (const path of [...previewPaths, ...neverPublicPaths]) {
        expect(isPublicTestnetPath(path, false, false, true)).toBe(false);
        expect(isPublicTestnetPath(path, false, true, true)).toBe(['/wallet', '/connect-station'].includes(path));
      }
    });

    it('both flags expose /wallet and /connect-station but no never-public path', () => {
      for (const path of previewPaths) {
        expect(isPublicTestnetPath(path, true, false, true)).toBe(true);
      }
      for (const path of neverPublicPaths) {
        expect(isPublicTestnetPath(path, true, false, true)).toBe(false);
      }
    });

    it('filterPublicNavigation threads the preview flag', () => {
      const inventory = [{ path: '/wallet' }, { path: '/debug' }, { path: '/dashboard' }];
      expect(flattenNavigation(filterPublicNavigation(inventory, true))).toEqual(['/dashboard']);
      expect(flattenNavigation(filterPublicNavigation(inventory, true, true))).toEqual([
        '/wallet',
        '/dashboard',
      ]);
    });
  });

  it('recursively filters nested navigation items', () => {
    const navigationInventory = [
      { path: '/dashboard' },
      { path: '/terms' },
      {
        path: '/wallet',
        submenu: [{ path: '/wallet' }, { path: '/wallet/onboarding' }],
        children: [{ path: '/wallet/abc' }],
      },
      { path: '/earnings', children: [{ path: '/earnings/advanced' }] },
    ];

    const visible = flattenNavigation(
      filterPublicNavigation(navigationInventory, isFullStudioEnabled(undefined)),
    );

    expect(visible).toEqual(expect.arrayContaining(['/terms']));
    expect(visible).toEqual(expect.not.arrayContaining(['/dashboard', '/earnings', '/wallet/onboarding', '/wallet/abc']));
  });

  it('keeps route-policy alias parity between public helpers', () => {
    const inventory = [
      { path: '/wallet' },
      { path: '/dashboard' },
      { path: '/security' },
    ];

    expect(filterPublicRouteNavigation(inventory, false)).toEqual(
      filterPublicNavigation(inventory, false),
    );
  });

  it('keeps shared policy references in shell owners', () => {
    const owners = {
      'src/App.jsx': [
        'filterPublicRouteNodes',
        'VITE_ENABLE_FULL_STUDIO',
        'VITE_ENABLE_OPERATOR_PREVIEW',
        'operator-preview-banner',
      ],
      'src/routes/publicRouteFilter.js': ['isPublicTestnetPath'],
      'src/components/Navigation/StartMenu.jsx': [
        'filterPublicSurfaces',
        'isFullStudioEnabled',
        'VITE_ENABLE_OPERATOR_PREVIEW',
      ],
      'src/hooks/usePageNavigation.js': [
        'filterPublicNavigation',
        'VITE_ENABLE_OPERATOR_PREVIEW',
      ],
      'src/components/wallet/v2/QuickActionsPanel.jsx': [
        'filterPublicSurfaces',
        'isFullStudioEnabled',
      ],
      'src/components/AccessibilityHub/KeyboardShortcutsOverlay.tsx': [
        'filterPublicSurfaces',
        'isFullStudioEnabled',
      ],
      'src/components/Mobile/MobileNavigation.tsx': [
        'filterPublicSurfaces',
        'isFullStudioEnabled',
      ],
      'src/components/Mobile/MobileApp.tsx': [
        'isPublicTestnetPath',
        'isFullStudioEnabled',
        'VITE_ENABLE_OPERATOR_PREVIEW',
      ],
      'src/components/Sidebar/ExpandableSidebar.jsx': [
        'filterPublicSurfaces',
        'isFullStudioEnabled',
        'VITE_ENABLE_OPERATOR_PREVIEW',
      ],
    };

    for (const [owner, requiredSignals] of Object.entries(owners)) {
      const source = readFileSync(owner, 'utf8');
      for (const signal of requiredSignals) {
        expect(source).toContain(signal);
      }
    }
  });

  it('excludes contract-surface routes from static inventory filtering', () => {
    const inventory = [
      { path: '/dashboard' },
      { path: '/bridge' },
      { path: '/smart-contracts', submenu: [{ path: '/smart-contract-graph' }] },
      { path: '/trading', children: [{ path: '/bridge' }] },
      { path: '/defi' },
      { path: '/settings' },
    ];

    const visible = flattenNavigation(
      filterContractSurfaceNavigation(
        inventory,
        isContractSurfacesEnabled(undefined),
      ),
    );

    expect(visible).toEqual(expect.arrayContaining(['/dashboard', '/settings']));
    expect(visible.some(isContractSurfacePath)).toBe(false);
  });
});

describe('navigation containment', () => {
  const navigationInventory = [
    { path: '/dashboard' },
    { path: '/bridge' },
    {
      path: '/smart-contracts',
      submenu: [{ path: '/smart-contract-graph' }],
    },
    { path: '/carbon/reporting' },
    { path: '/defi' },
    { path: '/staking/liquid' },
    { path: '/trading' },
    { path: '/settings' },
  ];

  it.each([undefined, '', 'false', 'TRUE', ' true', 'true '])(
    'removes contract links when raw contract flag is %p',
    rawValue => {
      const visible = flattenNavigation(
        filterContractSurfaceNavigation(
          navigationInventory,
          isContractSurfacesEnabled(rawValue),
        ),
      );

      expect(visible).toEqual(expect.arrayContaining(['/dashboard', '/settings']));
      expect(visible.some(isContractSurfacePath)).toBe(false);
    },
  );

  it('retains contract links for the exact string true', () => {
    const visible = flattenNavigation(
      filterContractSurfaceNavigation(
        navigationInventory,
        isContractSurfacesEnabled('true'),
      ),
    );

    expect(visible).toEqual(
      expect.arrayContaining([
        '/bridge',
        '/smart-contracts',
        '/smart-contract-graph',
        '/carbon/reporting',
        '/defi',
        '/staking/liquid',
        '/trading',
      ]),
    );
  });
});

export {};
