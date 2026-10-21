import React from 'react';
import { WrfCard } from '../DesignSystem';

/**
 * Legacy Card component - delegates to WrfCard from the DesignSystem.
 * Replaces the Bootstrap card / card-header pattern.
 */
const Card = ({ title, children, className = '' }) => (
  <WrfCard headerTitle={title} className={className}>
    {children}
  </WrfCard>
);

export default Card;
