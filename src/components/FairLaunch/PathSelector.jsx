import React, { useState, useEffect } from 'react';
import './PathSelector.css';

/**
 * Interactive Path Selection Component
 *
 * Helps users choose the best registration path through 2-3 simple questions.
 * Designed to be Bitcoin-simple: intuitive, fast, and accessible.
 */
const PathSelector = ({ onPathSelected, className = '' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recommendedPath, setRecommendedPath] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Simple decision tree questions
  const questions = [
    {
      id: 'hasExistingCommunity',
      title: 'Do you have community connections?',
      subtitle: 'Existing WRFCoin participants who can vouch for you',
      options: [
        {
          value: 'yes',
          label: 'Yes, I know 5+ active participants',
          icon: '👥',
        },
        { value: 'no', label: 'No, I\'m new to the community', icon: '🆕' },
      ],
    },
    {
      id: 'hasContributions',
      title: 'Have you made contributions?',
      subtitle: 'GitHub repos, research papers, or community work',
      options: [
        {
          value: 'substantial',
          label: 'Yes, significant contributions',
          icon: '🏆',
        },
        { value: 'some', label: 'Yes, some contributions', icon: '📝' },
        { value: 'none', label: 'No, I\'m just starting', icon: '🌱' },
      ],
    },
    {
      id: 'preferredApproach',
      title: 'What\'s most important to you?',
      subtitle: 'Choose your priority for getting started',
      options: [
        { value: 'speed', label: 'Get started immediately', icon: '⚡' },
        { value: 'cost', label: 'Minimize upfront costs', icon: '💰' },
        {
          value: 'community',
          label: 'Build community connections',
          icon: '🤝',
        },
      ],
    },
  ];

  // Calculate recommended path based on answers
  useEffect(() => {
    if (Object.keys(answers).length === questions.length) {
      const path = calculateRecommendedPath(answers);
      setRecommendedPath(path);
      setShowResult(true);
    }
  }, [answers]);

  const calculateRecommendedPath = userAnswers => {
    const { hasExistingCommunity, hasContributions, preferredApproach } =
      userAnswers;

    // Merit Path Logic
    if (hasContributions === 'substantial') {
      return {
        path: 'MERIT',
        title: 'Merit Path Recommended',
        description: 'Your contributions earn you significant discounts',
        benefits: [
          'Up to 50% stake reduction',
          'Recognition for your contributions',
          'Lower barrier to entry',
          'Build reputation in ecosystem',
        ],
        requirements: [
          'Minimum 0.05 ETH stake (with discount)',
          'GitHub/research contribution proof',
          'Contribution verification',
        ],
        estimatedCost: '0.05-0.075 ETH',
        timeToComplete: '5-10 minutes',
        difficulty: 'Medium',
        icon: '🏆',
        color: 'from-purple-500 to-pink-500',
      };
    }

    // Community Path Logic
    if (
      hasExistingCommunity === 'yes' &&
      (preferredApproach === 'cost' || preferredApproach === 'community')
    ) {
      return {
        path: 'COMMUNITY',
        title: 'Community Path Recommended',
        description: 'Your network connections provide valuable support',
        benefits: [
          '25% stake reduction',
          'Community backing and support',
          'Faster dispute resolution',
          'Network growth rewards',
        ],
        requirements: [
          'Minimum 0.075 ETH stake (with discount)',
          '5 community vouchers',
          'Vouchers must stake 0.05 ETH each',
        ],
        estimatedCost: '0.075 ETH + community vouchers',
        timeToComplete: '10-15 minutes',
        difficulty: 'Easy',
        icon: '👥',
        color: 'from-blue-500 to-cyan-500',
      };
    }

    // Basic Path (Default)
    return {
      path: 'BASIC',
      title: 'Basic Path Recommended',
      description: 'Simple and straightforward - just like Bitcoin mining',
      benefits: [
        'Immediate activation',
        'No verification required',
        'Full economic security',
        'Transparent and simple',
      ],
      requirements: [
        'Minimum 0.1 ETH stake',
        'Connect your wallet',
        'Confirm transaction',
      ],
      estimatedCost: '0.1 ETH',
      timeToComplete: '2-3 minutes',
      difficulty: 'Easy',
      icon: '⚡',
      color: 'from-orange-500 to-red-500',
    };
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
      return;
    }
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSelectPath = path => {
    onPathSelected(path, recommendedPath);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendedPath(null);
    setShowResult(false);
  };

  // Render loading state
  if (!questions.length) {
    return (
      <div className="path-selector loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <div className={`path-selector ${className}`}>
      <div className="path-selector__container">
        {/* Header */}
        <div className="path-selector__header">
          <h2 className="path-selector__title">Which path is right for you?</h2>
          <p className="path-selector__subtitle">
            Answer 3 quick questions to find the best registration approach
          </p>

          {/* Progress Bar */}
          <div className="path-selector__progress">
            <div
              className="path-selector__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="path-selector__step-counter">
            Step {Math.min(currentStep + 1, questions.length)} of{' '}
            {questions.length}
          </div>
        </div>

        {/* Question Content */}
        {!showResult ? (
          <div className="path-selector__question">
            <div className="question__header">
              <h3 className="question__title">{currentQuestion.title}</h3>
              <p className="question__subtitle">{currentQuestion.subtitle}</p>
            </div>

            <div className="question__options">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option.value}
                  className={`option-button ${
                    answers[currentQuestion.id] === option.value
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                >
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="path-selector__navigation">
              {currentStep > 0 && (
                <button
                  className="nav-button nav-button--back"
                  onClick={handleBack}
                >
                  ← Back
                </button>
              )}

              <button
                className="nav-button nav-button--reset"
                onClick={resetQuiz}
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          /* Results */
          <div className="path-selector__result">
            <div
              className={`result-card bg-gradient-to-br ${recommendedPath.color}`}
            >
              <div className="result-header">
                <div className="result-icon">{recommendedPath.icon}</div>
                <h3 className="result-title">{recommendedPath.title}</h3>
                <p className="result-description">
                  {recommendedPath.description}
                </p>
              </div>

              <div className="result-details">
                {/* Cost & Time */}
                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Estimated Cost</span>
                    <span className="stat-value">
                      {recommendedPath.estimatedCost}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Time to Complete</span>
                    <span className="stat-value">
                      {recommendedPath.timeToComplete}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Difficulty</span>
                    <span className="stat-value">
                      {recommendedPath.difficulty}
                    </span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="result-section">
                  <h4 className="section-title">Benefits</h4>
                  <ul className="benefit-list">
                    {recommendedPath.benefits.map((benefit, index) => (
                      <li key={index} className="benefit-item">
                        ✓ {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div className="result-section">
                  <h4 className="section-title">Requirements</h4>
                  <ul className="requirement-list">
                    {recommendedPath.requirements.map((requirement, index) => (
                      <li key={index} className="requirement-item">
                        • {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="result-actions">
                <button
                  className="action-button action-button--primary"
                  onClick={() => handleSelectPath(recommendedPath.path)}
                >
                  Choose {recommendedPath.path.toLowerCase()} Path
                </button>

                <button
                  className="action-button action-button--secondary"
                  onClick={handleBack}
                >
                  See Other Options
                </button>

                <button
                  className="action-button action-button--ghost"
                  onClick={resetQuiz}
                >
                  Retake Quiz
                </button>
              </div>
            </div>

            {/* Alternative Paths */}
            <div className="alternative-paths">
              <h4 className="alternatives-title">Not sure? View all paths:</h4>
              <div className="alternatives-grid">
                <button
                  className="alternative-card"
                  onClick={() => handleSelectPath('BASIC')}
                  disabled={recommendedPath.path === 'BASIC'}
                >
                  <span className="alternative-icon">⚡</span>
                  <span className="alternative-name">Basic Path</span>
                  <span className="alternative-cost">0.1 ETH</span>
                </button>

                <button
                  className="alternative-card"
                  onClick={() => handleSelectPath('COMMUNITY')}
                  disabled={recommendedPath.path === 'COMMUNITY'}
                >
                  <span className="alternative-icon">👥</span>
                  <span className="alternative-name">Community Path</span>
                  <span className="alternative-cost">0.075 ETH</span>
                </button>

                <button
                  className="alternative-card"
                  onClick={() => handleSelectPath('MERIT')}
                  disabled={recommendedPath.path === 'MERIT'}
                >
                  <span className="alternative-icon">🏆</span>
                  <span className="alternative-name">Merit Path</span>
                  <span className="alternative-cost">0.05+ ETH</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PathSelector;
