import React, { useState, useEffect } from 'react';
import './GlobalAccessibility.css';

/**
 * GlobalAccessibility Component
 *
 * Provides multi-language support, currency selection, and accessibility options.
 * Ensures the fair launch is accessible to users worldwide with different needs.
 */
const GlobalAccessibility = ({
  language = 'en',
  onLanguageChange,
  currency = 'USD',
  onCurrencyChange,
  accessibility = {},
  onAccessibilityChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('language');

  // Supported languages with native names
  const languages = {
    en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
    zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  };

  // Supported currencies with symbols
  const currencies = {
    USD: { name: 'US Dollar', symbol: '$', region: 'United States' },
    EUR: { name: 'Euro', symbol: '€', region: 'European Union' },
    GBP: { name: 'British Pound', symbol: '£', region: 'United Kingdom' },
    CNY: { name: 'Chinese Yuan', symbol: '¥', region: 'China' },
    INR: { name: 'Indian Rupee', symbol: '₹', region: 'India' },
    JPY: { name: 'Japanese Yen', symbol: '¥', region: 'Japan' },
    KRW: { name: 'Korean Won', symbol: '₩', region: 'South Korea' },
    AUD: { name: 'Australian Dollar', symbol: 'A$', region: 'Australia' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', region: 'Canada' },
    BRL: { name: 'Brazilian Real', symbol: 'R$', region: 'Brazil' },
    RUB: { name: 'Russian Ruble', symbol: '₽', region: 'Russia' },
    TRY: { name: 'Turkish Lira', symbol: '₺', region: 'Turkey' },
  };

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('wrfcoin-language', language);
    localStorage.setItem('wrfcoin-currency', currency);
    localStorage.setItem(
      'wrfcoin-accessibility',
      JSON.stringify(accessibility),
    );
  }, [language, currency, accessibility]);

  // Handle language change
  const handleLanguageChange = newLanguage => {
    onLanguageChange(newLanguage);
    setIsOpen(false);
  };

  // Handle currency change
  const handleCurrencyChange = newCurrency => {
    onCurrencyChange(newCurrency);
    setIsOpen(false);
  };

  // Handle accessibility setting change
  const handleAccessibilityChange = (setting, value) => {
    const newAccessibility = {
      ...accessibility,
      [setting]: value,
    };
    onAccessibilityChange(newAccessibility);

    // Apply immediate DOM changes for accessibility
    if (setting === 'highContrast') {
      document.body.classList.toggle('high-contrast', value);
    }
    if (setting === 'largeText') {
      document.body.classList.toggle('large-text', value);
    }
    if (setting === 'reduceMotion') {
      document.body.classList.toggle('reduce-motion', value);
    }
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (isOpen && !event.target.closest('.accessibility-panel')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`global-accessibility ${className}`}>
      {/* Toggle Button */}
      <button
        className="accessibility-toggle"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-label="Open accessibility options"
        aria-expanded={isOpen}
      >
        <span className="toggle-icon">🌐</span>
        <span className="toggle-text">Accessibility</span>
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="accessibility-panel" role="dialog" aria-modal="true">
          <div className="panel-header">
            <h3 className="panel-title">Accessibility Options</h3>
            <button
              className="panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility options"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="panel-tabs">
            <button
              className={`tab-button ${activeTab === 'language' ? 'active' : ''}`}
              onClick={() => setActiveTab('language')}
              aria-selected={activeTab === 'language'}
            >
              🌍 Language
            </button>
            <button
              className={`tab-button ${activeTab === 'currency' ? 'active' : ''}`}
              onClick={() => setActiveTab('currency')}
              aria-selected={activeTab === 'currency'}
            >
              💰 Currency
            </button>
            <button
              className={`tab-button ${activeTab === 'accessibility' ? 'active' : ''}`}
              onClick={() => setActiveTab('accessibility')}
              aria-selected={activeTab === 'accessibility'}
            >
              ♿ Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="panel-content">
            {/* Language Tab */}
            {activeTab === 'language' && (
              <div className="language-section">
                <h4 className="section-title">Select Language</h4>
                <div className="language-grid">
                  {Object.entries(languages).map(([code, lang]) => (
                    <button
                      key={code}
                      className={`language-option ${language === code ? 'selected' : ''}`}
                      onClick={() => handleLanguageChange(code)}
                      aria-pressed={language === code}
                    >
                      <span className="language-flag">{lang.flag}</span>
                      <div className="language-names">
                        <span className="language-native">
                          {lang.nativeName}
                        </span>
                        <span className="language-english">{lang.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Currency Tab */}
            {activeTab === 'currency' && (
              <div className="currency-section">
                <h4 className="section-title">Select Currency</h4>
                <div className="currency-grid">
                  {Object.entries(currencies).map(([code, curr]) => (
                    <button
                      key={code}
                      className={`currency-option ${currency === code ? 'selected' : ''}`}
                      onClick={() => handleCurrencyChange(code)}
                      aria-pressed={currency === code}
                    >
                      <div className="currency-symbol">{curr.symbol}</div>
                      <div className="currency-info">
                        <span className="currency-code">{code}</span>
                        <span className="currency-name">{curr.name}</span>
                        <span className="currency-region">{curr.region}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Accessibility Settings Tab */}
            {activeTab === 'accessibility' && (
              <div className="accessibility-section">
                <h4 className="section-title">Accessibility Settings</h4>

                <div className="accessibility-options">
                  {/* High Contrast */}
                  <div className="option-item">
                    <div className="option-info">
                      <label htmlFor="high-contrast" className="option-label">
                        High Contrast Mode
                      </label>
                      <p className="option-description">
                        Increases color contrast for better visibility
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        id="high-contrast"
                        type="checkbox"
                        checked={accessibility.highContrast || false}
                        onChange={e =>
                          handleAccessibilityChange(
                            'highContrast',
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Large Text */}
                  <div className="option-item">
                    <div className="option-info">
                      <label htmlFor="large-text" className="option-label">
                        Large Text
                      </label>
                      <p className="option-description">
                        Increases text size for better readability
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        id="large-text"
                        type="checkbox"
                        checked={accessibility.largeText || false}
                        onChange={e =>
                          handleAccessibilityChange(
                            'largeText',
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Reduce Motion */}
                  <div className="option-item">
                    <div className="option-info">
                      <label htmlFor="reduce-motion" className="option-label">
                        Reduce Motion
                      </label>
                      <p className="option-description">
                        Minimizes animations and transitions
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        id="reduce-motion"
                        type="checkbox"
                        checked={accessibility.reduceMotion || false}
                        onChange={e =>
                          handleAccessibilityChange(
                            'reduceMotion',
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Screen Reader Support */}
                  <div className="option-item">
                    <div className="option-info">
                      <label htmlFor="screen-reader" className="option-label">
                        Enhanced Screen Reader Support
                      </label>
                      <p className="option-description">
                        Adds extra labels and descriptions for assistive
                        technology
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        id="screen-reader"
                        type="checkbox"
                        checked={accessibility.screenReader || false}
                        onChange={e =>
                          handleAccessibilityChange(
                            'screenReader',
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  {/* Keyboard Navigation */}
                  <div className="option-item">
                    <div className="option-info">
                      <label htmlFor="keyboard-nav" className="option-label">
                        Enhanced Keyboard Navigation
                      </label>
                      <p className="option-description">
                        Improves keyboard-only navigation experience
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        id="keyboard-nav"
                        type="checkbox"
                        checked={accessibility.keyboardNav || false}
                        onChange={e =>
                          handleAccessibilityChange(
                            'keyboardNav',
                            e.target.checked,
                          )
                        }
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  className="reset-button"
                  onClick={() => onAccessibilityChange({})}
                >
                  Reset to Defaults
                </button>
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="panel-footer">
            <p className="footer-text">
              Your preferences are automatically saved and will persist across
              sessions.
            </p>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="accessibility-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default GlobalAccessibility;
