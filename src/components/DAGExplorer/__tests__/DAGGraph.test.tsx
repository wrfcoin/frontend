import { jest } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import DAGGraph from '../DAGGraph';
import type { DAGBlock, DAGEdge } from '../DAGGraph';

// Deterministic fixture (frontend#324 deleted the component's exported
// Math.random() generator, which was only ever used here).
function makeBlock(height: number, index: number, status: DAGBlock['status']): DAGBlock {
  const id = `block-${height}-${index}`;
  return {
    id,
    height,
    hash: `0x${height.toString(16).padStart(4, '0')}${index}...`,
    parentHashes: [],
    proposer: 'wrfval1test...0001',
    txCount: 10 + index,
    timestamp: 1_700_000_000_000 + height * 12_000,
    status,
    gasUsed: 15_000_000,
    gasLimit: 30_000_000,
    size: 40_000,
    reward: 2,
    attestationCount: 60,
    stateRoot: '0xstate...',
    receiptRoot: '0xreceipt...',
  };
}
const blocks: DAGBlock[] = [
  makeBlock(100, 0, 'finalized'),
  makeBlock(101, 0, 'finalized'),
  makeBlock(101, 1, 'orphaned'),
  makeBlock(102, 0, 'confirmed'),
  makeBlock(103, 0, 'pending'),
];
const edges: DAGEdge[] = [
  { source: 'block-100-0', target: 'block-101-0' },
  { source: 'block-100-0', target: 'block-101-1' },
  { source: 'block-101-0', target: 'block-102-0' },
  { source: 'block-102-0', target: 'block-103-0' },
];

describe('DAGGraph (Vertical Layout)', () => {
  it('renders without crashing and mounts SVG', () => {
    const { container } = render(
      <DAGGraph
        blocks={blocks}
        edges={edges}
        selectedBlockId={null}
        onSelectBlock={jest.fn()}
        zoomLevel={1}
        onZoomChange={jest.fn()}
      />,
    );

    // The container should have native scrolling applied
    expect(container.firstChild).toHaveStyle('overflow: auto');

    // It should render an SVG element
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders blocks and edges correctly based on props', () => {
    const { container } = render(
      <DAGGraph
        blocks={blocks}
        edges={edges}
        selectedBlockId={null}
        onSelectBlock={jest.fn()}
        zoomLevel={1}
        onZoomChange={jest.fn()}
      />,
    );

    // Check if the svg has populated D3 elements after mount
    // Given D3 manipulation is synchronous after useEffect, we can check for groups.
    const blocksGroup = container.querySelector('g.blocks');
    const edgesGroup = container.querySelector('g.edges');

    expect(blocksGroup).toBeInTheDocument();
    expect(edgesGroup).toBeInTheDocument();
  });
});
