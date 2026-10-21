import React from 'react';
import Tooltip from './Tooltip';
import './Tooltip.css';

/**
 * Info icon with tooltip for form fields
 * @param {Object} props - Component properties
 * @param {string} props.text - The tooltip text to display
 */
const InfoIcon = ({ text }) => {
  return (
    <Tooltip text={text}>
      <span className="info-icon" role="img" aria-label="info">
        ℹ️
      </span>
    </Tooltip>
  );
};

export default InfoIcon;
