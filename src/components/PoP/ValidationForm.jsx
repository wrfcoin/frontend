import React, { useState, useEffect } from 'react';
import { popService } from '../../services/popService';

import { POP_ROUTES_SERVED } from '../../services/popRoutes';

// Attestations go to POST /api/pop/attest, which is not served (popRoutes.js).
const POP_ATTESTATION_SERVED = POP_ROUTES_SERVED;
const ATTESTATION_UNAVAILABLE =
  'Validation attestations are not accepted by the testnet API yet: it serves no /api/pop routes.';

/**
 * Component for validating environmental data through the PoP system
 */
const ValidationForm = () => {
  // Submission state
  const [submissionId, setSubmissionId] = useState('');
  const [confidence, setConfidence] = useState(0.75);
  const [isValid, setIsValid] = useState(true);
  const [note, setNote] = useState('');

  // Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetched data
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch recent submissions on mount
  useEffect(() => {
    const fetchRecentSubmissions = async () => {
      setIsLoading(true);
      try {
        const result = await popService.getRecentSubmissions(10);
        // Handle both raw arrays and API response wrappers like { success: true, data: [...] }
        const submissions = result.data ? result.data : (Array.isArray(result) ? result : []);
        setRecentSubmissions(submissions);
      } catch (error) {
        console.error('Error fetching recent submissions:', error);
        setRecentSubmissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentSubmissions();
  }, []);

  // Handle form field changes
  const handleChange = e => {
    const { name, value } = e.target;

    if (name === 'submissionId') {
      setSubmissionId(value);
      // Clear selected submission when ID is changed manually
      setSelectedSubmission(null);
    } else if (name === 'confidence') {
      setConfidence(parseFloat(value));
    } else if (name === 'isValid') {
      setIsValid(value === 'true');
    } else if (name === 'note') {
      setNote(value);
    }
  };

  // Handle submission selection from list
  const handleSubmissionSelect = submission => {
    setSubmissionId(submission.submissionId);
    setSelectedSubmission(submission);
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    if (!POP_ATTESTATION_SERVED) {
      setError(ATTESTATION_UNAVAILABLE);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSubmitResult(null);

    try {
      const attestationData = {
        submissionId,
        validationResult: isValid,
        confidenceScore: confidence,
        notes: note || undefined,
      };

      const result = await popService.submitAttestation(attestationData);

      if (result.success) {
        setSubmitResult(result.data);
        setSubmissionId('');
        setConfidence(0.75);
        setIsValid(true);
        setNote('');
        setSelectedSubmission(null);
      } else {
        setError(result.message || 'Failed to submit validation attestation');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        Validate Environmental Data
      </h2>

      {/* Success message */}
      {submitResult && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
          <p className="font-bold">Attestation Submitted Successfully!</p>
          <p>Attestation ID: {submitResult.attestationId}</p>
          <p>Submission ID: {submitResult.submissionId}</p>
          <p>Timestamp: {new Date(submitResult.timestamp).toLocaleString()}</p>
          <p>Result: {submitResult.validationResult ? 'Valid' : 'Invalid'}</p>
          <p>Confidence: {(submitResult.confidenceScore * 100).toFixed(0)}%</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Recent Submissions List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Recent Submissions
        </h3>

        {isLoading ? (
          <div className="text-center p-4">
            <p className="text-gray-500 dark:text-gray-400">
              Loading recent submissions...
            </p>
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="text-center p-4 border rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              No recent submissions found
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {recentSubmissions.map(submission => (
                  <tr
                    key={submission.submissionId}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedSubmission?.submissionId ===
                      submission.submissionId
                        ? 'bg-blue-50 dark:bg-blue-900'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {submission.submissionId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {submission.dataType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {new Date(submission.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          submission.validationState === 'VALIDATED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : submission.validationState === 'REJECTED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {submission.validationState}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleSubmissionSelect(submission)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Submission Details */}
      {selectedSubmission && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Selected Submission Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
              <p className="text-gray-900 dark:text-gray-200">
                {selectedSubmission.submissionId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
              <p className="text-gray-900 dark:text-gray-200">
                {selectedSubmission.dataType}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Location
              </p>
              <p className="text-gray-900 dark:text-gray-200">
                {selectedSubmission.location
                  ? `Lat: ${selectedSubmission.location.latitude}, Long: ${selectedSubmission.location.longitude}`
                  : 'No location data'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Timestamp
              </p>
              <p className="text-gray-900 dark:text-gray-200">
                {new Date(selectedSubmission.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Measurements */}
          {selectedSubmission.measurements &&
            selectedSubmission.measurements.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Measurements
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {selectedSubmission.measurements.map((m, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {m.parameter}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {m.value} {m.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Submission ID */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Submission ID
          </label>
          <input
            type="text"
            name="submissionId"
            value={submissionId}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
            placeholder="Enter submission ID to validate"
          />
        </div>

        {/* Validation Result */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Is This Submission Valid?
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="isValid"
                value="true"
                checked={isValid === true}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Valid
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="isValid"
                value="false"
                checked={isValid === false}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-red-600"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">
                Invalid
              </span>
            </label>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Confidence Score: {(confidence * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            name="confidence"
            min="0"
            max="1"
            step="0.01"
            value={confidence}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
        </div>

        {/* Note */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Validation Note (Optional)
          </label>
          <textarea
            name="note"
            value={note}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Add any notes or comments about your validation decision..."
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none disabled:bg-gray-400"
            disabled={!POP_ATTESTATION_SERVED || isSubmitting || !submissionId}
            title={POP_ATTESTATION_SERVED ? undefined : ATTESTATION_UNAVAILABLE}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Validation'}
          </button>
          {!POP_ATTESTATION_SERVED && (
            <p data-testid="pop-attestation-unavailable" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {ATTESTATION_UNAVAILABLE}
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ValidationForm;
