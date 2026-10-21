// WrfInput - Themed text input with label, icons, and error states
import React, { useState, useId } from 'react';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import { colors, borderRadius, spacing } from './tokens-compat';

const WrfInput = ({
  label,
  helperText,
  error = false,
  errorMessage,
  startIcon,
  endIcon,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  fullWidth = true,
  type = 'text',
  sx = {},
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const inputId = useId();

  const hasError = error || !!errorMessage;
  const borderColor = hasError
    ? colors.error.main
    : focused
      ? colors.border.focus
      : colors.border.default;

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      {label && (
        <Typography
          component="label"
          htmlFor={inputId}
          sx={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: hasError ? colors.error.main : colors.text.secondary,
            marginBottom: `${spacing.xs}px`,
            transition: 'color 0.15s ease',
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: colors.bg.primary,
          border: `1px solid ${borderColor}`,
          borderRadius: `${borderRadius.md}px`,
          padding: `${spacing.sm}px ${spacing.md}px`,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: focused && !hasError ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          '&:hover': disabled
            ? {}
            : {
              borderColor: hasError ? colors.error.main : colors.border.light,
            },
        }}
      >
        {startIcon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: colors.text.muted,
              marginRight: `${spacing.sm}px`,
              flexShrink: 0,
              '& svg': { fontSize: '1.25rem' },
            }}
          >
            {startIcon}
          </Box>
        )}
        <InputBase
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={{
            flex: 1,
            color: colors.text.primary,
            fontSize: '0.875rem',
            '& input': {
              padding: 0,
              '&::placeholder': {
                color: colors.text.muted,
                opacity: 1,
              },
            },
          }}
          {...props}
        />
        {endIcon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: colors.text.muted,
              marginLeft: `${spacing.sm}px`,
              flexShrink: 0,
              '& svg': { fontSize: '1.25rem' },
            }}
          >
            {endIcon}
          </Box>
        )}
      </Box>
      {(hasError && errorMessage) && (
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: colors.error.main,
            marginTop: `${spacing.xs}px`,
          }}
        >
          {errorMessage}
        </Typography>
      )}
      {helperText && !hasError && (
        <Typography
          sx={{
            fontSize: '0.75rem',
            color: colors.text.muted,
            marginTop: `${spacing.xs}px`,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default WrfInput;
