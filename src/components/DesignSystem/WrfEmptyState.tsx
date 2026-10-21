import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/InboxOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import StorageIcon from '@mui/icons-material/Storage';
import type { SxProps, Theme } from '@mui/material/styles';
import { WrfButton } from './WrfButton';
import { palette, spacingScale, borderRadiusScale } from './tokens';

type WrfEmptyStateVariant = 'default' | 'search' | 'error' | 'no-data';

const variantDefaults: Record<WrfEmptyStateVariant, {
  icon: React.ElementType;
  title: string;
  description: string;
}> = {
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

export interface WrfEmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: WrfEmptyStateVariant;
  sx?: SxProps<Theme>;
}

export const WrfEmptyState = React.forwardRef<HTMLDivElement, WrfEmptyStateProps>(
  function WrfEmptyState(
    {
      icon: IconProp,
      title: titleProp,
      description: descriptionProp,
      actionLabel,
      onAction,
      variant = 'default',
      sx,
      ...rest
    },
    ref,
  ) {
    const defaults = variantDefaults[variant] ?? variantDefaults.default;
    const ResolvedIcon = IconProp ?? defaults.icon;
    const resolvedTitle = titleProp ?? defaults.title;
    const resolvedDescription = descriptionProp ?? defaults.description;

    return (
      <Box
        ref={ref}
        sx={[
          {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: `${spacingScale.xl * 2}px ${spacingScale.lg}px`,
            borderRadius: `${borderRadiusScale.lg}px`,
            background: `linear-gradient(135deg, ${palette.background.secondary} 0%, ${palette.background.primary} 100%)`,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
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
            mb: `${spacingScale.lg}px`,
          }}
        >
          <ResolvedIcon sx={{ fontSize: 36, color: palette.text.muted }} />
        </Box>
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: palette.text.primary,
            mb: `${spacingScale.sm}px`,
          }}
        >
          {resolvedTitle}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: palette.text.secondary,
            maxWidth: 400,
            lineHeight: 1.6,
            mb: actionLabel ? `${spacingScale.lg}px` : 0,
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
  },
);
