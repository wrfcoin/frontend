import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { governanceService } from '../../services/governanceService';
import { PROPOSAL_TEMPLATES } from './ProposalTemplate';

/**
 * Create Proposal Component
 * Form for creating a new governance proposal
 */
const CreateProposal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposalType: 'Text',
    proposer: '',
    deposit: 100,
    votingPeriod: 604800, // 7 days in seconds
    // Content fields for different proposal types
    parameter: '',
    value: '',
    version: '',
    codeHash: '',
    activationHeight: '',
    recipient: '',
    amount: '',
    purpose: '',
    content: '',
  });

  // Process URL parameters for templates
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('template');
    const exampleId = queryParams.get('example');

    if (templateId) {
      // Find template by ID
      const template = PROPOSAL_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        // Convert template type to form type
        let proposalType = 'Text';
        switch (template.id) {
        case 'parameter-change':
          proposalType = 'ParameterChange';
          break;
        case 'protocol-upgrade':
        case 'network-upgrade':
          proposalType = 'ProtocolUpgrade';
          break;
        case 'funding-request':
          proposalType = 'FundingProposal';
          break;
        }

        // Set proposal type from template
        setFormData(prev => ({
          ...prev,
          proposalType,
          title: exampleId ? template.example.title : '',
          description: exampleId ? template.example.description : '',
        }));

        // If example ID is provided, populate with example data
        if (exampleId && template.example) {
          const example = template.example;

          // Populate type-specific fields based on example data
          switch (template.id) {
          case 'parameter-change':
            setFormData(prev => ({
              ...prev,
              parameter: example.parameterName || '',
              value: example.newValue || '',
            }));
            break;
          case 'protocol-upgrade':
          case 'network-upgrade':
            setFormData(prev => ({
              ...prev,
              version: example.version || '',
              codeHash: 'auto-generated',
              activationHeight: '0',
            }));
            break;
          case 'funding-request':
            setFormData(prev => ({
              ...prev,
              recipient: 'recipient-address',
              amount: example.requestAmount?.toString() || '0',
              purpose: example.projectDescription || '',
            }));
            break;
          case 'text-proposal':
            setFormData(prev => ({
              ...prev,
              content: [
                example.summary,
                example.problemStatement,
                example.proposedSolution,
                example.benefits,
                example.drawbacks,
              ]
                .filter(Boolean)
                .join('\n\n'),
            }));
            break;
          }
        }
      }
    }
  }, [location.search]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Required fields for all proposal types
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.proposer.trim())
      newErrors.proposer = 'Proposer address is required';

    // Type-specific validation
    switch (formData.proposalType) {
    case 'ParameterChange':
      if (!formData.parameter.trim())
        newErrors.parameter = 'Parameter name is required';
      if (!formData.value.trim())
        newErrors.value = 'Parameter value is required';
      break;

    case 'ProtocolUpgrade':
      if (!formData.version.trim()) newErrors.version = 'Version is required';
      if (!formData.codeHash.trim())
        newErrors.codeHash = 'Code hash is required';
      if (!formData.activationHeight.trim())
        newErrors.activationHeight = 'Activation height is required';
      break;

    case 'FundingProposal':
      if (!formData.recipient.trim())
        newErrors.recipient = 'Recipient address is required';
      if (!formData.amount.trim()) newErrors.amount = 'Amount is required';
      if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
      break;

    case 'Text':
      if (!formData.content.trim()) newErrors.content = 'Content is required';
      break;
    }

    return newErrors;
  };

  // Prepare proposal content based on type
  const prepareProposalContent = () => {
    switch (formData.proposalType) {
    case 'ParameterChange':
      return {
        parameter: formData.parameter,
        value: formData.value,
      };

    case 'ProtocolUpgrade':
      return {
        version: formData.version,
        codeHash: formData.codeHash,
        activationHeight: parseInt(formData.activationHeight),
      };

    case 'FundingProposal':
      return {
        recipient: formData.recipient,
        amount: parseInt(formData.amount),
        purpose: formData.purpose,
      };

    case 'Text':
      return {
        content: formData.content,
      };

    default:
      return {};
    }
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const proposalData = {
        proposer: formData.proposer,
        title: formData.title,
        description: formData.description,
        proposalType: formData.proposalType,
        content: prepareProposalContent(),
        votingPeriod: parseInt(formData.votingPeriod),
        deposit: parseInt(formData.deposit),
      };

      const createdProposal =
        await governanceService.createProposal(proposalData);

      // Redirect to the proposal detail page
      navigate(`/governance/proposals/${createdProposal.proposalId}`);
    } catch (err) {
      console.error('Error creating proposal:', err);
      setSubmitError(
        err.message || 'Failed to create proposal. Please try again.',
      );
      setIsSubmitting(false);
    }
  };

  // Render different content forms based on proposal type
  const renderProposalTypeContent = () => {
    switch (formData.proposalType) {
    case 'ParameterChange':
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Parameter Name *
            </label>
            <input
              type="text"
              name="parameter"
              value={formData.parameter}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.parameter ? 'border-red-500' : ''
              }`}
              placeholder="e.g., quorum_percentage"
            />
            {errors.parameter && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.parameter}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Parameter Value *
            </label>
            <input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.value ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 33"
            />
            {errors.value && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.value}
              </p>
            )}
          </div>
        </>
      );

    case 'ProtocolUpgrade':
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                New Version *
            </label>
            <input
              type="text"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.version ? 'border-red-500' : ''
              }`}
              placeholder="e.g., v1.2.0"
            />
            {errors.version && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.version}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Code Hash *
            </label>
            <input
              type="text"
              name="codeHash"
              value={formData.codeHash}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.codeHash ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 0x1234..."
            />
            {errors.codeHash && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.codeHash}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Activation Block Height *
            </label>
            <input
              type="number"
              name="activationHeight"
              value={formData.activationHeight}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.activationHeight ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 1000000"
              min="0"
            />
            {errors.activationHeight && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.activationHeight}
              </p>
            )}
          </div>
        </>
      );

    case 'FundingProposal':
      return (
        <>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Recipient Address *
            </label>
            <input
              type="text"
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.recipient ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 0x1234..."
            />
            {errors.recipient && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.recipient}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Amount (WRF) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.amount ? 'border-red-500' : ''
              }`}
              placeholder="e.g., 1000"
              min="0"
            />
            {errors.amount && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.amount}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
                Purpose *
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.purpose ? 'border-red-500' : ''
              }`}
              placeholder="Explain the purpose of this funding request..."
              rows="4"
            ></textarea>
            {errors.purpose && (
              <p className="text-red-500 text-xs italic mt-1">
                {errors.purpose}
              </p>
            )}
          </div>
        </>
      );

    case 'Text':
      return (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
              Proposal Content *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.content ? 'border-red-500' : ''
            }`}
            placeholder="Enter your proposal content here..."
            rows="8"
          ></textarea>
          {errors.content && (
            <p className="text-red-500 text-xs italic mt-1">
              {errors.content}
            </p>
          )}
        </div>
      );

    default:
      return null;
    }
  };

  // Add state to track the selected template
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Function to handle clicking a template
  const handleSelectTemplate = template => {
    setSelectedTemplate(template);

    // Update form type based on template
    let proposalType = 'Text';
    switch (template.id) {
    case 'parameter-change':
      proposalType = 'ParameterChange';
      break;
    case 'protocol-upgrade':
    case 'network-upgrade':
      proposalType = 'ProtocolUpgrade';
      break;
    case 'funding-request':
      proposalType = 'FundingProposal';
      break;
    }

    // Update form data with template info
    setFormData(prev => ({
      ...prev,
      proposalType,
      title: '',
      description: '',
    }));
  };

  // Check if URL has parameters
  const queryParams = new URLSearchParams(location.search);
  const hasTemplateParam = queryParams.has('template');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/governance')}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back to Governance Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Create New Proposal</h1>

          {/* Template selector */}
          {!hasTemplateParam && !selectedTemplate && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
              <p className="text-gray-600 mb-4">
                Select a template to help you create a well-structured proposal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROPOSAL_TEMPLATES.map(template => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{template.icon}</span>
                      <h3 className="font-medium">{template.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-right">
                <button
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedTemplate('skip')}
                >
                  Skip and create a custom proposal
                </button>
              </div>
            </div>
          )}

          {/* Show template info if selected */}
          {selectedTemplate && selectedTemplate !== 'skip' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">{selectedTemplate.icon}</span>
                <h3 className="font-medium">
                  Using {selectedTemplate.title} Template
                </h3>
              </div>
              <p className="text-gray-600 mb-3">
                {selectedTemplate.description}
              </p>

              <div className="text-sm">
                <p className="font-medium mb-1">Recommended fields:</p>
                <ul className="list-disc list-inside text-gray-600">
                  {selectedTemplate.fields
                    .filter(f => f.required)
                    .map((field, index) => (
                      <li key={index}>{field.label}</li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Proposal Type *
              </label>
              <select
                name="proposalType"
                value={formData.proposalType}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="Text">Text Proposal</option>
                <option value="ParameterChange">Parameter Change</option>
                <option value="ProtocolUpgrade">Protocol Upgrade</option>
                <option value="FundingProposal">Funding Request</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.title ? 'border-red-500' : ''
                }`}
                placeholder="Enter a title for your proposal"
              />
              {errors.title && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.description ? 'border-red-500' : ''
                }`}
                placeholder="Provide a detailed description of your proposal"
                rows="4"
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Your Wallet Address (Proposer) *
              </label>
              <input
                type="text"
                name="proposer"
                value={formData.proposer}
                onChange={handleChange}
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  errors.proposer ? 'border-red-500' : ''
                }`}
                placeholder="Enter your wallet address"
              />
              {errors.proposer && (
                <p className="text-red-500 text-xs italic mt-1">
                  {errors.proposer}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Deposit (WRF) *
                </label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum deposit is required to submit a proposal
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Voting Period (seconds) *
                </label>
                <select
                  name="votingPeriod"
                  value={formData.votingPeriod}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="86400">1 day (86400 seconds)</option>
                  <option value="259200">3 days (259200 seconds)</option>
                  <option value="604800">7 days (604800 seconds)</option>
                  <option value="1209600">14 days (1209600 seconds)</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Proposal Content</h2>
              {renderProposalTypeContent()}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/governance')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Create Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProposal;
