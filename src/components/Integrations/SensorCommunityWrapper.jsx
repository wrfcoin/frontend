import React, { useState } from 'react';
import SensorCommunityCard from './SensorCommunityCard';
import SensorCommunityPanel from './SensorCommunityPanel';

/**
 * SensorCommunityWrapper Component
 *
 * This component serves as a wrapper for the Sensor.Community integration,
 * handling the toggle between card and panel views.
 */
const SensorCommunityWrapper = ({ expanded, onExpand, onCollapse }) => {
  if (expanded) {
    return <SensorCommunityPanel onCollapse={onCollapse} />;
  }
  return <SensorCommunityCard onExpand={onExpand} />;
};

export default SensorCommunityWrapper;
