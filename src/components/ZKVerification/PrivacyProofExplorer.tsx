import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PeopleIcon from '@mui/icons-material/People';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { colors, spacing, borderRadius, shadows } from '../ui/tokens';
import WrfCard from '../ui/WrfCard';
import WrfStatCard from '../ui/WrfStatCard';
import WrfButton from '../ui/WrfButton';
import WrfBadge from '../ui/WrfBadge';
import WrfDataTable from '../ui/WrfDataTable';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
);

// ---- Mock Data ----

interface ProofRecord {
  id: string;
  proofId: string;
  type: 'Groth16' | 'PLONK' | 'STARK';
  status: 'verified' | 'failed' | 'pending';
  verifierContract: string;
  block: number;
  timestamp: string;
  gasUsed: number;
  prover: string;
  publicInputs: { label: string; value: string }[];
  verificationKeyHash: string;
}

// MOCK_PROOFS removed — data fetched from API via useEffect above

const _PROOFS_ANCHOR_ID1: ProofRecord[] = [
  {
    id: '1',
    proofId: '0x7a3f...e21d',
    type: 'Groth16',
    status: 'verified',
    verifierContract: '0xVrf1...A34b',
    block: 18_294_771,
    timestamp: '2026-02-14 10:23',
    gasUsed: 234_000,
    prover: '0x1a2B...9cD4',
    publicInputs: [
      { label: 'Merkle Root', value: '0x2f8b1c...a43e' },
      { label: 'Nullifier Hash', value: '0x91d4e7...6b2c' },
      { label: 'Commitment', value: '0x5c3a80...f194' },
    ],
    verificationKeyHash: '0xabc123...def456',
  },
  {
    id: '2',
    proofId: '0x4e8c...b47e',
    type: 'PLONK',
    status: 'verified',
    verifierContract: '0xVrf2...B56c',
    block: 18_294_756,
    timestamp: '2026-02-14 09:58',
    gasUsed: 312_000,
    prover: '0x5eF6...7aB8',
    publicInputs: [
      { label: 'Merkle Root', value: '0x4d7e12...b89f' },
      { label: 'Nullifier Hash', value: '0xa3f2c8...1e74' },
    ],
    verificationKeyHash: '0x789abc...123def',
  },
  {
    id: '3',
    proofId: '0x1b5d...f83c',
    type: 'STARK',
    status: 'failed',
    verifierContract: '0xVrf3...C78d',
    block: 18_294_739,
    timestamp: '2026-02-14 09:31',
    gasUsed: 0,
    prover: '0x9cD2...3eF1',
    publicInputs: [
      { label: 'Merkle Root', value: '0x7a91f3...d456' },
      { label: 'Commitment', value: '0x0e8b27...a903' },
    ],
    verificationKeyHash: '0x456def...789abc',
  },
  {
    id: '4',
    proofId: '0x9d2a...a29d',
    type: 'Groth16',
    status: 'verified',
    verifierContract: '0xVrf1...A34b',
    block: 18_294_712,
    timestamp: '2026-02-14 08:42',
    gasUsed: 228_500,
    prover: '0x3bA1...8dC5',
    publicInputs: [
      { label: 'Merkle Root', value: '0x6f2e48...c173' },
      { label: 'Nullifier Hash', value: '0xb5a917...2d86' },
      { label: 'Commitment', value: '0x3c7f09...e541' },
    ],
    verificationKeyHash: '0xdef789...abc456',
  },
  {
    id: '5',
    proofId: '0x6c4b...d18f',
    type: 'PLONK',
    status: 'pending',
    verifierContract: '0xVrf2...B56c',
    block: 18_294_698,
    timestamp: '2026-02-14 08:15',
    gasUsed: 0,
    prover: '0x7dE3...2fA6',
    publicInputs: [
      { label: 'Merkle Root', value: '0xc4a821...e567' },
      { label: 'Commitment', value: '0x1f9d34...b782' },
    ],
    verificationKeyHash: '0x123abc...456def',
  },
  {
    id: '6',
    proofId: '0x3f7e...c92a',
    type: 'STARK',
    status: 'verified',
    verifierContract: '0xVrf3...C78d',
    block: 18_294_681,
    timestamp: '2026-02-14 07:54',
    gasUsed: 478_000,
    prover: '0x4aB7...1cD9',
    publicInputs: [
      { label: 'Merkle Root', value: '0x8e5b31...f294' },
      { label: 'Nullifier Hash', value: '0xd2c7a6...3e15' },
      { label: 'Commitment', value: '0x7f1e09...a847' },
    ],
    verificationKeyHash: '0x654fed...cba321',
  },
  {
    id: '7',
    proofId: '0x8a1d...e54b',
    type: 'Groth16',
    status: 'verified',
    verifierContract: '0xVrf1...A34b',
    block: 18_294_665,
    timestamp: '2026-02-14 07:22',
    gasUsed: 241_200,
    prover: '0x2cE8...5bA3',
    publicInputs: [
      { label: 'Merkle Root', value: '0xa7d4f2...b916' },
      { label: 'Commitment', value: '0xe3b891...c472' },
    ],
    verificationKeyHash: '0x321cba...fed654',
  },
  {
    id: '8',
    proofId: '0x5e9c...a73f',
    type: 'PLONK',
    status: 'verified',
    verifierContract: '0xVrf2...B56c',
    block: 18_294_648,
    timestamp: '2026-02-14 06:59',
    gasUsed: 305_800,
    prover: '0x6fD4...9eB2',
    publicInputs: [
      { label: 'Merkle Root', value: '0x3c8e17...d593' },
      { label: 'Nullifier Hash', value: '0x9a2f56...1c84' },
    ],
    verificationKeyHash: '0x987654...abcdef',
  },
];

const PROOF_TYPE_COMPARISON = [
  {
    type: 'Groth16',
    provingTime: '~30s',
    verificationTime: '~10ms',
    proofSize: '192 bytes',
    securityLevel: '128-bit',
    useCase: 'Token transfers, identity',
  },
  {
    type: 'PLONK',
    provingTime: '~45s',
    verificationTime: '~15ms',
    proofSize: '512 bytes',
    securityLevel: '128-bit',
    useCase: 'Universal circuits, DeFi',
  },
  {
    type: 'STARK',
    provingTime: '~60s',
    verificationTime: '~50ms',
    proofSize: '~45 KB',
    securityLevel: '128-bit (post-quantum)',
    useCase: 'Scalability, rollups',
  },
];

const VOLUME_DATA = { labels: [] as string[], groth16: [] as number[], plonk: [] as number[], stark: [] as number[] };

// ---- Merkle Tree SVG Visualization ----

interface TreeNode {
  id: string;
  level: number;
  index: number;
  label: string;
  type: 'root' | 'internal' | 'leaf';
}

const buildMerkleTree = (): { nodes: TreeNode[]; edges: [string, string][] } => {
  const nodes: TreeNode[] = [];
  const edges: [string, string][] = [];

  // Level 0 (root)
  nodes.push({ id: 'n0-0', level: 0, index: 0, label: 'Root', type: 'root' });

  // Level 1
  nodes.push({ id: 'n1-0', level: 1, index: 0, label: 'H01', type: 'internal' });
  nodes.push({ id: 'n1-1', level: 1, index: 1, label: 'H23', type: 'internal' });
  edges.push(['n0-0', 'n1-0'], ['n0-0', 'n1-1']);

  // Level 2
  nodes.push({ id: 'n2-0', level: 2, index: 0, label: 'H0', type: 'internal' });
  nodes.push({ id: 'n2-1', level: 2, index: 1, label: 'H1', type: 'internal' });
  nodes.push({ id: 'n2-2', level: 2, index: 2, label: 'H2', type: 'internal' });
  nodes.push({ id: 'n2-3', level: 2, index: 3, label: 'H3', type: 'internal' });
  edges.push(['n1-0', 'n2-0'], ['n1-0', 'n2-1']);
  edges.push(['n1-1', 'n2-2'], ['n1-1', 'n2-3']);

  // Level 3 (leaves)
  const leafLabels = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
  for (let i = 0; i < 8; i++) {
    nodes.push({
      id: `n3-${i}`,
      level: 3,
      index: i,
      label: leafLabels[i],
      type: 'leaf',
    });
    edges.push([`n2-${Math.floor(i / 2)}`, `n3-${i}`]);
  }

  return { nodes, edges };
};

const MERKLE_TREE = buildMerkleTree();

const nodeTypeColors: Record<string, string> = {
  root: '#EF4444',
  internal: '#3B82F6',
  leaf: '#10B981',
};

const MerkleTreeVisualization: React.FC = () => {
  const width = 560;
  const height = 260;
  const levelHeight = 60;
  const topPadding = 25;

  const getNodePosition = (node: TreeNode): { x: number; y: number } => {
    const y = topPadding + node.level * levelHeight;
    const nodesAtLevel =
      node.level === 0
        ? 1
        : node.level === 1
          ? 2
          : node.level === 2
            ? 4
            : 8;
    const sectionWidth = width / nodesAtLevel;
    const x = sectionWidth * node.index + sectionWidth / 2;
    return { x, y };
  };

  const nodePositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    MERKLE_TREE.nodes.forEach((n) => {
      map[n.id] = getNodePosition(n);
    });
    return map;
  }, []);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="auto"
      style={{ display: 'block', maxHeight: 260 }}
    >
      <defs>
        <filter id="tree-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      {MERKLE_TREE.edges.map(([parentId, childId]) => {
        const parent = nodePositions[parentId];
        const child = nodePositions[childId];
        if (!parent || !child) return null;
        return (
          <line
            key={`${parentId}-${childId}`}
            x1={parent.x}
            y1={parent.y + 14}
            x2={child.x}
            y2={child.y - 14}
            stroke={colors.border.light}
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
        );
      })}

      {/* Nodes */}
      {MERKLE_TREE.nodes.map((node) => {
        const pos = nodePositions[node.id];
        const fill = nodeTypeColors[node.type];
        const radius = node.type === 'root' ? 18 : node.type === 'internal' ? 15 : 12;

        return (
          <g key={node.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill={fill}
              fillOpacity={0.15}
              stroke={fill}
              strokeWidth={2}
              filter="url(#tree-glow)"
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fill={fill}
              fontSize={node.type === 'leaf' ? 8 : 9}
              fontWeight="600"
              fontFamily="monospace"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---- Main Component ----

const PrivacyProofExplorerSample: React.FC = () => {
  const [proofs, setProofs] = useState<ProofRecord[]>([]);
  const [proofsLoading, setProofsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ProofRecord | null>(null);

  useEffect(() => {
    const fetchProofs = async () => {
      setProofsLoading(true);
      try {
        // TODO: confirm endpoint path with backend team
        const res = await fetch('/api/zk/proofs?limit=50', { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`ZK proofs fetch failed: ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.data ?? data.proofs ?? []);
        const mapped: ProofRecord[] = rows.map((p: any) => ({
          id: String(p.id ?? p.proofId ?? p.proof_id ?? ''),
          proofId: String(p.proofId ?? p.proof_id ?? p.id ?? ''),
          type: p.type ?? p.proofType ?? 'Groth16',
          status: p.status ?? 'pending',
          verifierContract: p.verifierContract ?? p.verifier_contract ?? '',
          block: Number(p.block ?? p.blockNumber ?? p.block_number ?? 0),
          timestamp: p.timestamp ?? p.createdAt ?? '',
          gasUsed: Number(p.gasUsed ?? p.gas_used ?? p.gasCost ?? 0),
          prover: p.prover ?? p.proverAddress ?? '',
          publicInputs: Array.isArray(p.publicInputs ?? p.public_inputs) ? (p.publicInputs ?? p.public_inputs) : [],
          verificationKeyHash: p.verificationKeyHash ?? p.verification_key_hash ?? '',
        }));
        if (mapped.length > 0) {
          setProofs(mapped);
          setSelectedProof(mapped[0]);
        }
      } catch {
        // API unavailable — leave proofs as empty
      } finally {
        setProofsLoading(false);
      }
    };
    fetchProofs();
  }, []);

  // Selective disclosure live API state
  const [disclosureProving, setDisclosureProving] = useState(false);
  const [disclosureResult, setDisclosureResult] = useState<{ proof: string; valid: boolean } | null>(null);
  const [disclosureError, setDisclosureError] = useState<string | null>(null);

  // Reset disclosure state when proof selection changes
  useEffect(() => {
    setDisclosureResult(null);
    setDisclosureError(null);
  }, [selectedProof]);

  const handleGenerateSelectiveDisclosure = useCallback(async () => {
    if (!selectedProof || disclosureProving) return;
    setDisclosureProving(true);
    setDisclosureResult(null);
    setDisclosureError(null);
    try {
      // Generate selective disclosure proof for the selected proof's public inputs
      const disclosedIndices = selectedProof.publicInputs
        .map((_, idx) => idx)
        .slice(0, Math.max(1, selectedProof.publicInputs.length - 1));

      const genRes = await fetch('/api/zk/selective-disclosure/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof_id: selectedProof.proofId,
          public_inputs: selectedProof.publicInputs.map((p) => p.value),
          disclosed_indices: disclosedIndices,
        }),
      });
      if (!genRes.ok) throw new Error(`Generate failed: ${genRes.status}`);
      const { proof } = await genRes.json();

      const verRes = await fetch('/api/zk/selective-disclosure/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof, disclosed_indices: disclosedIndices }),
      });
      if (!verRes.ok) throw new Error(`Verify failed: ${verRes.status}`);
      const { valid } = await verRes.json();
      setDisclosureResult({ proof, valid });
    } catch (err: any) {
      setDisclosureError(err.message);
    } finally {
      setDisclosureProving(false);
    }
  }, [selectedProof, disclosureProving]);

  const handleRowClick = useCallback((row: ProofRecord) => {
    setSelectedProof(row);
  }, []);

  // Data table columns
  const tableColumns = useMemo(
    () => [
      {
        key: 'proofId',
        label: 'Proof ID',
        sortable: true,
        render: (val: string) => (
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: colors.brand.primary,
            }}
          >
            {val}
          </Typography>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        render: (val: string) => {
          const typeColor =
            val === 'Groth16'
              ? colors.brand.primary
              : val === 'PLONK'
                ? colors.success.main
                : colors.warning.main;
          return (
            <Chip
              label={val}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.675rem',
                fontWeight: 600,
                bgcolor: `${typeColor}20`,
                color: typeColor,
              }}
            />
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (val: string) => {
          const badgeStatus =
            val === 'verified'
              ? 'online'
              : val === 'pending'
                ? 'pending'
                : 'offline';
          const badgeLabel =
            val === 'verified'
              ? 'Verified'
              : val === 'pending'
                ? 'Pending'
                : 'Failed';
          return <WrfBadge status={badgeStatus} label={badgeLabel} size="sm" />;
        },
      },
      {
        key: 'verifierContract',
        label: 'Verifier',
        sortable: false,
        render: (val: string) => (
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: colors.text.secondary,
            }}
          >
            {val}
          </Typography>
        ),
      },
      {
        key: 'block',
        label: 'Block',
        sortable: true,
        render: (val: number) => (
          <Typography sx={{ fontSize: '0.8rem', color: colors.text.primary }}>
            #{val.toLocaleString()}
          </Typography>
        ),
      },
      {
        key: 'timestamp',
        label: 'Timestamp',
        sortable: true,
      },
      {
        key: 'gasUsed',
        label: 'Gas Used',
        sortable: true,
        render: (val: number) => (
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: val > 0 ? colors.text.primary : colors.text.muted,
            }}
          >
            {val > 0 ? val.toLocaleString() : '--'}
          </Typography>
        ),
      },
    ],
    [],
  );

  // Chart data: proof type distribution
  const doughnutData = useMemo(() => {
    const counts = { Groth16: 0, PLONK: 0, STARK: 0 };
    proofs.forEach((p) => {
      counts[p.type] += 1;
    });
    return {
      labels: ['Groth16', 'PLONK', 'STARK'],
      datasets: [
        {
          data: [counts.Groth16, counts.PLONK, counts.STARK],
          backgroundColor: [
            `${colors.brand.primary}CC`,
            `${colors.success.main}CC`,
            `${colors.warning.main}CC`,
          ],
          borderColor: [colors.brand.primary, colors.success.main, colors.warning.main],
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [proofs]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: colors.text.secondary,
            font: { size: 11 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: colors.bg.secondary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
        },
      },
    }),
    [],
  );

  // Chart data: proof volume over time
  const lineData = useMemo(
    () => ({
      labels: VOLUME_DATA.labels,
      datasets: [
        {
          label: 'Groth16',
          data: VOLUME_DATA.groth16,
          borderColor: colors.brand.primary,
          backgroundColor: `${colors.brand.primary}15`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
        {
          label: 'PLONK',
          data: VOLUME_DATA.plonk,
          borderColor: colors.success.main,
          backgroundColor: `${colors.success.main}15`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
        {
          label: 'STARK',
          data: VOLUME_DATA.stark,
          borderColor: colors.warning.main,
          backgroundColor: `${colors.warning.main}15`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    }),
    [],
  );

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: colors.text.secondary,
            font: { size: 11 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: colors.bg.secondary,
          titleColor: colors.text.primary,
          bodyColor: colors.text.secondary,
          borderColor: colors.border.default,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { color: `${colors.border.default}40`, drawBorder: false },
          ticks: {
            color: colors.text.muted,
            font: { size: 10 },
            maxRotation: 45,
            maxTicksLimit: 10,
          },
        },
        y: {
          grid: { color: `${colors.border.default}40`, drawBorder: false },
          ticks: { color: colors.text.muted, font: { size: 10 } },
          beginAtZero: true,
        },
      },
    }),
    [],
  );

  // Comparison table cell style
  const compCellSx = {
    color: colors.text.primary,
    borderBottom: `1px solid ${colors.border.default}`,
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: '0.8rem',
  };

  const compHeaderSx = {
    ...compCellSx,
    color: colors.text.secondary,
    fontWeight: 600,
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    backgroundColor: colors.bg.primary,
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.bg.primary,
        color: colors.text.primary,
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{ fontSize: '2rem', fontWeight: 700, color: colors.text.primary, mb: 0.5 }}
        >
          Privacy Proof Explorer
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          Browse and analyze zero-knowledge proofs across the WRFCoin network
        </Typography>
      </Box>

      {/* Privacy Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Private Transactions"
            value="42,891"
            trend={8.7}
            trendLabel="vs last week"
            icon={SecurityIcon}
            color={colors.success.main}
            sparklineData={[35200, 36800, 38100, 39500, 40200, 41600, 42891]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Shielded Value"
            value="$12.4M"
            trend={15.3}
            trendLabel="growth"
            icon={AccountBalanceWalletIcon}
            color={colors.brand.primary}
            sparklineData={[8.1, 9.2, 9.8, 10.5, 11.1, 11.8, 12.4]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Unique Provers"
            value="1,847"
            trend={4.2}
            trendLabel="new this month"
            icon={PeopleIcon}
            color={colors.warning.main}
            sparklineData={[1520, 1590, 1640, 1710, 1750, 1800, 1847]}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <WrfStatCard
            label="Verification Gas Saved"
            value="847M"
            trend={22.1}
            trendLabel="efficiency gain"
            icon={LocalGasStationIcon}
            color="#8B5CF6"
            sparklineData={[580, 620, 680, 720, 770, 810, 847]}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Proof Type Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <WrfCard title="Proof Type Distribution" sx={{ height: '100%' }}>
            <Box sx={{ height: 240, position: 'relative' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </Box>
          </WrfCard>
        </Grid>

        {/* Proof Volume Over Time */}
        <Grid size={{ xs: 12, md: 8 }}>
          <WrfCard title="Proof Volume (30 Days)" sx={{ height: '100%' }}>
            <Box sx={{ height: 240, position: 'relative' }}>
              <Line data={lineData} options={lineOptions} />
            </Box>
          </WrfCard>
        </Grid>
      </Grid>

      {/* Proofs Table & Detail Panel */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Proofs Data Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <WrfCard title="Recent Proofs" subtitle="Click a row to view proof details">
            <WrfDataTable
              columns={tableColumns}
              data={proofs}
              searchable
              exportable
              pagination
              pageSize={6}
              onRowClick={handleRowClick}
              sx={{
                border: 'none',
                backgroundColor: 'transparent',
              }}
            />
          </WrfCard>
        </Grid>

        {/* Selected Proof Detail */}
        <Grid size={{ xs: 12, md: 4 }}>
          {selectedProof ? (
            <Box>
              <WrfCard title="Proof Detail" sx={{ mb: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: colors.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 0.5,
                    }}
                  >
                    Proof ID
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      color: colors.brand.primary,
                      fontWeight: 600,
                    }}
                  >
                    {selectedProof.proofId}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip
                    label={selectedProof.type}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      bgcolor:
                        selectedProof.type === 'Groth16'
                          ? `${colors.brand.primary}20`
                          : selectedProof.type === 'PLONK'
                            ? `${colors.success.main}20`
                            : `${colors.warning.main}20`,
                      color:
                        selectedProof.type === 'Groth16'
                          ? colors.brand.primary
                          : selectedProof.type === 'PLONK'
                            ? colors.success.main
                            : colors.warning.main,
                    }}
                  />
                  <WrfBadge
                    status={
                      selectedProof.status === 'verified'
                        ? 'online'
                        : selectedProof.status === 'pending'
                          ? 'pending'
                          : 'offline'
                    }
                    label={
                      selectedProof.status.charAt(0).toUpperCase() +
                      selectedProof.status.slice(1)
                    }
                    size="sm"
                  />
                </Box>

                {/* Metadata rows */}
                {[
                  { label: 'Prover', value: selectedProof.prover },
                  { label: 'Block', value: `#${selectedProof.block.toLocaleString()}` },
                  { label: 'Timestamp', value: selectedProof.timestamp },
                  {
                    label: 'Gas Used',
                    value:
                      selectedProof.gasUsed > 0
                        ? selectedProof.gasUsed.toLocaleString()
                        : '--',
                  },
                  { label: 'Verifier', value: selectedProof.verifierContract },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.75,
                      borderBottom:
                        idx < 4
                          ? `1px solid ${colors.border.default}`
                          : 'none',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: colors.text.muted,
                        fontWeight: 500,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.text.primary,
                        fontFamily: 'monospace',
                        maxWidth: 130,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}

                {/* Verification Key Hash */}
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${colors.border.default}` }}>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: colors.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 0.5,
                    }}
                  >
                    Verification Key Hash
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: colors.text.secondary,
                      wordBreak: 'break-all',
                    }}
                  >
                    {selectedProof.verificationKeyHash}
                  </Typography>
                </Box>

                {/* Public Inputs */}
                <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${colors.border.default}` }}>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      color: colors.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 1,
                    }}
                  >
                    Public Inputs
                  </Typography>
                  {selectedProof.publicInputs.map((input, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          color: colors.text.secondary,
                        }}
                      >
                        {input.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          fontFamily: 'monospace',
                          color: colors.brand.primary,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {input.value}
                      </Typography>
                    </Box>
                  ))}

                  {/* Live selective disclosure generate + verify */}
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${colors.border.default}` }}>
                    <WrfButton
                      variant="primary"
                      size="sm"
                      loading={disclosureProving}
                      disabled={disclosureProving}
                      onClick={handleGenerateSelectiveDisclosure}
                    >
                      {disclosureProving ? 'Generating...' : 'Generate Selective Disclosure'}
                    </WrfButton>
                    {disclosureResult && (
                      <Typography sx={{ mt: 1, fontSize: '0.7rem', fontFamily: 'monospace', color: disclosureResult.valid ? colors.success.main : '#ef4444' }}>
                        {disclosureResult.valid ? 'Valid' : 'Invalid'} — proof: 0x{disclosureResult.proof.slice(0, 16)}...
                      </Typography>
                    )}
                    {disclosureError && (
                      <Typography sx={{ mt: 1, fontSize: '0.7rem', fontFamily: 'monospace', color: '#ef4444' }}>
                        Error: {disclosureError}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </WrfCard>

              {/* Merkle Tree Visualization */}
              <WrfCard title="Merkle Tree">
                <Typography sx={{ fontSize: '0.7rem', color: colors.text.muted, mb: 1.5 }}>
                  4-level binary hash tree for proof membership verification
                </Typography>
                <Box
                  sx={{
                    bgcolor: colors.bg.primary,
                    borderRadius: `${borderRadius.md}px`,
                    border: `1px solid ${colors.border.default}`,
                    p: 1.5,
                  }}
                >
                  <MerkleTreeVisualization />
                </Box>
                {/* Node legend */}
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                  {Object.entries(nodeTypeColors).map(([type, color]) => (
                    <Box
                      key={type}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: color,
                          opacity: 0.7,
                        }}
                      />
                      <Typography
                        sx={{ fontSize: '0.675rem', color: colors.text.muted }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </WrfCard>
            </Box>
          ) : (
            <WrfCard>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ color: colors.text.muted, fontSize: '0.875rem' }}>
                  Select a proof from the table to view details
                </Typography>
              </Box>
            </WrfCard>
          )}
        </Grid>
      </Grid>

      {/* Proof Type Comparison Table */}
      <WrfCard title="Proof System Comparison" subtitle="Performance characteristics by proof type">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={compHeaderSx}>Type</TableCell>
                <TableCell sx={compHeaderSx}>Proving Time</TableCell>
                <TableCell sx={compHeaderSx}>Verification Time</TableCell>
                <TableCell sx={compHeaderSx}>Proof Size</TableCell>
                <TableCell sx={compHeaderSx}>Security Level</TableCell>
                <TableCell sx={compHeaderSx}>Primary Use Case</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {PROOF_TYPE_COMPARISON.map((row) => {
                const typeColor =
                  row.type === 'Groth16'
                    ? colors.brand.primary
                    : row.type === 'PLONK'
                      ? colors.success.main
                      : colors.warning.main;
                return (
                  <TableRow
                    key={row.type}
                    sx={{
                      '&:last-child td': { borderBottom: 'none' },
                      '&:hover': { bgcolor: `${colors.bg.tertiary}30` },
                    }}
                  >
                    <TableCell sx={compCellSx}>
                      <Chip
                        label={row.type}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: `${typeColor}20`,
                          color: typeColor,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={compCellSx}>{row.provingTime}</TableCell>
                    <TableCell sx={compCellSx}>{row.verificationTime}</TableCell>
                    <TableCell sx={compCellSx}>{row.proofSize}</TableCell>
                    <TableCell sx={compCellSx}>
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          color:
                            row.type === 'STARK'
                              ? colors.success.main
                              : colors.text.primary,
                          fontWeight: row.type === 'STARK' ? 600 : 400,
                        }}
                      >
                        {row.securityLevel}
                      </Typography>
                    </TableCell>
                    <TableCell sx={compCellSx}>{row.useCase}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </WrfCard>
    </Box>
  );
};

const PrivacyProofExplorer: React.FC<React.ComponentProps<typeof PrivacyProofExplorerSample>> = (props) => (
  <DemoSurfaceGate
    testId="privacy-proofs"
    title="Privacy proof explorer is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <PrivacyProofExplorerSample {...props} />
  </DemoSurfaceGate>
);

export default PrivacyProofExplorer;
