import React from 'react';
import { WrfButton } from '../DesignSystem';

/**
 * Legacy Button component - delegates to WrfButton from the DesignSystem.
 *
 * Maps legacy Bootstrap-style variant names to WrfButton variants:
 *   primary / secondary / danger / outline-* / ghost
 * Unmapped variants fall through to WrfButton's default (primary).
 */
const mapVariant = (variant) => {
  switch (variant) {
  case 'primary':
  case 'success':
  case 'info':
  case 'light':
  case 'dark':
  case 'warning':
    return 'primary';
  case 'secondary':
    return 'secondary';
  case 'danger':
    return 'danger';
  case 'outline-primary':
  case 'outline-secondary':
  case 'outline-success':
  case 'outline-danger':
  case 'outline-warning':
  case 'outline-info':
  case 'outline-light':
  case 'outline-dark':
    return 'outline';
  default:
    return 'primary';
  }
};

const mapSize = (size) => {
  switch (size) {
  case 'small':
    return 'sm';
  case 'large':
    return 'lg';
  case 'medium':
  default:
    return 'md';
  }
};

const Button = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  size = 'medium',
  ...rest
}) => {
  return (
    <WrfButton
      variant={mapVariant(variant)}
      size={mapSize(size)}
      className={className}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {children}
    </WrfButton>
  );
};

export default Button;
