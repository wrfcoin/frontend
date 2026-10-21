import React from 'react';
import Avatar, { type AvatarProps as MuiAvatarProps } from '@mui/material/Avatar';
import type { SxProps, Theme } from '@mui/material/styles';

type WrfAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface WrfAvatarProps extends Omit<MuiAvatarProps, 'sizes'> {
  /** Display size */
  size?: WrfAvatarSize;
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Initials to display when no image is available */
  initials?: string;
  /** Icon element to use as fallback */
  icon?: React.ReactElement;
  className?: string;
  sx?: SxProps<Theme>;
}

const sizePixels: Record<WrfAvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const fontSizes: Record<WrfAvatarSize, string> = {
  xs: '0.625rem',
  sm: '0.75rem',
  md: '0.875rem',
  lg: '1rem',
  xl: '1.25rem',
};

export const WrfAvatar = React.forwardRef<HTMLDivElement, WrfAvatarProps>(
  function WrfAvatar(
    { size = 'md', src, alt, initials, icon, children, sx, ...rest },
    ref,
  ) {
    const px = sizePixels[size];

    let content: React.ReactNode = children;
    if (!src && !children) {
      if (initials) {
        content = initials.slice(0, 2).toUpperCase();
      } else if (icon) {
        content = React.cloneElement(icon, {
          sx: { fontSize: px * 0.55 },
        } as any);
      }
    }

    return (
      <Avatar
        ref={ref}
        src={src}
        alt={alt}
        sx={[
          {
            width: px,
            height: px,
            fontSize: fontSizes[size],
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ] as SxProps<Theme>}
        {...rest}
      >
        {content}
      </Avatar>
    );
  },
);
