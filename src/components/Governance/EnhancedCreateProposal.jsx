import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider,
  RadioGroup,
  Radio,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  AccountBalance as GovernanceIcon,
  HowToVote as VoteIcon,
  Timeline as AnalyticsIcon,
  Security as SecurityIcon,
  Lightbulb as IdeaIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { governanceService } from '../../services/governanceService';

const PROPOSAL_TYPES = [
  {
    value: 'TEXT',
    label: 'Text Proposal',
    icon: '📝',
    description: 'General discussion or signaling proposal',
    complexity: 'Simple',
    requiredDeposit: 100,
  },
  {
    value: 'PARAMETER_CHANGE',
    label: 'Parameter Change',
    icon: '⚙️',
    description: 'Modify blockchain or protocol parameters',
    complexity: 'Medium',
    requiredDeposit: 500,
  },
  {
    value: 'PROTOCOL_UPGRADE',
    label: 'Protocol Upgrade',
    icon: '🔄',
    description: 'Upgrade protocol version or core functionality',
    complexity: 'High',
    requiredDeposit: 1000,
  },
  {
    value: 'FUNDING_PROPOSAL',
    label: 'Funding Request',
    icon: '💰',
    description: 'Request funding from treasury',
    complexity: 'Medium',
    requiredDeposit: 250,
  },
  {
    value: 'CLIMATE_INITIATIVE',
    label: 'Climate Initiative',
    icon: '🌍',
    description: 'Climate-focused project or initiative',
    complexity: 'Medium',
    requiredDeposit: 200,
  },
  {
    value: 'EMERGENCY',
    label: 'Emergency Proposal',
    icon: '🚨',
    description: 'Urgent security or network issue',
    complexity: 'High',
    requiredDeposit: 2000,
  },
];

const VOTING_PERIODS = [
  { value: 86400, label: '1 Day', description: 'Emergency proposals only' },
  { value: 259200, label: '3 Days', description: 'Fast-track proposals' },
  { value: 604800, label: '7 Days', description: 'Standard proposals' },
  { value: 1209600, label: '14 Days', description: 'Complex proposals' },
  { value: 2592000, label: '30 Days', description: 'Protocol upgrades' },
];

const PROPOSAL_TEMPLATES = {
  TEXT: {
    title: 'Community Discussion: {{topic}}',
    content: `## Summary
Brief overview of the proposal

## Background
Context and reasoning

## Proposal Details
Detailed description of what is being proposed

## Impact Analysis
Expected impact on the network and community

## Implementation
How this would be implemented (if applicable)`,
  },
  PARAMETER_CHANGE: {
    title:
      'Parameter Change: {{parameter}} from {{currentValue}} to {{newValue}}',
    content: `## Parameter Change Proposal

**Parameter:** {{parameter}}
**Current Value:** {{currentValue}}
**Proposed Value:** {{newValue}}

## Justification
Explain why this change is necessary

## Impact Analysis
- Network performance impact
- Economic impact
- Security considerations

## Implementation Timeline
Proposed timeline for implementation`,
  },
  CLIMATE_INITIATIVE: {
    title: 'Climate Initiative: {{initiativeName}}',
    content: `## Climate Initiative Proposal

**Initiative Name:** {{initiativeName}}
**Requested Funding:** {{amount}} WRF
**Duration:** {{duration}}

## Environmental Impact
Expected environmental benefits

## Technical Implementation
How this initiative will be implemented

## Success Metrics
Measurable outcomes and KPIs

## Budget Breakdown
Detailed allocation of requested funds`,
  },
};

const EnhancedCreateProposal = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposalType: 'TEXT',
    proposer: '',
    deposit: 100,
    votingPeriod: 604800,
    // Type-specific fields
    parameter: '',
    currentValue: '',
    newValue: '',
    fundingAmount: '',
    recipient: '',
    purpose: '',
    urgency: 'NORMAL',
    category: 'GENERAL',
    tags: [],
    attachments: [],
    implementationTimeline: '',
    successMetrics: '',
    riskAssessment: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [estimatedVotingPower, setEstimatedVotingPower] = useState(0);
  const [proposalTemplate, setProposalTemplate] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const steps = [
    'Basic Information',
    'Proposal Details',
    'Voting Configuration',
    'Review & Submit',
  ];

  // Update required deposit when proposal type changes
  useEffect(() => {
    const selectedType = PROPOSAL_TYPES.find(
      type => type.value === formData.proposalType,
    );
    if (selectedType) {
      setFormData(prev => ({ ...prev, deposit: selectedType.requiredDeposit }));
    }
  }, [formData.proposalType]);

  // Load template when proposal type changes
  useEffect(() => {
    const template = PROPOSAL_TEMPLATES[formData.proposalType];
    if (template) {
      setProposalTemplate(template.content);
    }
  }, [formData.proposalType]);

  const validateStep = step => {
    const errors = {};

    switch (step) {
    case 0:
      if (!formData.title.trim()) errors.title = 'Title is required';
      if (!formData.description.trim())
        errors.description = 'Description is required';
      if (!formData.proposer.trim())
        errors.proposer = 'Proposer address is required';
      break;
    case 1:
      if (formData.proposalType === 'PARAMETER_CHANGE') {
        if (!formData.parameter.trim())
          errors.parameter = 'Parameter name is required';
        if (!formData.newValue.trim())
          errors.newValue = 'New value is required';
      }
      if (formData.proposalType === 'FUNDING_PROPOSAL') {
        if (!formData.fundingAmount || formData.fundingAmount <= 0)
          errors.fundingAmount = 'Valid funding amount is required';
        if (!formData.recipient.trim())
          errors.recipient = 'Recipient address is required';
      }
      break;
    case 2:
      if (
        formData.deposit <
          PROPOSAL_TYPES.find(t => t.value === formData.proposalType)
            ?.requiredDeposit
      ) {
        errors.deposit = 'Insufficient deposit for this proposal type';
      }
      break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = tagToRemove => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const proposalData = {
        ...formData,
        submissionTimestamp: new Date().toISOString(),
        status: 'PENDING',
        votes: { for: 0, against: 0, abstain: 0 },
        votingStartTime: new Date(Date.now() + 86400000).toISOString(), // Start voting in 24 hours
        votingEndTime: new Date(
          Date.now() + 86400000 + formData.votingPeriod * 1000,
        ).toISOString(),
      };

      const response = await governanceService.createProposal(proposalData);

      // Reset form on success
      setFormData({
        title: '',
        description: '',
        proposalType: 'TEXT',
        proposer: '',
        deposit: 100,
        votingPeriod: 604800,
        parameter: '',
        currentValue: '',
        newValue: '',
        fundingAmount: '',
        recipient: '',
        purpose: '',
        urgency: 'NORMAL',
        category: 'GENERAL',
        tags: [],
        attachments: [],
        implementationTimeline: '',
        successMetrics: '',
        riskAssessment: '',
      });
      setCurrentStep(0);
    } catch (error) {
      console.error('Proposal Creation Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
    case 0:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Proposal Type</InputLabel>
                <Select
                  value={formData.proposalType}
                  onChange={e =>
                    handleInputChange('proposalType', e.target.value)
                  }
                >
                  {PROPOSAL_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <span>{type.icon}</span>
                        <Box>
                          <Typography variant="body2">
                            {type.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {type.description} • Deposit:{' '}
                            {type.requiredDeposit} WRF
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Proposal Title"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                error={!!validationErrors.title}
                helperText={validationErrors.title}
                placeholder="Enter a clear, descriptive title"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Proposal Description"
                value={formData.description}
                onChange={e =>
                  handleInputChange('description', e.target.value)
                }
                error={!!validationErrors.description}
                helperText={
                  validationErrors.description ||
                    'Provide a detailed description of your proposal'
                }
                placeholder={proposalTemplate}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Proposer Address"
                value={formData.proposer}
                onChange={e => handleInputChange('proposer', e.target.value)}
                error={!!validationErrors.proposer}
                helperText={validationErrors.proposer}
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={e =>
                    handleInputChange('category', e.target.value)
                  }
                >
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="TECHNICAL">Technical</MenuItem>
                  <MenuItem value="ECONOMIC">Economic</MenuItem>
                  <MenuItem value="GOVERNANCE">Governance</MenuItem>
                  <MenuItem value="CLIMATE">Climate</MenuItem>
                  <MenuItem value="SECURITY">Security</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addTag()}
                  placeholder="Add relevant tags to help categorize your proposal"
                />
                <Box
                  sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}
                >
                  {formData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      );

    case 1:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Proposal Details
          </Typography>

          {formData.proposalType === 'PARAMETER_CHANGE' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Parameter Name"
                  value={formData.parameter}
                  onChange={e =>
                    handleInputChange('parameter', e.target.value)
                  }
                  error={!!validationErrors.parameter}
                  helperText={validationErrors.parameter}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Current Value"
                  value={formData.currentValue}
                  onChange={e =>
                    handleInputChange('currentValue', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="New Value"
                  value={formData.newValue}
                  onChange={e =>
                    handleInputChange('newValue', e.target.value)
                  }
                  error={!!validationErrors.newValue}
                  helperText={validationErrors.newValue}
                />
              </Grid>
            </Grid>
          )}

          {formData.proposalType === 'FUNDING_PROPOSAL' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Funding Amount (WRF)"
                  type="number"
                  value={formData.fundingAmount}
                  onChange={e =>
                    handleInputChange('fundingAmount', e.target.value)
                  }
                  error={!!validationErrors.fundingAmount}
                  helperText={validationErrors.fundingAmount}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Address"
                  value={formData.recipient}
                  onChange={e =>
                    handleInputChange('recipient', e.target.value)
                  }
                  error={!!validationErrors.recipient}
                  helperText={validationErrors.recipient}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Purpose of Funding"
                  value={formData.purpose}
                  onChange={e => handleInputChange('purpose', e.target.value)}
                  placeholder="Detailed explanation of how funds will be used"
                />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Implementation Timeline"
                value={formData.implementationTimeline}
                onChange={e =>
                  handleInputChange('implementationTimeline', e.target.value)
                }
                placeholder="Describe the proposed implementation timeline and milestones"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Success Metrics"
                value={formData.successMetrics}
                onChange={e =>
                  handleInputChange('successMetrics', e.target.value)
                }
                placeholder="How will success be measured?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Risk Assessment"
                value={formData.riskAssessment}
                onChange={e =>
                  handleInputChange('riskAssessment', e.target.value)
                }
                placeholder="Identify potential risks and mitigation strategies"
              />
            </Grid>
          </Grid>
        </Box>
      );

    case 2:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Voting Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Voting Period</InputLabel>
                <Select
                  value={formData.votingPeriod}
                  onChange={e =>
                    handleInputChange('votingPeriod', e.target.value)
                  }
                >
                  {VOTING_PERIODS.map(period => (
                    <MenuItem key={period.value} value={period.value}>
                      <Box>
                        <Typography variant="body2">
                          {period.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {period.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl>
                <Typography gutterBottom>Urgency Level</Typography>
                <RadioGroup
                  value={formData.urgency}
                  onChange={e => handleInputChange('urgency', e.target.value)}
                >
                  <FormControlLabel
                    value="LOW"
                    control={<Radio />}
                    label="Low - Standard process"
                  />
                  <FormControlLabel
                    value="NORMAL"
                    control={<Radio />}
                    label="Normal - Regular timeline"
                  />
                  <FormControlLabel
                    value="HIGH"
                    control={<Radio />}
                    label="High - Expedited review"
                  />
                  <FormControlLabel
                    value="CRITICAL"
                    control={<Radio />}
                    label="Critical - Emergency vote"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                      Deposit Information
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formData.deposit} WRF
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      Required deposit for{' '}
                    {
                      PROPOSAL_TYPES.find(
                        t => t.value === formData.proposalType,
                      )?.label
                    }
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                      This deposit will be returned if the proposal receives
                      sufficient support. It will be forfeited if the proposal
                      is deemed spam or malicious.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      );

    case 3:
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
              Review & Submit
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {formData.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={
                    PROPOSAL_TYPES.find(
                      t => t.value === formData.proposalType,
                    )?.label
                  }
                  color="primary"
                />
                <Chip label={formData.category} variant="outlined" />
                <Chip
                  label={formData.urgency}
                  color={
                    formData.urgency === 'CRITICAL' ? 'error' : 'default'
                  }
                />
              </Box>
              <Typography variant="body1" paragraph>
                {formData.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Proposer</Typography>
                  <Typography variant="body2">{formData.proposer}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Voting Period</Typography>
                  <Typography variant="body2">
                    {
                      VOTING_PERIODS.find(
                        p => p.value === formData.votingPeriod,
                      )?.label
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                      Required Deposit
                  </Typography>
                  <Typography variant="body2">
                    {formData.deposit} WRF
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Category</Typography>
                  <Typography variant="body2">{formData.category}</Typography>
                </Grid>
                {formData.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Tags</Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap',
                        mt: 1,
                      }}
                    >
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
      );

    default:
      return null;
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Create Governance Proposal
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Submit a new proposal for community voting and governance
      </Typography>

      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}

      {renderStepContent()}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {currentStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={<CheckIcon />}
            >
              Submit Proposal
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isSubmitting}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default EnhancedCreateProposal;
