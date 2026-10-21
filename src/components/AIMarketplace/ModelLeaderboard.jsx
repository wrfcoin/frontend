import React, { useState, useMemo } from 'react';
import DemoSurfaceGate from '../common/DemoSurfaceGate';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Leaderboard as LeaderboardIcon,
  EmojiEvents,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  RocketLaunch,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend,
);

// ---------------------------------------------------------------------------
// Mock leaderboard data - 20 models
// ---------------------------------------------------------------------------

const LEADERBOARD_MODELS = [
  { id: 'lb1', name: 'WeatherFormer-XL', publisher: 'DeepClimate AI', rmse: 1.42, mae: 1.08, rSquared: 0.967, skillScore: 0.72, region: 'Global', predictionsDay: 185000, trend: 'up' },
  { id: 'lb2', name: 'NeuralWx-Pro v3', publisher: 'AtmoSphere Labs', rmse: 1.55, mae: 1.15, rSquared: 0.961, skillScore: 0.69, region: 'Americas', predictionsDay: 142000, trend: 'up' },
  { id: 'lb3', name: 'StormCast-7B', publisher: 'NOAA-ML Consortium', rmse: 1.61, mae: 1.22, rSquared: 0.958, skillScore: 0.67, region: 'Global', predictionsDay: 198000, trend: 'stable' },
  { id: 'lb4', name: 'ClimaFormer', publisher: 'ETH Zurich Climate', rmse: 1.68, mae: 1.25, rSquared: 0.955, skillScore: 0.65, region: 'Europe', predictionsDay: 89000, trend: 'up' },
  { id: 'lb5', name: 'TempNet-LSTM v4', publisher: 'WRFCoin Research', rmse: 1.74, mae: 1.31, rSquared: 0.951, skillScore: 0.63, region: 'Americas', predictionsDay: 121000, trend: 'down' },
  { id: 'lb6', name: 'MeteoTransformer', publisher: 'Google DeepMind Wx', rmse: 1.78, mae: 1.35, rSquared: 0.948, skillScore: 0.61, region: 'Global', predictionsDay: 256000, trend: 'up' },
  { id: 'lb7', name: 'PrecipNet-Ensemble', publisher: 'RainAI Systems', rmse: 1.82, mae: 1.38, rSquared: 0.945, skillScore: 0.59, region: 'Asia-Pacific', predictionsDay: 67000, trend: 'stable' },
  { id: 'lb8', name: 'WindSeer-GPT', publisher: 'AeroForecast Inc', rmse: 1.89, mae: 1.42, rSquared: 0.941, skillScore: 0.57, region: 'Europe', predictionsDay: 54000, trend: 'up' },
  { id: 'lb9', name: 'HyperLocal-wx', publisher: 'StreetLevel Weather', rmse: 1.93, mae: 1.46, rSquared: 0.938, skillScore: 0.55, region: 'Americas', predictionsDay: 78000, trend: 'down' },
  { id: 'lb10', name: 'ECMWF-Neural v2', publisher: 'ECMWF Open Lab', rmse: 1.97, mae: 1.49, rSquared: 0.935, skillScore: 0.53, region: 'Global', predictionsDay: 312000, trend: 'stable' },
  { id: 'lb11', name: 'ConvWx-UNet', publisher: 'UCAR ML Group', rmse: 2.01, mae: 1.53, rSquared: 0.932, skillScore: 0.51, region: 'Americas', predictionsDay: 45000, trend: 'up' },
  { id: 'lb12', name: 'ThunderNet-v5', publisher: 'StormTech Analytics', rmse: 2.08, mae: 1.58, rSquared: 0.928, skillScore: 0.49, region: 'Americas', predictionsDay: 38000, trend: 'stable' },
  { id: 'lb13', name: 'AirQual-Forecast', publisher: 'CleanAir ML', rmse: 2.14, mae: 1.62, rSquared: 0.924, skillScore: 0.47, region: 'Asia-Pacific', predictionsDay: 52000, trend: 'up' },
  { id: 'lb14', name: 'TropicalCyclone-AI', publisher: 'JTWC Research', rmse: 2.19, mae: 1.67, rSquared: 0.921, skillScore: 0.45, region: 'Asia-Pacific', predictionsDay: 23000, trend: 'stable' },
  { id: 'lb15', name: 'SnowPack-Predictor', publisher: 'Alpine Weather Co', rmse: 2.25, mae: 1.71, rSquared: 0.917, skillScore: 0.43, region: 'Europe', predictionsDay: 18000, trend: 'down' },
  { id: 'lb16', name: 'SolarRad-Forecast', publisher: 'SunWise Energy', rmse: 2.31, mae: 1.76, rSquared: 0.913, skillScore: 0.41, region: 'Global', predictionsDay: 89000, trend: 'up' },
  { id: 'lb17', name: 'MarineForecast-3B', publisher: 'OceanWeather AI', rmse: 2.38, mae: 1.82, rSquared: 0.908, skillScore: 0.39, region: 'Global', predictionsDay: 34000, trend: 'stable' },
  { id: 'lb18', name: 'AgriWx-Seasonal', publisher: 'FarmCast Analytics', rmse: 2.45, mae: 1.88, rSquared: 0.903, skillScore: 0.37, region: 'Americas', predictionsDay: 28000, trend: 'down' },
  { id: 'lb19', name: 'UrbanHeat-Model', publisher: 'CityClimate Lab', rmse: 2.52, mae: 1.93, rSquared: 0.898, skillScore: 0.35, region: 'Europe', predictionsDay: 21000, trend: 'stable' },
  { id: 'lb20', name: 'BasicWx-Regressor', publisher: 'OpenWeather ML', rmse: 2.78, mae: 2.12, rSquared: 0.882, skillScore: 0.28, region: 'Global', predictionsDay: 156000, trend: 'down' },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const formatNum = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
};

const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ModelLeaderboardSample = ({ onSelectModel, onChallenge }) => {
  const [paramFilter, setParamFilter] = useState('Temperature');
  const [horizonFilter, setHorizonFilter] = useState('24hr');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortField, setSortField] = useState('rmse');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'rSquared' || field === 'skillScore' ? 'desc' : 'asc');
    }
  };

  const filteredModels = useMemo(() => {
    let list = [...LEADERBOARD_MODELS];
    if (regionFilter !== 'All') {
      list = list.filter((m) => m.region === regionFilter);
    }
    list.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return 0;
    });
    return list;
  }, [regionFilter, sortField, sortDir]);

  // Top 5 performance over time chart
  const performanceOverTime = useMemo(() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
    const top5 = LEADERBOARD_MODELS.slice(0, 5);

    return {
      labels: months,
      datasets: top5.map((model, i) => {
        const baseRmse = model.rmse;
        const data = months.map((_, mi) => {
          const improvement = (months.length - 1 - mi) * 0.04 + Math.random() * 0.08;
          return parseFloat((baseRmse + improvement).toFixed(3));
        });
        return {
          label: model.name,
          data,
          borderColor: colors[i],
          backgroundColor: `${colors[i]}22`,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        };
      }),
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94A3B8', font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: '#1E293B' },
      },
      y: {
        reverse: true,
        title: { display: true, text: 'RMSE (lower is better)', color: '#64748B', font: { size: 10 } },
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: '#1E293B' },
      },
    },
  };

  const panelSx = {
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: 2,
    p: 2.5,
  };

  const selectSx = {
    color: '#F1F5F9',
    '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3B82F6' },
    '.MuiSvgIcon-root': { color: '#64748B' },
    fontSize: '0.85rem',
    height: 40,
  };

  const SortHeader = ({ field, label }) => {
    const isActive = sortField === field;
    return (
      <TableCell
        sx={{
          color: isActive ? '#3B82F6' : '#64748B',
          borderColor: '#334155',
          fontWeight: 600,
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          '&:hover': { color: '#3B82F6' },
        }}
        onClick={() => handleSort(field)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {label}
          {isActive && (
            sortDir === 'asc' ? (
              <ArrowUpward sx={{ fontSize: 14 }} />
            ) : (
              <ArrowDownward sx={{ fontSize: 14 }} />
            )
          )}
        </Box>
      </TableCell>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <LeaderboardIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700 }}>
          Model Leaderboard
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ ...panelSx, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
              Parameter
            </Typography>
            <Select
              value={paramFilter}
              onChange={(e) => setParamFilter(e.target.value)}
              size="small"
              sx={selectSx}
            >
              {['Temperature', 'Precipitation', 'Wind Speed', 'Humidity', 'Pressure', 'Solar Radiation'].map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
              Forecast Horizon
            </Typography>
            <Select
              value={horizonFilter}
              onChange={(e) => setHorizonFilter(e.target.value)}
              size="small"
              sx={selectSx}
            >
              {['1hr', '6hr', '24hr', '7day'].map((h) => (
                <MenuItem key={h} value={h}>{h}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.5 }}>
              Region
            </Typography>
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              size="small"
              sx={selectSx}
            >
              {['All', 'Global', 'Americas', 'Europe', 'Asia-Pacific'].map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<RocketLaunch />}
            onClick={() => onChallenge && onChallenge()}
            sx={{
              borderColor: '#F59E0B',
              color: '#F59E0B',
              textTransform: 'none',
              fontWeight: 600,
              alignSelf: 'flex-end',
              '&:hover': { borderColor: '#F59E0B', backgroundColor: '#F59E0B11' },
            }}
          >
            Challenge the Leaderboard
          </Button>
        </Box>
      </Paper>

      {/* Leaderboard table */}
      <Paper sx={{ ...panelSx, mb: 3, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600, width: 60 }}>
                Rank
              </TableCell>
              <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600, minWidth: 200 }}>
                Model
              </TableCell>
              <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                Publisher
              </TableCell>
              <SortHeader field="rmse" label="RMSE" />
              <SortHeader field="mae" label="MAE" />
              <SortHeader field="rSquared" label="R-Squared" />
              <SortHeader field="skillScore" label="Skill Score" />
              <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600 }}>
                Region
              </TableCell>
              <SortHeader field="predictionsDay" label="Pred/day" />
              <TableCell sx={{ color: '#64748B', borderColor: '#334155', fontWeight: 600, width: 50 }}>
                Trend
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredModels.map((model, idx) => {
              const originalRank = LEADERBOARD_MODELS.findIndex((m) => m.id === model.id) + 1;
              const isTop3 = originalRank <= 3;

              return (
                <TableRow
                  key={model.id}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: isTop3 ? `${medalColors[originalRank - 1]}08` : 'transparent',
                    '&:hover': { backgroundColor: '#334155' },
                  }}
                  onClick={() => onSelectModel && onSelectModel(model)}
                >
                  <TableCell sx={{ borderColor: '#334155' }}>
                    {isTop3 ? (
                      <Tooltip title={['Gold', 'Silver', 'Bronze'][originalRank - 1]}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            backgroundColor: `${medalColors[originalRank - 1]}22`,
                            color: medalColors[originalRank - 1],
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {originalRank}
                        </Avatar>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600, pl: 0.5 }}>
                        {originalRank}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    <Typography variant="body2" sx={{ color: '#F1F5F9', fontWeight: 600 }}>
                      {model.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#94A3B8', borderColor: '#334155', fontSize: '0.8rem' }}>
                    {model.publisher}
                  </TableCell>
                  <TableCell sx={{ color: '#10B981', borderColor: '#334155', fontWeight: 600 }}>
                    {model.rmse.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: '#3B82F6', borderColor: '#334155', fontWeight: 600 }}>
                    {model.mae.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: '#F59E0B', borderColor: '#334155', fontWeight: 600 }}>
                    {model.rSquared.toFixed(3)}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    <Chip
                      label={model.skillScore.toFixed(2)}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          model.skillScore >= 0.6
                            ? '#10B98122'
                            : model.skillScore >= 0.4
                              ? '#F59E0B22'
                              : '#EF444422',
                        color:
                          model.skillScore >= 0.6
                            ? '#10B981'
                            : model.skillScore >= 0.4
                              ? '#F59E0B'
                              : '#EF4444',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    <Chip
                      label={model.region}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        backgroundColor: '#1E40AF22',
                        color: '#60A5FA',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#94A3B8', borderColor: '#334155', fontSize: '0.8rem' }}>
                    {formatNum(model.predictionsDay)}
                  </TableCell>
                  <TableCell sx={{ borderColor: '#334155' }}>
                    {model.trend === 'up' && <TrendingUp sx={{ fontSize: 18, color: '#10B981' }} />}
                    {model.trend === 'down' && (
                      <TrendingUp sx={{ fontSize: 18, color: '#EF4444', transform: 'scaleY(-1)' }} />
                    )}
                    {model.trend === 'stable' && (
                      <Box sx={{ width: 18, height: 2, backgroundColor: '#64748B', borderRadius: 1, mt: 1 }} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Top 5 performance over time */}
      <Paper sx={panelSx}>
        <Typography variant="subtitle1" sx={{ color: '#F1F5F9', fontWeight: 700, mb: 2 }}>
          Top 5 Models - RMSE Over Time ({paramFilter}, {horizonFilter} forecast)
        </Typography>
        <Box sx={{ height: 350 }}>
          <Line data={performanceOverTime} options={chartOptions} />
        </Box>
      </Paper>
    </Box>
  );
};

// frontend#325: every figure in ModelLeaderboardSample is generated in the browser; no
// route on the testnet API backs it (aiml-routes /models only exists in the
// legacy unified_api_server). Default build: honest not-live, sample never
// mounted. Demo surfaces: sample under a "Sample data" chip.
const ModelLeaderboard = (props) => (
  <DemoSurfaceGate
    title="Model leaderboard is not live on the testnet yet"
    description="No leaderboard route is mounted on the testnet API; the ranking in the preview is generated in the browser."
    testId="model-leaderboard"
  >
    <ModelLeaderboardSample {...props} />
  </DemoSurfaceGate>
);

export default ModelLeaderboard;
