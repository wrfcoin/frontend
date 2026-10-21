// WrfEmptyState - Empty state display with icon, message, and action
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/InboxOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StorageIcon from '@mui/icons-material/Storage';
import WrfButton from './WrfButton';
import { colors, borderRadius, spacing } from './tokens-compat';

const variantDefaults = {
  default: {
    icon: InboxIcon,
    title: 'Nothing here yet',
    description: 'There are no items to display at this time.',
  },
  search: {
    icon: SearchOffIcon,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters.',
  },
  error: {
    icon: ErrorOutlineIcon,
    title: 'Something went wrong',
    description: 'An error occurred while loading data. Please try again.',
  },
  'no-data': {
    icon: StorageIcon,
    title: 'No data available',
    description: 'Data has not been collected or is not available for this view.',
  },
};

const WrfEmptyState = ({
  icon: IconProp,
  title: titleProp,
  description: descriptionProp,
  actionLabel,
  onAction,
  variant = 'default',
  sx = {},
  ...props
}) => {
  const defaults = variantDefaults[variant] || variantDefaults.default;
  const ResolvedIcon = IconProp || defaults.icon;
  const resolvedTitle = titleProp || defaults.title;
  const resolvedDescription = descriptionProp || defaults.description;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: `${spacing.xl * 2}px ${spacing.lg}px`,
        borderRadius: `${borderRadius.lg}px`,
        background: `linear-gradient(135deg, ${colors.bg.secondary} 0%, ${colors.bg.primary} 100%)`,
        ...sx,
      }}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          marginBottom: `${spacing.lg}px`,
        }}
      >
        <ResolvedIcon
          sx={{
            fontSize: 36,
            color: colors.text.muted,
          }}
        />
      </Box>
      <Typography
        sx={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: colors.text.primary,
          marginBottom: `${spacing.sm}px`,
        }}
      >
        {resolvedTitle}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.875rem',
          color: colors.text.secondary,
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: actionLabel ? `${spacing.lg}px` : 0,
        }}
      >
        {resolvedDescription}
      </Typography>
      {actionLabel && onAction && (
        <WrfButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </WrfButton>
      )}
    </Box>
  );
};

export default WrfEmptyState;
