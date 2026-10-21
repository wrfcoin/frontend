import React, { useState } from 'react';
import { securityService } from '../../services/securityService';

/**
 * MEV Protection Panel Component
 * Settings for MEV (Maximal Extractable Value) protection
 */
const MevProtectionPanel = ({ settings, onUpdateSettings }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [transactionData, setTransactionData] = useState(
    JSON.stringify(
      {
        hash: '0x1234567890abcdef',
        from: '0xSenderAddress',
        to: '0xUniswap',
        value: '1500',
        gasPrice: '15',
        data: '0x123abc',
      },
      null,
      2,
    ),
  );
  const [analysisError, setAnalysisError] = useState(null);

  // Handle MEV protection toggle
  const handleToggleMevProtection = () => {
    onUpdateSettings({ mevProtection: !settings.mevProtection });
  };

  // Analyze a transaction for MEV risk
  const handleAnalyzeTransaction = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      // Parse the transaction data
      let parsedTransaction;
      try {
        parsedTransaction = JSON.parse(transactionData);
      } catch (parseError) {
        setAnalysisError(
          'Invalid transaction data format. Please enter valid JSON.',
        );
        setIsAnalyzing(false);
        return;
      }

      // Analyze the transaction
      const result = await securityService.analyzeMevRisk(parsedTransaction);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing transaction:', error);
      setAnalysisError(error.message || 'Failed to analyze transaction');
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get color class based on risk level
  const getRiskLevelClass = level => {
    switch (level) {
    case 'HIGH':
      return 'bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">MEV Protection</h2>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-700">
            {settings.mevProtection ? 'Enabled' : 'Disabled'}
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.mevProtection}
              onChange={handleToggleMevProtection}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          MEV protection helps prevent miners from extracting value from your
          transactions through front-running, back-running, and sandwich
          attacks.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            How MEV Protection Works
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Monitors transaction order and timing</li>
            <li>Detects potential sandwich attacks on DEX trades</li>
            <li>Prevents transaction front-running</li>
            <li>Uses private mempool options when available</li>
            <li>Optimizes gas settings to avoid replacement</li>
          </ul>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h3 className="font-semibold mb-4">Analyze Transaction for MEV Risk</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Transaction Data (JSON)
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
            rows="8"
            value={transactionData}
            onChange={e => setTransactionData(e.target.value)}
          ></textarea>
        </div>

        {analysisError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {analysisError}
          </div>
        )}

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleAnalyzeTransaction}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Transaction'}
        </button>
      </div>

      {analysisResult && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4">Analysis Results</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-gray-600 text-sm">Transaction ID:</span>
              <p className="font-mono text-sm truncate">
                {analysisResult.transactionId}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Risk Score:</span>
              <p className="font-medium">{analysisResult.riskScore}/100</p>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-gray-600 text-sm">Risk Level:</span>
            <p
              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getRiskLevelClass(analysisResult.riskLevel)} mt-1`}
            >
              {analysisResult.riskLevel}
            </p>
          </div>

          {analysisResult.riskFactors &&
            analysisResult.riskFactors.length > 0 && (
            <div className="mb-4">
              <span className="text-gray-600 text-sm">Risk Factors:</span>
              <ul className="list-disc list-inside text-sm mt-1">
                {analysisResult.riskFactors.map((factor, index) => (
                  <li key={index} className="text-gray-700">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.mitigationSuggestions &&
            analysisResult.mitigationSuggestions.length > 0 && (
            <div>
              <span className="text-gray-600 text-sm">
                  Mitigation Suggestions:
              </span>
              <ul className="list-disc list-inside text-sm mt-1">
                {analysisResult.mitigationSuggestions.map(
                  (suggestion, index) => (
                    <li key={index} className="text-gray-700">
                      {suggestion}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MevProtectionPanel;
