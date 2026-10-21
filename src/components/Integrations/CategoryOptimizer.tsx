import DemoSurfaceGate from '../common/DemoSurfaceGate';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  Menu,
  MenuList,
  Paper,
  ClickAwayListener,
  Popper,
} from '@mui/material';
import {
  Category as CategoryIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  AutoAwesome as AIIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Lightbulb as LightbulbIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreVertIcon,
  Shuffle as ShuffleIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  Star as StarIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import { sanitizeInput } from '../../utils/security';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  usageCount: number;
  lastUsed?: Date;
  status: 'connected' | 'configured' | 'unconfigured' | 'error';
  icon: string;
  provider?: string;
  setupComplexity: 'easy' | 'medium' | 'advanced';
  popularity: number;
  rating: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  integrations: Integration[];
  isCustom: boolean;
  createdAt?: Date;
  usageScore: number;
  suggestedOptimizations?: string[];
}

interface CategorySuggestion {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  confidence: number;
  reason: string;
  integrationsToMove: Integration[];
  expectedBenefit: string;
}

interface CategoryOptimizerProps {
  integrations: Integration[];
  categories: Category[];
  onCategoriesUpdate: (categories: Category[]) => void;
  onIntegrationMove: (
    integrationId: string,
    fromCategory: string,
    toCategory: string
  ) => void;
  className?: string;
}

const CategoryOptimizerSample: React.FC<CategoryOptimizerProps> = ({
  integrations,
  categories,
  onCategoriesUpdate,
  onIntegrationMove,
  className,
}) => {
  const [aiSuggestions, setAiSuggestions] = useState<CategorySuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
    icon: 'category',
    color: '#1976d2',
  });
  const [categoryMenuAnchor, setCategoryMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [draggedIntegration, setDraggedIntegration] =
    useState<Integration | null>(null);
  const [optimizationResults, setOptimizationResults] = useState<{
    score: number;
    suggestions: string[];
    improvements: Record<string, number>;
  } | null>(null);

  // Predefined category templates
  const categoryTemplates = [
    {
      name: 'AI/ML Services',
      icon: 'psychology',
      color: '#9c27b0',
      description: 'Artificial intelligence and machine learning integrations',
    },
    {
      name: 'Data Storage',
      icon: 'storage',
      color: '#ff9800',
      description: 'Data storage and persistence solutions',
    },
    {
      name: 'API Services',
      icon: 'api',
      color: '#2196f3',
      description: 'External API integrations and services',
    },
    {
      name: 'IoT Devices',
      icon: 'sensors',
      color: '#4caf50',
      description: 'Internet of Things and sensor integrations',
    },
    {
      name: 'Analytics',
      icon: 'analytics',
      color: '#f44336',
      description: 'Data analytics and reporting tools',
    },
    {
      name: 'Communication',
      icon: 'chat',
      color: '#00bcd4',
      description: 'Messaging and communication platforms',
    },
    {
      name: 'Security',
      icon: 'security',
      color: '#795548',
      description: 'Security and authentication services',
    },
    {
      name: 'Monitoring',
      icon: 'monitor_heart',
      color: '#607d8b',
      description: 'System monitoring and alerting tools',
    },
  ];

  const iconOptions = [
    'category',
    'psychology',
    'storage',
    'api',
    'sensors',
    'analytics',
    'chat',
    'security',
    'monitor_heart',
    'cloud',
    'database',
    'settings',
    'dashboard',
    'timeline',
    'group_work',
    'speed',
    'code',
    'device_hub',
  ];

  const colorOptions = [
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#d32f2f',
    '#7b1fa2',
    '#00796b',
    '#5d4037',
    '#455a64',
    '#e91e63',
    '#ff5722',
  ];

  // AI-powered category analysis
  const analyzeCategories = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      // Simulate AI analysis with realistic processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate usage patterns and suggest optimizations
      const categoryUsage = categories.map(category => {
        const totalUsage = category.integrations.reduce(
          (sum, integration) => sum + integration.usageCount,
          0,
        );
        const avgRating =
          category.integrations.reduce(
            (sum, integration) => sum + integration.rating,
            0,
          ) / (category.integrations.length || 1);

        return {
          ...category,
          totalUsage,
          avgRating,
          efficiency: totalUsage / (category.integrations.length || 1),
        };
      });

      // Generate suggestions based on usage patterns, tags, and similarity
      const suggestions: CategorySuggestion[] = [];

      // Identify orphaned integrations (categories with only 1-2 integrations)
      const orphanedCategories = categoryUsage.filter(
        cat => cat.integrations.length <= 2 && !cat.isCustom,
      );

      for (const orphanedCategory of orphanedCategories) {
        // Find similar integrations in other categories
        const similarIntegrations = integrations.filter(integration => {
          if (
            orphanedCategory.integrations.some(oi => oi.id === integration.id)
          )
            return false;

          const sharedTags = integration.tags.filter(tag =>
            orphanedCategory.integrations.some(oi => oi.tags.includes(tag)),
          );

          return (
            sharedTags.length >= 2 ||
            integration.provider === orphanedCategory.integrations[0]?.provider
          );
        });

        if (similarIntegrations.length > 0) {
          const targetCategory = categories.find(cat =>
            similarIntegrations.some(si =>
              cat.integrations.some(ci => ci.id === si.id)
            ),
          );

          if (targetCategory) {
            suggestions.push({
              id: `merge-${orphanedCategory.id}-${targetCategory.id}`,
              name: `Merge "${orphanedCategory.name}" into "${targetCategory.name}"`,
              description: `Consolidate similar integrations for better organization`,
              icon: 'group_work',
              color: targetCategory.color,
              confidence: 0.8,
              reason: `Found ${similarIntegrations.length} similar integrations with shared tags or providers`,
              integrationsToMove: orphanedCategory.integrations,
              expectedBenefit:
                'Reduced category clutter and improved discoverability',
            });
          }
        }
      }

      // Identify overloaded categories (more than 8 integrations)
      const overloadedCategories = categoryUsage.filter(
        cat => cat.integrations.length > 8,
      );

      for (const overloadedCategory of overloadedCategories) {
        // Analyze sub-patterns within the category
        const tagGroups: Record<string, Integration[]> = {};

        overloadedCategory.integrations.forEach(integration => {
          integration.tags.forEach(tag => {
            if (!tagGroups[tag]) tagGroups[tag] = [];
            tagGroups[tag].push(integration);
          });
        });

        // Find tags that could form new categories
        const significantTags = Object.entries(tagGroups)
          .filter(([tag, integrations]) => integrations.length >= 3)
          .sort(([, a], [, b]) => b.length - a.length);

        if (significantTags.length > 0) {
          const [topTag, topIntegrations] = significantTags[0];

          suggestions.push({
            id: `split-${overloadedCategory.id}-${topTag}`,
            name: `Create "${topTag.charAt(0).toUpperCase() + topTag.slice(1)}" category`,
            description: `Split from "${overloadedCategory.name}" to reduce category size`,
            icon: 'category',
            color:
              colorOptions[Math.floor(Math.random() * colorOptions.length)],
            confidence: 0.7,
            reason: `Found ${topIntegrations.length} integrations with "${topTag}" tag`,
            integrationsToMove: topIntegrations,
            expectedBenefit: 'Better organization and easier navigation',
          });
        }
      }

      // Suggest smart categories based on usage patterns
      const highUsageIntegrations = integrations
        .filter(integration => integration.usageCount > 10)
        .sort((a, b) => b.usageCount - a.usageCount);

      if (highUsageIntegrations.length >= 4) {
        suggestions.push({
          id: 'create-favorites',
          name: 'Create "Most Used" category',
          description:
            'Group your most frequently used integrations for quick access',
          icon: 'star',
          color: '#ffd700',
          confidence: 0.9,
          reason: `${highUsageIntegrations.length} integrations have high usage (>10 times)`,
          integrationsToMove: highUsageIntegrations.slice(0, 6),
          expectedBenefit: 'Faster access to frequently used integrations',
        });
      }

      setAiSuggestions(suggestions);

      // Calculate optimization score
      const totalIntegrations = integrations.length;
      const averageCategorySize = totalIntegrations / categories.length;
      const sizeVariance =
        categories.reduce(
          (sum, cat) =>
            sum + Math.pow(cat.integrations.length - averageCategorySize, 2),
          0,
        ) / categories.length;

      const organizationScore = Math.max(
        0,
        100 - (sizeVariance / averageCategorySize) * 20,
      );

      setOptimizationResults({
        score: Math.round(organizationScore),
        suggestions: suggestions.map(s => s.expectedBenefit),
        improvements: {
          'Category Balance': Math.round(100 - sizeVariance),
          'Usage Optimization': Math.round(
            categoryUsage.reduce((sum, cat) => sum + cat.efficiency, 0) /
              categoryUsage.length,
          ),
          'Tag Consistency': Math.round(
            (integrations.filter(integration => integration.tags.length > 0)
              .length /
              integrations.length) *
              100,
          ),
        },
      });
    } catch (error) {
      console.error('Failed to analyze categories:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [categories, integrations]);

  // Auto-analyze on component mount and when data changes
  useEffect(() => {
    if (integrations.length > 0 && categories.length > 0) {
      analyzeCategories();
    }
  }, [integrations.length, categories.length]);

  // Handle category creation
  const handleCreateCategory = useCallback(async () => {
    const sanitizedName = sanitizeInput(newCategoryData.name);
    const sanitizedDescription = sanitizeInput(newCategoryData.description);

    if (!sanitizedName.trim()) return;

    const newCategory: Category = {
      id: `custom-${Date.now()}`,
      name: sanitizedName,
      description: sanitizedDescription,
      icon: newCategoryData.icon,
      color: newCategoryData.color,
      integrations: [],
      isCustom: true,
      createdAt: new Date(),
      usageScore: 0,
    };

    const updatedCategories = [...categories, newCategory];
    onCategoriesUpdate(updatedCategories);

    setShowNewCategoryDialog(false);
    setNewCategoryData({
      name: '',
      description: '',
      icon: 'category',
      color: '#1976d2',
    });
  }, [newCategoryData, categories, onCategoriesUpdate]);

  // Handle category editing
  const handleEditCategory = useCallback(() => {
    if (!selectedCategory) return;

    const updatedCategories = categories.map(category =>
      category.id === selectedCategory.id
        ? {
          ...category,
          name: sanitizeInput(newCategoryData.name),
          description: sanitizeInput(newCategoryData.description),
          icon: newCategoryData.icon,
          color: newCategoryData.color,
        }
        : category,
    );

    onCategoriesUpdate(updatedCategories);
    setShowEditDialog(false);
    setSelectedCategory(null);
    setNewCategoryData({
      name: '',
      description: '',
      icon: 'category',
      color: '#1976d2',
    });
  }, [selectedCategory, newCategoryData, categories, onCategoriesUpdate]);

  // Handle category deletion
  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      const categoryToDelete = categories.find(cat => cat.id === categoryId);
      if (!categoryToDelete || !categoryToDelete.isCustom) return;

      // Move integrations to "Uncategorized" or first available category
      const defaultCategory =
        categories.find(cat => cat.id !== categoryId) || categories[0];

      categoryToDelete.integrations.forEach(integration => {
        onIntegrationMove(integration.id, categoryId, defaultCategory.id);
      });

      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      onCategoriesUpdate(updatedCategories);
      setCategoryMenuAnchor(null);
    },
    [categories, onCategoriesUpdate, onIntegrationMove],
  );

  // Apply AI suggestion
  const applySuggestion = useCallback(
    async (suggestion: CategorySuggestion) => {
      if (suggestion.id.startsWith('merge-')) {
        // Handle merge suggestion
        const [, fromCategoryId, toCategoryId] = suggestion.id.split('-');
        suggestion.integrationsToMove.forEach(integration => {
          onIntegrationMove(integration.id, fromCategoryId, toCategoryId);
        });
      } else if (suggestion.id.startsWith('split-')) {
        // Handle split suggestion - create new category
        const newCategory: Category = {
          id: `split-${Date.now()}`,
          name: suggestion.name
            .replace('Create "', '')
            .replace('" category', ''),
          description: suggestion.description,
          icon: suggestion.icon,
          color: suggestion.color,
          integrations: [],
          isCustom: true,
          createdAt: new Date(),
          usageScore: 0,
        };

        const updatedCategories = [...categories, newCategory];
        onCategoriesUpdate(updatedCategories);

        // Move integrations to new category
        suggestion.integrationsToMove.forEach(integration => {
          onIntegrationMove(
            integration.id,
            integration.category,
            newCategory.id,
          );
        });
      } else if (suggestion.id === 'create-favorites') {
        // Create favorites category
        const favoritesCategory: Category = {
          id: 'favorites',
          name: 'Most Used',
          description: 'Your most frequently used integrations',
          icon: 'star',
          color: '#ffd700',
          integrations: [],
          isCustom: true,
          createdAt: new Date(),
          usageScore: 0,
        };

        const updatedCategories = [...categories, favoritesCategory];
        onCategoriesUpdate(updatedCategories);
      }

      // Remove applied suggestion
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    },
    [categories, onCategoriesUpdate, onIntegrationMove],
  );

  // Handle drag and drop
  const handleDragStart = useCallback((integration: Integration) => {
    setDraggedIntegration(integration);
  }, []);

  const handleDrop = useCallback(
    (targetCategoryId: string) => {
      if (draggedIntegration) {
        onIntegrationMove(
          draggedIntegration.id,
          draggedIntegration.category,
          targetCategoryId,
        );
        setDraggedIntegration(null);
      }
    },
    [draggedIntegration, onIntegrationMove],
  );

  // Open edit dialog
  const openEditDialog = useCallback((category: Category) => {
    setSelectedCategory(category);
    setNewCategoryData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
    });
    setShowEditDialog(true);
  }, []);

  const categoryDistributionScore = useMemo(() => {
    if (categories.length === 0) return 0;

    const avgSize = integrations.length / categories.length;
    const variance =
      categories.reduce(
        (sum, cat) => sum + Math.pow(cat.integrations.length - avgSize, 2),
        0,
      ) / categories.length;

    return Math.max(0, 100 - (variance / avgSize) * 30);
  }, [categories, integrations]);

  return (
    <Box className={className}>
      {/* Optimization Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <PsychologyIcon />
              Category Optimization
            </Typography>
            <Button
              variant="outlined"
              startIcon={
                isAnalyzing ? (
                  <CloudSyncIcon className="animate-spin" />
                ) : (
                  <AIIcon />
                )
              }
              onClick={analyzeCategories}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          </Box>

          {optimizationResults && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {optimizationResults.score}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Organization Score
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 9 }}>
                <Grid container spacing={1}>
                  {Object.entries(optimizationResults.improvements).map(
                    ([metric, score]) => (
                      <Grid size={{ xs: 12, sm: 4 }} key={metric}>
                        <Typography variant="caption" display="block">
                          {metric}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={score}
                          sx={{ height: 6, borderRadius: 3 }}
                          color={
                            score > 80
                              ? 'success'
                              : score > 60
                                ? 'warning'
                                : 'error'
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {score}%
                        </Typography>
                      </Grid>
                    ),
                  )}
                </Grid>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LightbulbIcon />
              AI Suggestions
            </Typography>

            <Grid container spacing={2}>
              {aiSuggestions.map(suggestion => (
                <Grid size={12} key={suggestion.id}>
                  <Alert
                    severity="info"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Apply
                      </Button>
                    }
                  >
                    <AlertTitle>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {suggestion.name}
                        <Chip
                          label={`${Math.round(suggestion.confidence * 100)}% confidence`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </AlertTitle>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {suggestion.description}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Reason: {suggestion.reason}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expected benefit: {suggestion.expectedBenefit}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Category Management */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Categories</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewCategoryDialog(true)}
            >
              Add Category
            </Button>
          </Box>

          <Grid container spacing={2}>
            {categories.map(category => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: category.color,
                    borderWidth: 2,
                    position: 'relative',
                    minHeight: 200,
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(category.id)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: category.color,
                            width: 32,
                            height: 32,
                          }}
                        >
                          <CategoryIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {category.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {category.integrations.length} integrations
                          </Typography>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={e => {
                          setCategoryMenuAnchor(e.currentTarget);
                          setSelectedCategory(category);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {category.description}
                    </Typography>

                    <Box sx={{ maxHeight: 120, overflow: 'hidden' }}>
                      <Grid container spacing={0.5}>
                        {category.integrations.slice(0, 6).map(integration => (
                          <Grid key={integration.id}>
                            <Tooltip title={integration.name}>
                              <Avatar
                                src={integration.icon}
                                sx={{ width: 24, height: 24, cursor: 'grab' }}
                                draggable
                                onDragStart={() => handleDragStart(integration)}
                              >
                                <CloudSyncIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                            </Tooltip>
                          </Grid>
                        ))}
                        {category.integrations.length > 6 && (
                          <Chip
                            label={`+${category.integrations.length - 6}`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Grid>
                    </Box>

                    {category.isCustom && (
                      <Chip
                        label="Custom"
                        size="small"
                        color="secondary"
                        variant="outlined"
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Category Context Menu */}
      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={() => setCategoryMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (selectedCategory) openEditDialog(selectedCategory);
            setCategoryMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          Edit Category
        </MenuItem>
        {selectedCategory?.isCustom && (
          <MenuItem
            onClick={() => {
              if (selectedCategory) handleDeleteCategory(selectedCategory.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            Delete Category
          </MenuItem>
        )}
      </Menu>

      {/* New Category Dialog */}
      <Dialog
        open={showNewCategoryDialog}
        onClose={() => setShowNewCategoryDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategoryData.name}
            onChange={e =>
              setNewCategoryData(prev => ({ ...prev, name: e.target.value }))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={newCategoryData.description}
            onChange={e =>
              setNewCategoryData(prev => ({
                ...prev,
                description: e.target.value,
              }))
            }
            margin="normal"
            multiline
            rows={2}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Icon</InputLabel>
            <Select
              value={newCategoryData.icon}
              onChange={e =>
                setNewCategoryData(prev => ({ ...prev, icon: e.target.value }))
              }
              label="Icon"
            >
              {iconOptions.map(icon => (
                <MenuItem key={icon} value={icon}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon />
                    {icon}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {colorOptions.map(color => (
                <Box
                  key={color}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border:
                      newCategoryData.color === color
                        ? '3px solid #000'
                        : '1px solid #ccc',
                  }}
                  onClick={() =>
                    setNewCategoryData(prev => ({ ...prev, color }))
                  }
                />
              ))}
            </Box>
          </Box>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Use Template</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                {categoryTemplates.map(template => (
                  <Grid size={6} key={template.name}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        setNewCategoryData({
                          name: template.name,
                          description: template.description,
                          icon: template.icon,
                          color: template.color,
                        })
                      }
                      sx={{ textAlign: 'left' }}
                    >
                      {template.name}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewCategoryDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateCategory}
            variant="contained"
            disabled={!newCategoryData.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategoryData.name}
            onChange={e =>
              setNewCategoryData(prev => ({ ...prev, name: e.target.value }))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={newCategoryData.description}
            onChange={e =>
              setNewCategoryData(prev => ({
                ...prev,
                description: e.target.value,
              }))
            }
            margin="normal"
            multiline
            rows={2}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Icon</InputLabel>
            <Select
              value={newCategoryData.icon}
              onChange={e =>
                setNewCategoryData(prev => ({ ...prev, icon: e.target.value }))
              }
              label="Icon"
            >
              {iconOptions.map(icon => (
                <MenuItem key={icon} value={icon}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon />
                    {icon}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {colorOptions.map(color => (
                <Box
                  key={color}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: color,
                    borderRadius: 1,
                    cursor: 'pointer',
                    border:
                      newCategoryData.color === color
                        ? '3px solid #000'
                        : '1px solid #ccc',
                  }}
                  onClick={() =>
                    setNewCategoryData(prev => ({ ...prev, color }))
                  }
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleEditCategory}
            variant="contained"
            disabled={!newCategoryData.name.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const CategoryOptimizer: React.FC<React.ComponentProps<typeof CategoryOptimizerSample>> = (props) => (
  <DemoSurfaceGate
    testId="category-optimizer"
    title="Category optimizer is not live on this testnet"
    description="This preview contains illustrative data or simulated actions, not verified testnet results."
  >
    <CategoryOptimizerSample {...props} />
  </DemoSurfaceGate>
);

export default CategoryOptimizer;
