import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Switch,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Group as TeamIcon,
  KeyboardArrowDown as ExpandIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
const BG_ROOT = '#0F172A';
const BG_CARD = '#1E293B';
const BORDER = '#334155';
const PRIMARY = '#3B82F6';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';
const TEXT_SECONDARY = '#94A3B8';
const PURPLE = '#8B5CF6';

// ---------------------------------------------------------------------------
// Role definitions
// ---------------------------------------------------------------------------
const ROLES = [
  { value: 'owner', label: 'Owner', color: WARNING, icon: <AdminIcon sx={{ fontSize: 14 }} /> },
  { value: 'editor', label: 'Editor', color: PRIMARY, icon: <EditIcon sx={{ fontSize: 14 }} /> },
  { value: 'commenter', label: 'Commenter', color: PURPLE, icon: <CommentIcon sx={{ fontSize: 14 }} /> },
  { value: 'viewer', label: 'Viewer', color: TEXT_SECONDARY, icon: <VisibilityIcon sx={{ fontSize: 14 }} /> },
];

// ---------------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------------
const PERMISSIONS = [
  { key: 'edit', label: 'Edit content', owner: true, editor: true, commenter: false, viewer: false },
  { key: 'comment', label: 'Add comments', owner: true, editor: true, commenter: true, viewer: false },
  { key: 'view', label: 'View workspace', owner: true, editor: true, commenter: true, viewer: true },
  { key: 'share', label: 'Share with others', owner: true, editor: true, commenter: false, viewer: false },
  { key: 'delete', label: 'Delete workspace', owner: true, editor: false, commenter: false, viewer: false },
  { key: 'manage', label: 'Manage members', owner: true, editor: false, commenter: false, viewer: false },
];


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2);
}

function getRoleMeta(role) {
  return ROLES.find((r) => r.value === role) || ROLES[3];
}

function formatLastActive(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function MemberRow({ member, onRoleChange }) {
  const roleMeta = getRoleMeta(member.role);

  return (
    <Paper
      sx={{
        bgcolor: BG_ROOT,
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        p: 2,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: `${BORDER}CC` },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-dot': {
              bgcolor: member.online ? SUCCESS : `${TEXT_SECONDARY}60`,
              width: 10,
              height: 10,
              border: `2px solid ${BG_ROOT}`,
            },
          }}
        >
          <Avatar sx={{ bgcolor: member.color, width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
            {getInitials(member.name)}
          </Avatar>
        </Badge>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
              {member.name}
            </Typography>
            {member.online && (
              <Chip
                label="Online"
                size="small"
                sx={{ bgcolor: `${SUCCESS}15`, color: SUCCESS, fontSize: 10, height: 18, fontWeight: 600 }}
              />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
            {member.email}
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select
            value={member.role}
            onChange={(e) => onRoleChange(member.id, e.target.value)}
            disabled={member.role === 'owner'}
            sx={{
              bgcolor: `${roleMeta.color}10`,
              color: roleMeta.color,
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 1.5,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: `${roleMeta.color}30` },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: roleMeta.color },
              '& .MuiSvgIcon-root': { color: roleMeta.color, fontSize: 18 },
            }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value} sx={{ fontSize: 12, gap: 1 }}>
                {r.icon} {r.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Activity stats */}
      <Box sx={{ display: 'flex', gap: 3, mt: 1.5, pl: 7 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TimeIcon sx={{ color: TEXT_SECONDARY, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>
            {formatLastActive(member.lastActive)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EditIcon sx={{ color: TEXT_SECONDARY, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>
            {member.edits} edits
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CommentIcon sx={{ color: TEXT_SECONDARY, fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY, fontSize: 11 }}>
            {member.comments} comments
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function TeamPanel() {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    apiClient.get('/collaborative/team-members')
      .then((data) => setMembers(Array.isArray(data) ? data : (data.members ?? [])))
      .catch(() => setMembers([]));
  }, []);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [workspaceName, setWorkspaceName] = useState('Q1 2026 Hurricane Season Outlook');
  const [workspaceDescription, setWorkspaceDescription] = useState('Collaborative seasonal forecast for the 2026 Atlantic hurricane season. Multi-model ensemble analysis with analog year comparisons.');
  const [visibility, setVisibility] = useState('team');
  const [showSettings, setShowSettings] = useState(false);

  const handleRoleChange = useCallback((memberId, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );
  }, []);

  const handleInvite = useCallback(() => {
    if (!inviteEmail.trim()) return;
    const newMember = {
      id: `u-new-${Date.now()}`,
      name: inviteEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email: inviteEmail,
      role: inviteRole,
      color: ROLES.find((r) => r.value === inviteRole)?.color || PRIMARY,
      online: false,
      lastActive: new Date().toISOString(),
      edits: 0,
      comments: 0,
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail('');
  }, [inviteEmail, inviteRole]);

  const onlineCount = members.filter((m) => m.online).length;

  return (
    <Box sx={{ bgcolor: BG_ROOT, minHeight: '100vh', p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: `${PRIMARY}20`, borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GroupsIcon sx={{ color: PRIMARY }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Team Management
            </Typography>
            <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
              {members.length} members - {onlineCount} online
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={() => setShowSettings((p) => !p)}
          sx={{ color: showSettings ? PRIMARY : TEXT_SECONDARY }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Workspace settings (collapsible) */}
      {showSettings && (
        <Paper
          sx={{
            bgcolor: BG_CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 2,
            p: 3,
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
            Workspace Settings
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: BG_ROOT,
                  color: '#fff',
                  '& fieldset': { borderColor: BORDER },
                  '&:hover fieldset': { borderColor: TEXT_SECONDARY },
                  '&.Mui-focused fieldset': { borderColor: PRIMARY },
                },
                '& .MuiInputLabel-root': { color: TEXT_SECONDARY },
              }}
            />

            <TextField
              label="Description"
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: BG_ROOT,
                  color: '#fff',
                  '& fieldset': { borderColor: BORDER },
                  '&:hover fieldset': { borderColor: TEXT_SECONDARY },
                  '&.Mui-focused fieldset': { borderColor: PRIMARY },
                },
                '& .MuiInputLabel-root': { color: TEXT_SECONDARY },
              }}
            />

            <Box>
              <Typography variant="caption" sx={{ color: TEXT_SECONDARY, mb: 1, display: 'block', fontWeight: 600 }}>
                Visibility
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { value: 'private', label: 'Private', icon: <LockIcon sx={{ fontSize: 16 }} /> },
                  { value: 'team', label: 'Team', icon: <TeamIcon sx={{ fontSize: 16 }} /> },
                  { value: 'public', label: 'Public', icon: <PublicIcon sx={{ fontSize: 16 }} /> },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={visibility === opt.value ? 'contained' : 'outlined'}
                    startIcon={opt.icon}
                    size="small"
                    onClick={() => setVisibility(opt.value)}
                    sx={{
                      bgcolor: visibility === opt.value ? PRIMARY : 'transparent',
                      color: visibility === opt.value ? '#fff' : TEXT_SECONDARY,
                      borderColor: visibility === opt.value ? PRIMARY : BORDER,
                      textTransform: 'none',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 1.5,
                      '&:hover': {
                        bgcolor: visibility === opt.value ? '#2563EB' : `${PRIMARY}10`,
                        borderColor: PRIMARY,
                      },
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Invite members */}
      <Paper
        sx={{
          bgcolor: BG_CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          p: 2.5,
          mb: 3,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon sx={{ fontSize: 18, color: PRIMARY }} />
          Invite Members
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <TextField
            placeholder="Enter email address..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            size="small"
            fullWidth
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: BG_ROOT,
                color: '#fff',
                borderRadius: 1.5,
                '& fieldset': { borderColor: BORDER },
                '&:hover fieldset': { borderColor: TEXT_SECONDARY },
                '&.Mui-focused fieldset': { borderColor: PRIMARY },
              },
              '& input::placeholder': { color: TEXT_SECONDARY, opacity: 1 },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              sx={{
                bgcolor: BG_ROOT,
                color: '#fff',
                borderRadius: 1.5,
                fontSize: 12,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: TEXT_SECONDARY },
                '& .MuiSvgIcon-root': { color: TEXT_SECONDARY },
              }}
            >
              {ROLES.filter((r) => r.value !== 'owner').map((r) => (
                <MenuItem key={r.value} value={r.value} sx={{ fontSize: 12, gap: 1 }}>
                  {r.icon} {r.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
            sx={{
              bgcolor: PRIMARY,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 1.5,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#2563EB' },
            }}
          >
            Invite
          </Button>
        </Box>

        {/* Share link */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 1.5, bgcolor: BG_ROOT, borderRadius: 1.5, border: `1px solid ${BORDER}` }}>
          <Typography variant="caption" sx={{ color: TEXT_SECONDARY, flex: 1 }} noWrap>
            https://app.wrfcoin.io/workspace/ws-1/invite?token=abc123def
          </Typography>
          <Tooltip title="Copy invite link">
            <IconButton size="small" sx={{ color: PRIMARY }}>
              <CopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Member list */}
      <Paper
        sx={{
          bgcolor: BG_CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          p: 2.5,
          mb: 3,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
          Members ({members.length})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {members.map((member) => (
            <MemberRow key={member.id} member={member} onRoleChange={handleRoleChange} />
          ))}
        </Box>
      </Paper>

      {/* Permission matrix */}
      <Paper
        sx={{
          bgcolor: BG_CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 2,
          p: 2.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
          Permission Matrix
        </Typography>
        <Paper sx={{ bgcolor: BG_ROOT, border: `1px solid ${BORDER}`, borderRadius: 1.5, overflow: 'hidden' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              <Box component="tr" sx={{ bgcolor: `${PRIMARY}08` }}>
                <Box component="th" sx={{ p: 1.5, textAlign: 'left', color: TEXT_SECONDARY, fontSize: 12, fontWeight: 600, borderBottom: `1px solid ${BORDER}` }}>
                  Permission
                </Box>
                {ROLES.map((r) => (
                  <Box
                    component="th"
                    key={r.value}
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      color: r.color,
                      fontSize: 12,
                      fontWeight: 700,
                      borderBottom: `1px solid ${BORDER}`,
                    }}
                  >
                    {r.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {PERMISSIONS.map((perm, idx) => (
                <Box
                  component="tr"
                  key={perm.key}
                  sx={{
                    bgcolor: idx % 2 === 0 ? 'transparent' : `${BORDER}15`,
                    '&:hover': { bgcolor: `${PRIMARY}05` },
                  }}
                >
                  <Box component="td" sx={{ p: 1.5, color: '#CBD5E1', fontSize: 13, borderBottom: `1px solid ${BORDER}30` }}>
                    {perm.label}
                  </Box>
                  {ROLES.map((r) => (
                    <Box
                      component="td"
                      key={r.value}
                      sx={{ p: 1.5, textAlign: 'center', borderBottom: `1px solid ${BORDER}30` }}
                    >
                      {perm[r.value] ? (
                        <CheckIcon sx={{ fontSize: 18, color: SUCCESS }} />
                      ) : (
                        <Box sx={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Box sx={{ width: 8, height: 2, bgcolor: `${TEXT_SECONDARY}40`, borderRadius: 1 }} />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Paper>
    </Box>
  );
}

export default TeamPanel;
