import React from 'react';
import { SvgIcon } from '@mui/material';

const DuluthLiftBridgeIcon = props => {
  return (
    <SvgIcon {...props} viewBox="0 0 100 50">
      {/* Left tower */}
      <rect x="25" y="8" width="4" height="35" fill="currentColor" />

      {/* Right tower */}
      <rect x="71" y="8" width="4" height="35" fill="currentColor" />

      {/* Tower tops */}
      <rect x="23" y="6" width="8" height="4" fill="currentColor" />
      <rect x="69" y="6" width="8" height="4" fill="currentColor" />

      {/* Main horizontal span */}
      <rect x="33" y="22" width="34" height="3" fill="currentColor" />

      {/* Support cables from towers to span */}
      <line
        x1="27"
        y1="10"
        x2="35"
        y2="22"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="73"
        y1="10"
        x2="65"
        y2="22"
        stroke="currentColor"
        strokeWidth="1"
      />

      {/* Approach spans */}
      <rect x="8" y="37" width="17" height="2" fill="currentColor" />
      <rect x="75" y="37" width="17" height="2" fill="currentColor" />

      {/* Base/water line */}
      <rect
        x="0"
        y="43"
        width="100"
        height="7"
        fill="currentColor"
        opacity="0.1"
      />
    </SvgIcon>
  );
};

export default DuluthLiftBridgeIcon;
