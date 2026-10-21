import React, { useState } from 'react';

import PropTypes from 'prop-types';

import './InfoBox.css';

/**
 * InfoBox Component
 *
 * Displays an information box with a title, content, and appropriate styling
 * based on the provided type. The InfoBox can be dismissed by the user.
 *
 * @param {string} type - Type of info box (info, warning, success, error)
 * @param {string} title - Title of the info box
 * @param {string|React.ReactNode} content - Content to display in the info box
 * @param {boolean} dismissible - Whether the info box can be dismissed
 * @param {boolean} bordered - Whether to show a border
 * @returns {React.Component}
 */
const InfoBox = ({
  type = 'info',
  title,
  content,
  dismissible = true,
  bordered = true,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const getTypeDetails = () => {
    switch (type) {
    case 'warning':
      return {
        icon: 'bi-exclamation-triangle-fill',
        className: 'info-box-warning',
        ariaLabel: 'Warning',
      };
    case 'success':
      return {
        icon: 'bi-check-circle-fill',
        className: 'info-box-success',
        ariaLabel: 'Success',
      };
    case 'error':
      return {
        icon: 'bi-x-circle-fill',
        className: 'info-box-error',
        ariaLabel: 'Error',
      };
    case 'info':
    default:
      return {
        icon: 'bi-info-circle-fill',
        className: 'info-box-info',
        ariaLabel: 'Information',
      };
    }
  };

  const { icon, className, ariaLabel } = getTypeDetails();
  const borderClass = bordered ? 'info-box-bordered' : '';

  return (
    <div
      className={`info-box ${className} ${borderClass}`}
      role="alert"
      aria-label={ariaLabel}
    >
      <div className="info-box-header">
        <div className="info-box-title">
          <i className={`bi ${icon} info-box-icon`}></i>
          {title && <h4>{title}</h4>}
        </div>
        {dismissible && (
          <button
            className="info-box-close"
            onClick={() => setDismissed(true)}
            aria-label="Close"
          >
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>
      <div className="info-box-content">
        {typeof content === 'string' ? <p>{content}</p> : content}
      </div>
    </div>
  );
};

InfoBox.propTypes = {
  type: PropTypes.oneOf(['info', 'warning', 'success', 'error']),
  title: PropTypes.string,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  dismissible: PropTypes.bool,
  bordered: PropTypes.bool,
};

export default InfoBox;
