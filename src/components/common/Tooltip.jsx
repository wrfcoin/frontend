import React, { useState } from 'react';
import './Tooltip.css';

/**
 * Tooltip component for providing help text on hover
 * @param {Object} props - Component properties
 * @param {string} props.text - The tooltip text to display
 * @param {React.ReactNode} props.children - The element that triggers the tooltip
 */
const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && <div className="tooltip-text">{text}</div>}
    </div>
  );
};

export default Tooltip;
