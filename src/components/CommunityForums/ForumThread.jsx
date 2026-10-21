import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  TextField,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ReplyIcon from '@mui/icons-material/Reply';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ForumIcon from '@mui/icons-material/Forum';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
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
  codeBlock: '#0D1117',
};

const REPUTATION_BADGES = {
  diamond: { label: 'Diamond', color: '#A78BFA', icon: <EmojiEventsIcon sx={{ fontSize: 14 }} /> },
  gold: { label: 'Gold', color: '#F59E0B', icon: <StarIcon sx={{ fontSize: 14 }} /> },
  silver: { label: 'Silver', color: '#94A3B8', icon: <StarIcon sx={{ fontSize: 14 }} /> },
  verified: { label: 'Verified', color: '#3B82F6', icon: <VerifiedIcon sx={{ fontSize: 14 }} /> },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const AuthorInfo = ({ author, size = 'medium' }) => {
  const badge = REPUTATION_BADGES[author.reputation];
  const avatarSize = size === 'small' ? 32 : 44;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar sx={{ bgcolor: author.avatarColor, width: avatarSize, height: avatarSize, fontSize: size === 'small' ? '0.8rem' : '1rem' }}>
        {author.avatar}
      </Avatar>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant={size === 'small' ? 'body2' : 'subtitle2'} sx={{ color: COLORS.text, fontWeight: 600 }}>
            {author.name}
          </Typography>
          {badge && (
            <Chip
              icon={badge.icon}
              label={badge.label}
              size="small"
              sx={{ bgcolor: `${badge.color}22`, color: badge.color, height: 20, fontSize: '0.65rem', '& .MuiChip-icon': { color: badge.color } }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
          {author.posts} posts
          {author.joinDate ? ` \u00B7 Joined ${author.joinDate}` : ''}
          {author.stations ? ` \u00B7 ${author.stations} stations` : ''}
        </Typography>
      </Box>
    </Box>
  );
};

const ReplyCard = ({ reply, onVote, onReply }) => {
  const [menuAnchor, setMenuAnchor] = useState(null);

  return (
    <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <AuthorInfo author={reply.author} size="small" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
            {reply.createdAt}
          </Typography>
          <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVertIcon sx={{ color: COLORS.textSecondary, fontSize: 18 }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            PaperProps={{ sx: { bgcolor: COLORS.card, border: `1px solid ${COLORS.border}` } }}
          >
            <MenuItem sx={{ color: COLORS.text, fontSize: '0.85rem' }} onClick={() => setMenuAnchor(null)}>
              Quote Reply
            </MenuItem>
            <MenuItem sx={{ color: COLORS.text, fontSize: '0.85rem' }} onClick={() => setMenuAnchor(null)}>
              Copy Link
            </MenuItem>
            <MenuItem sx={{ color: COLORS.error, fontSize: '0.85rem' }} onClick={() => setMenuAnchor(null)}>
              Report
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: COLORS.text, lineHeight: 1.7, mb: 2, whiteSpace: 'pre-wrap' }}>
        {reply.content}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => onVote(reply.id, 'up')}
          sx={{ color: reply.isUpvoted ? COLORS.primary : COLORS.textSecondary }}
        >
          <ThumbUpIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary, minWidth: 20, textAlign: 'center' }}>
          {reply.upvotes}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onVote(reply.id, 'down')}
          sx={{ color: reply.isDownvoted ? COLORS.error : COLORS.textSecondary }}
        >
          <ThumbDownIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Typography variant="caption" sx={{ color: COLORS.textSecondary, minWidth: 20, textAlign: 'center' }}>
          {reply.downvotes}
        </Typography>
        <Button
          size="small"
          startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
          onClick={() => onReply(reply.author.name)}
          sx={{ color: COLORS.textSecondary, textTransform: 'none', fontSize: '0.75rem', ml: 1, '&:hover': { color: COLORS.primary } }}
        >
          Reply
        </Button>
      </Box>
    </Paper>
  );
};

const ReplyEditor = ({ onSubmit, replyTo, onClearReplyTo }) => {
  const [content, setContent] = useState('');

  const handleSubmit = useCallback(() => {
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  }, [content, onSubmit]);

  const formatButtons = [
    { icon: <FormatBoldIcon sx={{ fontSize: 18 }} />, label: 'Bold' },
    { icon: <FormatItalicIcon sx={{ fontSize: 18 }} />, label: 'Italic' },
    { icon: <CodeIcon sx={{ fontSize: 18 }} />, label: 'Code' },
    { icon: <LinkIcon sx={{ fontSize: 18 }} />, label: 'Link' },
    { icon: <ImageIcon sx={{ fontSize: 18 }} />, label: 'Image' },
  ];

  return (
    <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ color: COLORS.text, mb: 1.5, fontWeight: 600 }}>
        Post a Reply
      </Typography>

      {replyTo && (
        <Chip
          label={`Replying to @${replyTo}`}
          onDelete={onClearReplyTo}
          size="small"
          sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, mb: 1.5 }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, borderBottom: `1px solid ${COLORS.border}`, pb: 1 }}>
        {formatButtons.map((btn) => (
          <Tooltip key={btn.label} title={btn.label}>
            <IconButton size="small" sx={{ color: COLORS.textSecondary, '&:hover': { color: COLORS.text } }}>
              {btn.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      <TextField
        multiline
        rows={4}
        fullWidth
        placeholder="Share your experience or ask a question..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: COLORS.bg,
            color: COLORS.text,
            '& fieldset': { borderColor: COLORS.border },
            '&:hover fieldset': { borderColor: COLORS.primary },
            '&.Mui-focused fieldset': { borderColor: COLORS.primary },
          },
          '& .MuiInputBase-input::placeholder': { color: COLORS.textSecondary },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          disabled={!content.trim()}
          onClick={handleSubmit}
          sx={{
            bgcolor: COLORS.primary,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#2563EB' },
            '&.Mui-disabled': { bgcolor: COLORS.border, color: COLORS.textSecondary },
          }}
        >
          Post Reply
        </Button>
      </Box>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const ForumThread = () => {
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [sortBy, setSortBy] = useState('oldest');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    apiClient.get('/community/forum-threads/current')
      .then((data) => {
        setThread(data);
        setIsBookmarked(data.isBookmarked ?? false);
        setIsFollowing(data.isFollowing ?? false);
      })
      .catch(() => setThread(null));
  }, []);

  useEffect(() => {
    apiClient.get('/community/forum-threads/current/replies')
      .then((data) => setReplies(Array.isArray(data) ? data : (data.replies ?? [])))
      .catch(() => setReplies([]));
  }, []);

  const sortedReplies = useMemo(() => {
    const sorted = [...replies];
    switch (sortBy) {
    case 'newest':
      return sorted.reverse();
    case 'most-upvoted':
      return sorted.sort((a, b) => b.upvotes - a.upvotes);
    case 'oldest':
    default:
      return sorted;
    }
  }, [replies, sortBy]);

  const visibleReplies = useMemo(() => sortedReplies.slice(0, visibleCount), [sortedReplies, visibleCount]);

  const handleVote = useCallback((replyId, direction) => {
    setReplies((prev) =>
      prev.map((r) => {
        if (r.id !== replyId) return r;
        if (direction === 'up') {
          return { ...r, upvotes: r.isUpvoted ? r.upvotes - 1 : r.upvotes + 1, isUpvoted: !r.isUpvoted, isDownvoted: false, downvotes: r.isDownvoted ? r.downvotes - 1 : r.downvotes };
        }
        return { ...r, downvotes: r.isDownvoted ? r.downvotes - 1 : r.downvotes + 1, isDownvoted: !r.isDownvoted, isUpvoted: false, upvotes: r.isUpvoted ? r.upvotes - 1 : r.upvotes };
      }),
    );
  }, []);

  const handleReply = useCallback((authorName) => {
    setReplyTo(authorName);
  }, []);

  const handleSubmitReply = useCallback((content) => {
    const newReply = {
      id: `reply-${Date.now()}`,
      author: { name: 'You', avatar: 'YO', avatarColor: COLORS.primary, reputation: 'silver', posts: 42 },
      createdAt: 'Just now',
      content,
      upvotes: 0,
      downvotes: 0,
      isUpvoted: false,
      isDownvoted: false,
    };
    setReplies((prev) => [...prev, newReply]);
    setReplyTo(null);
    setVisibleCount((c) => c + 1);
  }, []);

  return (
    <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        sx={{ color: COLORS.textSecondary, textTransform: 'none', mb: 2, '&:hover': { color: COLORS.text } }}
      >
        Back to Forums
      </Button>

      {/* Thread Header */}
      {thread && (
        <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Chip label={thread.category} size="small" sx={{ bgcolor: `${thread.categoryColor}22`, color: thread.categoryColor, mb: 1 }} />
            <Typography variant="h5" sx={{ color: COLORS.text, fontWeight: 700, mb: 1 }}>
              {thread.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {thread.author && <AuthorInfo author={thread.author} />}
              <Divider orientation="vertical" flexItem sx={{ borderColor: COLORS.border }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {thread.createdAt}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  {thread.views?.toLocaleString()} views
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ForumIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
                <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                  {thread.replyCount} replies
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Thread actions */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Tooltip title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}>
            <IconButton onClick={() => setIsBookmarked(!isBookmarked)} sx={{ color: isBookmarked ? COLORS.warning : COLORS.textSecondary }}>
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton sx={{ color: COLORS.textSecondary }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFollowing ? 'Unfollow Thread' : 'Follow Thread'}>
            <IconButton onClick={() => setIsFollowing(!isFollowing)} sx={{ color: isFollowing ? COLORS.primary : COLORS.textSecondary }}>
              {isFollowing ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Report">
            <IconButton sx={{ color: COLORS.textSecondary }}>
              <FlagIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Original Post Content */}
        <Typography variant="body1" sx={{ color: COLORS.text, lineHeight: 1.8, whiteSpace: 'pre-wrap', mb: 2 }}>
          {thread.content}
        </Typography>

        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(thread.tags ?? []).map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                sx={{ bgcolor: `${COLORS.primary}15`, color: COLORS.primary, cursor: 'pointer', '&:hover': { bgcolor: `${COLORS.primary}30` } }}
              />
            ))}
        </Box>
      </Paper>
      )}

      {/* Replies Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ color: COLORS.text, fontWeight: 600 }}>
          {replies.length} Replies
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{
              color: COLORS.text,
              bgcolor: COLORS.card,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
              '& .MuiSvgIcon-root': { color: COLORS.textSecondary },
            }}
          >
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="most-upvoted">Most Upvoted</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Replies */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {visibleReplies.map((reply) => (
          <ReplyCard key={reply.id} reply={reply} onVote={handleVote} onReply={handleReply} />
        ))}
      </Box>

      {/* Load More */}
      {visibleCount < sortedReplies.length && (
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button
            onClick={() => setVisibleCount((c) => c + 5)}
            sx={{ color: COLORS.primary, textTransform: 'none', fontWeight: 500 }}
          >
            Load More ({sortedReplies.length - visibleCount} remaining)
          </Button>
        </Box>
      )}

      {/* Reply Editor */}
      <ReplyEditor onSubmit={handleSubmitReply} replyTo={replyTo} onClearReplyTo={() => setReplyTo(null)} />
    </Box>
  );
};

export default ForumThread;
