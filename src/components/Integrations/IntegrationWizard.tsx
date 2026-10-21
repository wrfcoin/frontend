import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  AlertTitle,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ContentCopy as ContentCopyIcon,
  Launch as LaunchIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Key as KeyIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  CheckBox as CheckBoxIcon,
} from '@mui/icons-material';
import { sanitizeInput } from '../../utils/security';

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  provider: string;
  setupComplexity: 'easy' | 'medium' | 'advanced';
  estimatedTime: string; // e.g., "5-10 minutes"
  prerequisites: string[];
  documentation: string;
  endpoints?: string[];
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'form' | 'validation' | 'confirmation';
  required: boolean;
  fields?: FormField[];
  validationFn?: () => Promise<ValidationResult>;
  content?: React.ReactNode;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'checkbox' | 'radio' | 'url' | 'email';
  required: boolean;
  placeholder?: string;
  helperText?: string;
  validation?: (value: any) => string | null;
  options?: { value: string; label: string }[];
  secure?: boolean; // For sensitive fields like API keys
}

interface ValidationResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

interface IntegrationWizardProps {
  integration: IntegrationConfig;
  onComplete: (config: Record<string, any>) => void;
  onCancel: () => void;
  open: boolean;
  existingConfig?: Record<string, any>;
}

const IntegrationWizardSample: React.FC<IntegrationWizardProps> = ({
  integration,
  onComplete,
  onCancel,
  open,
  existingConfig = {},
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>(existingConfig);
  const [validationResults, setValidationResults] = useState<
    Record<string, ValidationResult>
  >({});
  const [isValidating, setIsValidating] = useState(false);
  const [showSensitiveFields, setShowSensitiveFields] = useState<
    Record<string, boolean>
  >({});
  const [setupProgress, setSetupProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);

  // Generate setup steps based on integration type
  useEffect(() => {
    const generateSetupSteps = (config: IntegrationConfig): SetupStep[] => {
      const steps: SetupStep[] = [
        {
          id: 'introduction',
          title: 'Introduction',
          description: `Set up ${config.name} integration`,
          type: 'info',
          required: true,
          content: (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={config.icon} sx={{ width: 48, height: 48, mr: 2 }}>
                  <CloudIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{config.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {config.description}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Complexity
                  </Typography>
                  <Chip
                    label={config.setupComplexity}
                    color={
                      config.setupComplexity === 'easy'
                        ? 'success'
                        : config.setupComplexity === 'medium'
                          ? 'warning'
                          : 'error'
                    }
                    size="small"
                  />
                </Grid>
                <Grid size={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Est. Time
                  </Typography>
                  <Typography variant="body2">
                    {config.estimatedTime}
                  </Typography>
                </Grid>
                <Grid size={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body2">{config.category}</Typography>
                </Grid>
              </Grid>

              {config.prerequisites.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Prerequisites:
                  </Typography>
                  <List dense>
                    {config.prerequisites.map((prereq, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckBoxIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={prereq} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Alert severity="info">
                <AlertTitle>What you'll need</AlertTitle>
                This wizard will guide you through the setup process step by
                step. Have your API credentials and configuration details ready.
              </Alert>
            </Box>
          ),
        },
      ];

      // Add authentication step for most integrations
      if (config.category !== 'storage' || config.provider !== 'local') {
        steps.push({
          id: 'authentication',
          title: 'Authentication',
          description: 'Configure API credentials and authentication',
          type: 'form',
          required: true,
          fields: [
            {
              id: 'apiKey',
              label: 'API Key',
              type: 'password',
              required: true,
              placeholder: 'Enter your API key',
              helperText: 'Your API key will be securely encrypted and stored',
              secure: true,
              validation: (value: string) => {
                if (!value || value.length < 10) {
                  return 'API key must be at least 10 characters long';
                }
                return null;
              },
            },
            {
              id: 'endpoint',
              label: 'API Endpoint (Optional)',
              type: 'url',
              required: false,
              placeholder: 'https://api.example.com/v1',
              helperText: 'Leave empty to use default endpoint',
            },
          ],
        });
      }

      // Add configuration step
      steps.push({
        id: 'configuration',
        title: 'Configuration',
        description: 'Configure integration settings',
        type: 'form',
        required: true,
        fields: [
          {
            id: 'enabled',
            label: 'Enable Integration',
            type: 'checkbox',
            required: false,
          },
          {
            id: 'autoSync',
            label: 'Enable automatic synchronization',
            type: 'checkbox',
            required: false,
            helperText: 'Automatically sync data every hour',
          },
          {
            id: 'timeout',
            label: 'Request Timeout (seconds)',
            type: 'text',
            required: false,
            placeholder: '30',
            validation: (value: string) => {
              const num = parseInt(value);
              if (value && (isNaN(num) || num < 1 || num > 300)) {
                return 'Timeout must be between 1 and 300 seconds';
              }
              return null;
            },
          },
        ],
      });

      // Add validation step
      steps.push({
        id: 'validation',
        title: 'Validation',
        description: 'Test connection and validate configuration',
        type: 'validation',
        required: true,
        validationFn: async () => {
          // Simulate API validation
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            const response = await fetch('/api/integrations/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                integrationId: config.id,
                config: formData,
              }),
            });

            const result = await response.json();
            return {
              success: result.success,
              message:
                result.message ||
                (result.success
                  ? 'Connection successful!'
                  : 'Validation failed'),
              details: result.details,
            };
          } catch (error) {
            return {
              success: false,
              message:
                'Failed to validate connection. Please check your configuration.',
              details: { error: error instanceof Error ? error.message : String(error) },
            };
          }
        },
      });

      // Add confirmation step
      steps.push({
        id: 'confirmation',
        title: 'Complete Setup',
        description: 'Review and finalize your integration',
        type: 'confirmation',
        required: true,
        content: (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>Integration Ready</AlertTitle>
              Your {config.name} integration has been successfully configured
              and validated.
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              Configuration Summary:
            </Typography>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                {Object.entries(formData).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Typography>
                    <Typography variant="body2">
                      {key.toLowerCase().includes('key') ||
                      key.toLowerCase().includes('password')
                        ? '••••••••'
                        : String(value) || 'Not set'}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            <Alert severity="info">
              You can modify these settings later from the integrations
              management page.
            </Alert>
          </Box>
        ),
      });

      return steps;
    };

    if (integration) {
      setSetupSteps(generateSetupSteps(integration));
    }
  }, [integration, formData]);

  // Handle form field changes
  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [fieldId]: sanitizeInput(value),
      }));

      // Clear validation error for this field
      if (validationResults[fieldId]) {
        setValidationResults(prev => {
          const newResults = { ...prev };
          delete newResults[fieldId];
          return newResults;
        });
      }
    },
    [validationResults],
  );

  // Validate current step
  const validateStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const step = setupSteps[stepIndex];
      if (!step) return true;

      // For form steps, validate all required fields
      if (step.type === 'form' && step.fields) {
        const newValidationResults: Record<string, ValidationResult> = {};
        let isValid = true;

        for (const field of step.fields) {
          const value = formData[field.id];

          // Check required fields
          if (field.required && (!value || value === '')) {
            newValidationResults[field.id] = {
              success: false,
              message: `${field.label} is required`,
            };
            isValid = false;
            continue;
          }

          // Run custom validation
          if (field.validation && value) {
            const validationError = field.validation(value);
            if (validationError) {
              newValidationResults[field.id] = {
                success: false,
                message: validationError,
              };
              isValid = false;
            }
          }
        }

        setValidationResults(newValidationResults);
        return isValid;
      }

      // For validation steps, run the validation function
      if (step.type === 'validation' && step.validationFn) {
        setIsValidating(true);
        try {
          const result = await step.validationFn();
          setValidationResults({ [step.id]: result });
          return result.success;
        } catch (error) {
          setValidationResults({
            [step.id]: {
              success: false,
              message: 'Validation failed due to an error',
            },
          });
          return false;
        } finally {
          setIsValidating(false);
        }
      }

      return true;
    },
    [setupSteps, formData],
  );

  // Handle next step
  const handleNext = useCallback(async () => {
    const isValid = await validateStep(activeStep);

    if (isValid) {
      if (activeStep === setupSteps.length - 1) {
        // Final step - complete setup
        onComplete(formData);
      } else {
        setActiveStep(prev => prev + 1);
        setSetupProgress(((activeStep + 1) / setupSteps.length) * 100);
      }
    }
  }, [activeStep, setupSteps.length, validateStep, formData, onComplete]);

  // Handle back step
  const handleBack = useCallback(() => {
    setActiveStep(prev => prev - 1);
    setSetupProgress((activeStep / setupSteps.length) * 100);
  }, [activeStep, setupSteps.length]);

  // Toggle sensitive field visibility
  const toggleSensitiveField = useCallback((fieldId: string) => {
    setShowSensitiveFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Render form field
  const renderFormField = useCallback(
    (field: FormField) => {
      const value = formData[field.id] || '';
      const error = validationResults[field.id];
      const isError = error && !error.success;

      switch (field.type) {
      case 'text':
      case 'url':
      case 'email':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type={field.type}
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            helperText={isError ? error.message : field.helperText}
            error={isError}
            required={field.required}
            margin="normal"
          />
        );

      case 'password':
        const isVisible = showSensitiveFields[field.id];
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type={isVisible ? 'text' : 'password'}
            value={value}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            helperText={isError ? error.message : field.helperText}
            error={isError}
            required={field.required}
            margin="normal"
            InputProps={{
              endAdornment: (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                    size="small"
                    onClick={() => toggleSensitiveField(field.id)}
                  >
                      {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                    {value && (
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(value)}
                    >
                        <ContentCopyIcon />
                      </IconButton>
                  )}
                  </Box>
              ),
            }}
          />
        );

      case 'select':
        return (
          <FormControl
            key={field.id}
            fullWidth
            margin="normal"
            error={isError}
          >
              <InputLabel required={field.required}>{field.label}</InputLabel>
              <Select
              value={value}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              label={field.label}
            >
                {field.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
              ))}
              </Select>
              {(isError || field.helperText) && (
              <Typography
                variant="caption"
                color={isError ? 'error' : 'text.secondary'}
              >
                  {isError ? error.message : field.helperText}
                </Typography>
            )}
            </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={Boolean(value)}
                onChange={e => handleFieldChange(field.id, e.target.checked)}
              />
            }
            label={field.label}
            sx={{ mt: 1, mb: 1 }}
          />
        );

      case 'radio':
        return (
          <FormControl key={field.id} margin="normal" error={isError}>
              <FormLabel required={field.required}>{field.label}</FormLabel>
              <RadioGroup
              value={value}
              onChange={e => handleFieldChange(field.id, e.target.value)}
            >
                {field.options?.map(option => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
              </RadioGroup>
              {(isError || field.helperText) && (
              <Typography
                variant="caption"
                color={isError ? 'error' : 'text.secondary'}
              >
                  {isError ? error.message : field.helperText}
                </Typography>
            )}
            </FormControl>
        );

      default:
        return null;
      }
    },
    [
      formData,
      validationResults,
      showSensitiveFields,
      handleFieldChange,
      toggleSensitiveField,
      copyToClipboard,
    ],
  );

  // Render step content
  const renderStepContent = useCallback(
    (step: SetupStep) => {
      switch (step.type) {
      case 'info':
      case 'confirmation':
        return step.content;

      case 'form':
        return <Box>{step.fields?.map(renderFormField)}</Box>;

      case 'validation':
        const result = validationResults[step.id];
        return (
          <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button
                variant="contained"
                onClick={() => validateStep(activeStep)}
                disabled={isValidating}
                startIcon={
                  isValidating ? (
                    <RefreshIcon className="animate-spin" />
                  ) : (
                    <SecurityIcon />
                  )
                }
              >
                  {isValidating ? 'Validating...' : 'Test Connection'}
                </Button>
              </Box>

              {result && (
              <Alert
                severity={result.success ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                  <AlertTitle>
                    {result.success
                    ? 'Connection Successful'
                    : 'Validation Failed'}
                  </AlertTitle>
                  {result.message}
                  {result.details && (
                  <Accordion sx={{ mt: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="caption">View Details</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </AccordionDetails>
                    </Accordion>
                )}
                </Alert>
            )}

              {isValidating && <LinearProgress sx={{ mt: 2 }} />}
            </Box>
        );

      default:
        return <Typography>Unknown step type</Typography>;
      }
    },
    [validationResults, isValidating, activeStep, validateStep, renderFormField],
  );

  if (!integration) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar src={integration.icon}>
            <SettingsIcon />
          </Avatar>
          Setup {integration.name} Integration
        </Box>
        <LinearProgress variant="determinate" value={setupProgress} />
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {setupSteps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel
                error={
                  validationResults[step.id] &&
                  !validationResults[step.id].success
                }
                icon={
                  validationResults[step.id] ? (
                    validationResults[step.id].success ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )
                  ) : undefined
                }
              >
                {step.title}
              </StepLabel>
              <StepContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {step.description}
                </Typography>

                {renderStepContent(step)}

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={isValidating}
                  >
                    {index === setupSteps.length - 1
                      ? 'Complete Setup'
                      : 'Continue'}
                  </Button>

                  {index > 0 && (
                    <Button onClick={handleBack} disabled={isValidating}>
                      Back
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={isValidating}>
          Cancel
        </Button>
        {integration.documentation && (
          <Button
            startIcon={<LaunchIcon />}
            href={integration.documentation}
            target="_blank"
            rel="noopener"
          >
            Documentation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const IntegrationWizard: React.FC<React.ComponentProps<typeof IntegrationWizardSample>> = (props) => (
  <DemoSurfaceGate
    testId="integration-wizard"
    title="Integration wizard is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <IntegrationWizardSample {...props} />
  </DemoSurfaceGate>
);

export default IntegrationWizard;
