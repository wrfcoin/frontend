import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SensorsIcon from '@mui/icons-material/Sensors';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import InputAdornment from '@mui/material/InputAdornment';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  cardHover: '#263548',
  border: '#334155',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  purple: '#8B5CF6',
  pink: '#EC4899',
  cyan: '#06B6D4',
};

const BENEFITS = [
  { icon: <VerifiedIcon />, title: 'Pool data for higher quality scores', description: 'Cooperative data aggregation enables spatial consensus validation, boosting individual station scores by 5-15 points.' },
  { icon: <HandshakeIcon />, title: 'Shared maintenance resources', description: 'Members share tools, spare parts, and expertise. Group calibration events ensure consistent measurement accuracy.' },
  { icon: <MonetizationOnIcon />, title: 'Group discounts on hardware', description: 'Bulk purchasing agreements with Davis, Ecowitt, and Ambient Weather provide 15-25% discounts for cooperative members.' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CooperativeCard = ({ coop, onExpand, isExpanded }) => (
  <Card
    sx={{
      bgcolor: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 2,
      transition: 'all 0.2s',
      '&:hover': { borderColor: coop.color },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: `${coop.color}22`, color: coop.color, width: 52, height: 52, fontWeight: 700, fontSize: '1.1rem' }}>
          {coop.initials}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 700, mb: 0.5 }}>
            {coop.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {coop.region}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.5 }}>
            {coop.description}
          </Typography>
        </Box>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Paper sx={{ bgcolor: COLORS.bg, p: 1, textAlign: 'center', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700 }}>
              {coop.members}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Members</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ bgcolor: COLORS.bg, p: 1, textAlign: 'center', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700 }}>
              {coop.stations}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Stations</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ bgcolor: COLORS.bg, p: 1, textAlign: 'center', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ color: coop.qualityAverage >= 90 ? COLORS.success : COLORS.warning, fontWeight: 700 }}>
              {coop.qualityAverage}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>Quality Avg</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Sharing & Earnings */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Chip
          label={coop.dataSharingStatus === 'active' ? 'Data Sharing Active' : 'Data Sharing Pending'}
          size="small"
          sx={{
            bgcolor: coop.dataSharingStatus === 'active' ? `${COLORS.success}22` : `${COLORS.warning}22`,
            color: coop.dataSharingStatus === 'active' ? COLORS.success : COLORS.warning,
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MonetizationOnIcon sx={{ fontSize: 16, color: COLORS.warning }} />
          <Typography variant="body2" sx={{ color: COLORS.warning, fontWeight: 600 }}>
            {coop.combinedEarnings.toLocaleString()} WRF
          </Typography>
        </Box>
      </Box>

      {/* Top Members */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: -0.5 }}>
          {coop.topMembers.map((m) => (
            <Tooltip key={m.name} title={m.name}>
              <Avatar sx={{ bgcolor: m.color, width: 28, height: 28, fontSize: '0.7rem', border: `2px solid ${COLORS.card}`, ml: -0.5 }}>
                {m.avatar}
              </Avatar>
            </Tooltip>
          ))}
          {coop.members > 3 && (
            <Avatar sx={{ bgcolor: COLORS.border, width: 28, height: 28, fontSize: '0.6rem', border: `2px solid ${COLORS.card}`, ml: -0.5 }}>
              +{coop.members - 3}
            </Avatar>
          )}
        </Box>
        <IconButton size="small" onClick={() => onExpand(coop.id)} sx={{ color: COLORS.textSecondary }}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded Detail */}
      {isExpanded && (
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600, mb: 1 }}>
            Shared Data Policies
          </Typography>
          <List disablePadding>
            {coop.policies.map((policy, idx) => (
              <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  - {policy}
                </Typography>
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600, mt: 2, mb: 1 }}>
            Combined Statistics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              Founded: {coop.founded}
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              Total Earnings: {coop.combinedEarnings.toLocaleString()} WRF
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              Avg per Member: {(coop.combinedEarnings / coop.members).toFixed(1)} WRF
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button size="small" variant="outlined" startIcon={<ForumIcon sx={{ fontSize: 14 }} />} sx={{ color: COLORS.primary, borderColor: COLORS.primary, textTransform: 'none', fontSize: '0.8rem' }}>
              Discussion Board
            </Button>
            <Button size="small" variant="outlined" startIcon={<PersonIcon sx={{ fontSize: 14 }} />} sx={{ color: COLORS.textSecondary, borderColor: COLORS.border, textTransform: 'none', fontSize: '0.8rem' }}>
              View Members
            </Button>
          </Box>
        </Box>
      )}
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const CooperativeHub = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCoop, setExpandedCoop] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCoop, setNewCoop] = useState({ name: '', description: '', region: '', requirements: '' });
  const [cooperatives, setCooperatives] = useState([]);

  useEffect(() => {
    apiClient.get('/community/cooperatives')
      .then((data) => setCooperatives(Array.isArray(data) ? data : (data.cooperatives ?? [])))
      .catch(() => setCooperatives([]));
  }, []);

  const handleExpand = useCallback((id) => {
    setExpandedCoop((prev) => (prev === id ? null : id));
  }, []);

  const filteredCoops = useMemo(() => {
    if (!searchQuery.trim()) return cooperatives;
    const q = searchQuery.toLowerCase();
    return cooperatives.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [searchQuery, cooperatives]);

  return (
    <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GroupsIcon sx={{ color: COLORS.primary, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Weather Cooperatives
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search cooperatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: COLORS.textSecondary }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 240,
              '& .MuiOutlinedInput-root': {
                bgcolor: COLORS.card,
                color: COLORS.text,
                '& fieldset': { borderColor: COLORS.border },
                '&:hover fieldset': { borderColor: COLORS.primary },
              },
              '& .MuiInputBase-input::placeholder': { color: COLORS.textSecondary },
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ bgcolor: COLORS.primary, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#2563EB' } }}
          >
            Create Cooperative
          </Button>
        </Box>
      </Box>

      {/* Benefits Panel */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600, mb: 2 }}>
          Why Join a Cooperative?
        </Typography>
        <Grid container spacing={2}>
          {BENEFITS.map((benefit) => (
            <Grid item xs={12} md={4} key={benefit.title}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Avatar sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, width: 36, height: 36 }}>
                  {benefit.icon}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600, mb: 0.5 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, lineHeight: 1.5 }}>
                    {benefit.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Map Placeholder */}
      <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600, mb: 1.5 }}>
          Cooperative Territories
        </Typography>
        <Box
          sx={{
            bgcolor: COLORS.bg,
            borderRadius: 2,
            p: 4,
            position: 'relative',
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <PublicIcon sx={{ position: 'absolute', fontSize: 160, color: `${COLORS.border}44`, zIndex: 0 }} />
          {/* Territory markers */}
          {cooperatives.map((coop, idx) => {
            const positions = [
              { left: '15%', top: '30%' },
              { left: '35%', top: '25%' },
              { left: '20%', top: '55%' },
              { left: '75%', top: '35%' },
              { left: '45%', top: '45%' },
              { left: '85%', top: '40%' },
            ];
            const pos = positions[idx] || { left: '50%', top: '50%' };
            return (
              <Tooltip key={coop.id} title={`${coop.name} (${coop.stations} stations)`}>
                <Box
                  sx={{
                    position: 'absolute',
                    ...pos,
                    width: Math.max(24, coop.stations / 3),
                    height: Math.max(24, coop.stations / 3),
                    borderRadius: '50%',
                    bgcolor: `${coop.color}44`,
                    border: `2px solid ${coop.color}`,
                    cursor: 'pointer',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.3)' },
                  }}
                >
                  <Typography sx={{ fontSize: '0.55rem', color: COLORS.text, fontWeight: 700 }}>
                    {coop.initials}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Paper>

      {/* Cooperative Grid */}
      <Grid container spacing={2}>
        {filteredCoops.map((coop) => (
          <Grid item xs={12} md={6} key={coop.id}>
            <CooperativeCard
              coop={coop}
              onExpand={handleExpand}
              isExpanded={expandedCoop === coop.id}
            />
          </Grid>
        ))}
      </Grid>

      {filteredCoops.length === 0 && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: COLORS.textSecondary }}>No cooperatives match your search.</Typography>
        </Paper>
      )}

      {/* Create Cooperative Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: COLORS.card, border: `1px solid ${COLORS.border}` } }}
      >
        <DialogTitle sx={{ color: COLORS.text }}>Create a New Cooperative</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Cooperative Name"
              fullWidth
              value={newCoop.name}
              onChange={(e) => setNewCoop((p) => ({ ...p, name: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { color: COLORS.text, '& fieldset': { borderColor: COLORS.border } },
                '& .MuiInputLabel-root': { color: COLORS.textSecondary },
              }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newCoop.description}
              onChange={(e) => setNewCoop((p) => ({ ...p, description: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { color: COLORS.text, '& fieldset': { borderColor: COLORS.border } },
                '& .MuiInputLabel-root': { color: COLORS.textSecondary },
              }}
            />
            <TextField
              label="Region"
              fullWidth
              value={newCoop.region}
              onChange={(e) => setNewCoop((p) => ({ ...p, region: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { color: COLORS.text, '& fieldset': { borderColor: COLORS.border } },
                '& .MuiInputLabel-root': { color: COLORS.textSecondary },
              }}
            />
            <TextField
              label="Membership Requirements"
              fullWidth
              multiline
              rows={2}
              value={newCoop.requirements}
              onChange={(e) => setNewCoop((p) => ({ ...p, requirements: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { color: COLORS.text, '& fieldset': { borderColor: COLORS.border } },
                '& .MuiInputLabel-root': { color: COLORS.textSecondary },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: COLORS.textSecondary, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => setCreateDialogOpen(false)}
            sx={{ bgcolor: COLORS.primary, textTransform: 'none', '&:hover': { bgcolor: '#2563EB' } }}
          >
            Create Cooperative
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CooperativeHub;
