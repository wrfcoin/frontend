import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideocamIcon from '@mui/icons-material/Videocam';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
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
  orange: '#F97316',
};

const EVENT_TYPES = {
  meetup: { label: 'Meetup', color: '#3B82F6' },
  workshop: { label: 'Workshop', color: '#10B981' },
  webinar: { label: 'Webinar', color: '#8B5CF6' },
  severe: { label: 'Severe Weather Briefing', color: '#EF4444' },
  calibration: { label: 'Calibration Day', color: '#F97316' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'meetup', label: 'Meetups' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'severe', label: 'Severe Weather' },
  { value: 'calibration', label: 'Calibration' },
];

const REGION_OPTIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'global', label: 'Global (Virtual)' },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
};

const formatDateStr = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CalendarGrid = ({ year, month, events, onDayClick, selectedDay }) => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<Box key={`empty-${i}`} sx={{ p: 1, minHeight: 64 }} />);
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter((e) => e.date === dateStr);
    const isSelected = selectedDay === dateStr;
    const isToday =
      new Date().getFullYear() === year &&
      new Date().getMonth() === month &&
      new Date().getDate() === day;

    cells.push(
      <Box
        key={day}
        onClick={() => onDayClick(dateStr)}
        sx={{
          p: 1,
          minHeight: 64,
          cursor: 'pointer',
          borderRadius: 1,
          border: isSelected ? `1px solid ${COLORS.primary}` : '1px solid transparent',
          bgcolor: isSelected ? `${COLORS.primary}11` : 'transparent',
          '&:hover': { bgcolor: COLORS.cardHover },
          transition: 'all 0.15s',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: isToday ? COLORS.primary : COLORS.text,
            fontWeight: isToday ? 700 : 400,
            mb: 0.5,
          }}
        >
          {day}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {dayEvents.map((evt) => (
            <Tooltip key={evt.id} title={evt.name}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: EVENT_TYPES[evt.type]?.color || COLORS.primary,
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>,
    );
  }

  return (
    <Box>
      {/* Day headers */}
      <Grid container columns={7} sx={{ mb: 0.5 }}>
        {DAYS_OF_WEEK.map((day) => (
          <Grid item xs={1} key={day}>
            <Typography
              variant="caption"
              sx={{ color: COLORS.textSecondary, fontWeight: 600, textAlign: 'center', display: 'block', py: 0.5 }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar cells */}
      <Grid container columns={7}>
        {cells.map((cell, idx) => (
          <Grid item xs={1} key={idx}>
            {cell}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const EventListItem = ({ event, onSelect, isSelected }) => {
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup;

  return (
    <Paper
      onClick={() => onSelect(event.id)}
      sx={{
        bgcolor: isSelected ? COLORS.cardHover : COLORS.card,
        border: `1px solid ${isSelected ? typeInfo.color : COLORS.border}`,
        borderRadius: 2,
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { bgcolor: COLORS.cardHover, borderColor: typeInfo.color },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600 }}>
              {event.name}
            </Typography>
            <Chip
              label={typeInfo.label}
              size="small"
              sx={{ bgcolor: `${typeInfo.color}22`, color: typeInfo.color, height: 20, fontSize: '0.65rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {formatDateStr(event.date)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 13, color: COLORS.textSecondary }} />
              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                {event.time}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {event.isVirtual ? (
                <VideocamIcon sx={{ fontSize: 13, color: COLORS.purple }} />
              ) : (
                <LocationOnIcon sx={{ fontSize: 13, color: COLORS.success }} />
              )}
              <Typography variant="caption" sx={{ color: COLORS.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                {event.location}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right', ml: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end', mb: 0.5 }}>
            <GroupsIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {event.rsvpCount} RSVP
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <Avatar sx={{ bgcolor: event.host.color, width: 20, height: 20, fontSize: '0.55rem' }}>
              {event.host.avatar}
            </Avatar>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {event.host.name}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

const EventDetailPanel = ({ event, onClose }) => {
  const [hasRsvped, setHasRsvped] = useState(false);
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.meetup;

  return (
    <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              label={typeInfo.label}
              size="small"
              sx={{ bgcolor: `${typeInfo.color}22`, color: typeInfo.color }}
            />
            {event.isVirtual ? (
              <Chip label="Virtual" size="small" icon={<VideocamIcon sx={{ fontSize: 14 }} />} sx={{ bgcolor: `${COLORS.purple}22`, color: COLORS.purple, '& .MuiChip-icon': { color: COLORS.purple } }} />
            ) : (
              <Chip label="In-Person" size="small" icon={<LocationOnIcon sx={{ fontSize: 14 }} />} sx={{ bgcolor: `${COLORS.success}22`, color: COLORS.success, '& .MuiChip-icon': { color: COLORS.success } }} />
            )}
          </Box>
          <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 700, mb: 1 }}>
            {event.name}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: COLORS.textSecondary }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarTodayIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
          <Typography variant="body2" sx={{ color: COLORS.text }}>
            {formatDateStr(event.date)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
          <Typography variant="body2" sx={{ color: COLORS.text }}>
            {event.time}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {event.isVirtual ? (
            <VideocamIcon sx={{ fontSize: 16, color: COLORS.purple }} />
          ) : (
            <LocationOnIcon sx={{ fontSize: 16, color: COLORS.success }} />
          )}
          <Typography variant="body2" sx={{ color: COLORS.text }}>
            {event.location}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
          <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
            Hosted by
          </Typography>
          <Avatar sx={{ bgcolor: event.host.color, width: 22, height: 22, fontSize: '0.6rem' }}>
            {event.host.avatar}
          </Avatar>
          <Typography variant="body2" sx={{ color: COLORS.primary, fontWeight: 500 }}>
            {event.host.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupsIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
          <Typography variant="body2" sx={{ color: COLORS.text }}>
            {event.rsvpCount} attending
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: COLORS.border, mb: 2 }} />

      {/* Description */}
      <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600, mb: 1 }}>
        About This Event
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.textSecondary, lineHeight: 1.7, mb: 2 }}>
        {event.description}
      </Typography>

      {/* Agenda */}
      <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600, mb: 1 }}>
        Agenda
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
        {event.agenda.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 14, color: COLORS.textSecondary }} />
            <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Speakers */}
      <Typography variant="subtitle2" sx={{ color: COLORS.text, fontWeight: 600, mb: 1 }}>
        Speakers
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
        {event.speakers.map((speaker) => (
          <Chip
            key={speaker}
            avatar={<Avatar sx={{ bgcolor: COLORS.primary, fontSize: '0.6rem' }}>{speaker.slice(0, 2).toUpperCase()}</Avatar>}
            label={speaker}
            size="small"
            sx={{ bgcolor: `${COLORS.primary}15`, color: COLORS.text, '& .MuiChip-avatar': { color: COLORS.text } }}
          />
        ))}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          startIcon={hasRsvped ? <CheckCircleIcon /> : <EventIcon />}
          onClick={() => setHasRsvped(!hasRsvped)}
          sx={{
            bgcolor: hasRsvped ? COLORS.success : COLORS.primary,
            textTransform: 'none',
            fontWeight: 600,
            flex: 1,
            '&:hover': { bgcolor: hasRsvped ? '#059669' : '#2563EB' },
          }}
        >
          {hasRsvped ? 'RSVP Confirmed' : 'RSVP'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<CalendarTodayIcon />}
          sx={{
            color: COLORS.textSecondary,
            borderColor: COLORS.border,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: COLORS.primary, color: COLORS.primary },
          }}
        >
          Add to Calendar
        </Button>
      </Box>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const EventCalendar = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiClient.get('/community/events')
      .then((data) => setEvents(Array.isArray(data) ? data : (data.events ?? [])))
      .catch(() => setEvents([]));
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setSelectedDay(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedDay(null);
  }, []);

  const handleDayClick = useCallback((dateStr) => {
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
    setSelectedEventId(null);
  }, []);

  const handleEventSelect = useCallback((eventId) => {
    setSelectedEventId((prev) => (prev === eventId ? null : eventId));
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }
    if (regionFilter !== 'all') {
      filtered = filtered.filter((e) => e.region === regionFilter);
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter((e) => e.date >= todayStr);
    } else {
      filtered = filtered.filter((e) => e.date < todayStr);
    }
    if (selectedDay) {
      filtered = filtered.filter((e) => e.date === selectedDay);
    }

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
  }, [typeFilter, regionFilter, timeFilter, selectedDay, events]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Events for the currently displayed month (for calendar dots)
  const monthEvents = useMemo(() => {
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return events.filter((e) => e.date.startsWith(monthStr));
  }, [currentYear, currentMonth, events]);

  return (
    <Box sx={{ bgcolor: COLORS.bg, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EventIcon sx={{ color: COLORS.primary, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: COLORS.text, fontWeight: 700 }}>
            Community Events
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ bgcolor: COLORS.primary, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#2563EB' } }}
        >
          Create Event
        </Button>
      </Box>

      {/* Event Type Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(EVENT_TYPES).map(([key, info]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: info.color }} />
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {info.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Grid container spacing={3}>
        {/* Calendar */}
        <Grid item xs={12} md={selectedEvent ? 5 : 7}>
          <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 2.5, mb: 3 }}>
            {/* Month Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={handlePrevMonth} sx={{ color: COLORS.textSecondary }}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h6" sx={{ color: COLORS.text, fontWeight: 600 }}>
                {getMonthName(currentMonth)} {currentYear}
              </Typography>
              <IconButton onClick={handleNextMonth} sx={{ color: COLORS.textSecondary }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <CalendarGrid
              year={currentYear}
              month={currentMonth}
              events={monthEvents}
              onDayClick={handleDayClick}
              selectedDay={selectedDay}
            />
          </Paper>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{
                  color: COLORS.text,
                  bgcolor: COLORS.card,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
                  '& .MuiSvgIcon-root': { color: COLORS.textSecondary },
                }}
              >
                {FILTER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                sx={{
                  color: COLORS.text,
                  bgcolor: COLORS.card,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.primary },
                  '& .MuiSvgIcon-root': { color: COLORS.textSecondary },
                }}
              >
                {REGION_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {['upcoming', 'past'].map((val) => (
                <Button
                  key={val}
                  size="small"
                  onClick={() => setTimeFilter(val)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 2,
                    bgcolor: timeFilter === val ? `${COLORS.primary}22` : 'transparent',
                    color: timeFilter === val ? COLORS.primary : COLORS.textSecondary,
                    border: `1px solid ${timeFilter === val ? COLORS.primary : COLORS.border}`,
                    '&:hover': { bgcolor: `${COLORS.primary}15` },
                  }}
                >
                  {val.charAt(0).toUpperCase() + val.slice(1)}
                </Button>
              ))}
            </Box>
            {selectedDay && (
              <Chip
                label={`Showing: ${formatDateStr(selectedDay)}`}
                onDelete={() => setSelectedDay(null)}
                size="small"
                sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary }}
              />
            )}
          </Box>

          {/* Event List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {filteredEvents.map((event) => (
              <EventListItem
                key={event.id}
                event={event}
                onSelect={handleEventSelect}
                isSelected={selectedEventId === event.id}
              />
            ))}
            {filteredEvents.length === 0 && (
              <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
                <EventIcon sx={{ fontSize: 40, color: COLORS.textSecondary, mb: 1 }} />
                <Typography sx={{ color: COLORS.textSecondary }}>
                  No events match your current filters.
                </Typography>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Event Detail Panel */}
        {selectedEvent && (
          <Grid item xs={12} md={7}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEventId(null)} />
            </Box>
          </Grid>
        )}

        {/* Placeholder when no event selected */}
        {!selectedEvent && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ bgcolor: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 48, color: COLORS.textSecondary, mb: 2 }} />
              <Typography variant="h6" sx={{ color: COLORS.text, mb: 1 }}>
                Select an Event
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                Click on an event in the list to view details, RSVP, and add it to your calendar.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EventCalendar;
