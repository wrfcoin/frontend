import React from 'react';
import './ProgressTracker.css';

/**
 * ProgressTracker Component
 *
 * Displays the current step in the 3-step registration process.
 * Simple, clear progress indication for better user experience.
 */
const ProgressTracker = ({
  currentStep = 1,
  totalSteps = 3,
  stepNames = [],
  completed = false,
  onStepClick,
  className = '',
}) => {
  // Default step names if not provided
  const defaultStepNames = ['Choose Path', 'Configure', 'Complete'];

  const steps = stepNames.length
    ? stepNames
    : defaultStepNames.slice(0, totalSteps);

  // Handle step click
  const handleStepClick = stepNumber => {
    if (onStepClick && stepNumber <= currentStep) {
      onStepClick(stepNumber);
    }
  };

  // Calculate progress percentage
  const progressPercentage = completed
    ? 100
    : ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={`progress-tracker ${className}`}>
      <div className="progress-container">
        {/* Progress Bar Background */}
        <div className="progress-track">
          <div
            className="progress-line"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="steps-container">
          {steps.map((stepName, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep || completed;
            const isClickable = onStepClick && stepNumber <= currentStep;

            return (
              <div
                key={stepNumber}
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
              >
                {/* Step Circle */}
                <button
                  className="step-circle"
                  onClick={() => handleStepClick(stepNumber)}
                  disabled={!isClickable}
                  aria-label={`Step ${stepNumber}: ${stepName}`}
                >
                  <span className="step-number">
                    {isCompleted ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="check-icon"
                      >
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      stepNumber
                    )}
                  </span>
                </button>

                {/* Step Label */}
                <div className="step-label">
                  <span className="step-name">{stepName}</span>
                  <span className="step-status">
                    {isCompleted
                      ? 'Complete'
                      : isActive
                        ? 'In Progress'
                        : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Progress Text */}
        <div className="mobile-progress">
          Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}
        </div>
      </div>

      {/* Success Message */}
      {completed && (
        <div className="completion-message">
          <div className="success-icon">🎉</div>
          <span className="success-text">Registration Complete!</span>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
