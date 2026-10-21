import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import {
  DEFAULT_MODULES,
  DEFAULT_CATEGORIES,
  DEFAULT_PROFILES,
} from './defaultModuleData';

/**
 * Module Controller component for enabling/disabling system modules
 */
const ModuleController = () => {
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDependenciesDialog, setShowDependenciesDialog] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [dependencyList, setDependencyList] = useState([]);
  const [dependentList, setDependentList] = useState([]);
  const [restartInProgress, setRestartInProgress] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [currentProfile, setCurrentProfile] = useState('custom');

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch module statuses
        const moduleResponse = await axios.get('/api/modules');

        // Fetch workflow categories
        const categoriesResponse = await axios.get('/api/modules/categories');

        // Fetch configuration profiles
        const profilesResponse = await axios.get('/api/modules/profiles');

        setModules(moduleResponse.data.data || []);
        setCategories(categoriesResponse.data.data || []);
        setProfiles(profilesResponse.data.data || []);

        setLoading(false);
      } catch (err) {
        console.error('Error loading module data:', err);
        setModules(DEFAULT_MODULES);
        setCategories(DEFAULT_CATEGORIES);
        setProfiles(DEFAULT_PROFILES);
        setIsOffline(true);
        setError('Using offline module data. Live status unavailable.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle a module's enabled state
  const toggleModule = async (moduleName, currentState) => {
    try {
      if (currentState) {
        // If currently enabled, disable it
        await axios.post(`/api/modules/${moduleName}/disable`);
      } else {
        // If currently disabled, enable it
        await axios.post(`/api/modules/${moduleName}/enable`);
      }

      // Refresh the module list after toggling
      const response = await axios.get('/api/modules');
      setModules(response.data.data || []);
    } catch (err) {
      console.error(`Error toggling module ${moduleName}:`, err);
      setError(
        `Failed to ${currentState ? 'disable' : 'enable'} module ${moduleName}.`,
      );
    }
  };

  // Toggle a category's enabled state
  const toggleCategory = async (categoryName, currentState) => {
    try {
      if (currentState) {
        // If currently enabled, disable it
        await axios.post(`/api/modules/categories/${categoryName}/disable`);
      } else {
        // If currently enabled, disable it
        await axios.post(`/api/modules/categories/${categoryName}/enable`);
      }

      // Refresh the category list after toggling
      const response = await axios.get('/api/modules/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.error(`Error toggling category ${categoryName}:`, err);
      setError(
        `Failed to ${currentState ? 'disable' : 'enable'} category ${categoryName}.`,
      );
    }
  };

  // Show module dependencies dialog
  const showDependencies = async moduleName => {
    try {
      // In a real implementation, we would fetch dependencies from the API
      // For now, we'll simulate it with dummy data
      const response = await axios.get(
        `/api/modules/${moduleName}/dependencies`,
      );

      setSelectedModule(moduleName);
      setDependencyList(response.data.dependencies || []);
      setDependentList(response.data.dependents || []);
      setShowDependenciesDialog(true);
    } catch (err) {
      console.error(
        `Error fetching dependencies for module ${moduleName}:`,
        err,
      );
      // Fallback to showing the dialog with empty lists
      setSelectedModule(moduleName);
      setDependencyList([]);
      setDependentList([]);
      setShowDependenciesDialog(true);
    }
  };

  // Restart all workflows based on current configuration
  const restartWorkflows = async () => {
    try {
      setRestartInProgress(true);
      await axios.post('/api/modules/restart');

      // Wait a bit for workflows to restart
      setTimeout(() => {
        setRestartInProgress(false);
      }, 3000);
    } catch (err) {
      console.error('Error restarting workflows:', err);
      setError('Failed to restart workflows. Please try again later.');
      setRestartInProgress(false);
    }
  };

  // Load a configuration profile
  const loadProfile = async profileName => {
    try {
      await axios.post(`/api/modules/profiles/${profileName}`);

      // Refresh data after loading profile
      const moduleResponse = await axios.get('/api/modules');
      const categoriesResponse = await axios.get('/api/modules/categories');

      setModules(moduleResponse.data.data || []);
      setCategories(categoriesResponse.data.data || []);
      setCurrentProfile(profileName);

      // Restart workflows to apply the changes
      await restartWorkflows();
    } catch (err) {
      console.error(`Error loading profile ${profileName}:`, err);
      setError(`Failed to load profile ${profileName}.`);
    }
  };

  // Save current configuration as a profile
  const saveCurrentAsProfile = async (profileName, description) => {
    try {
      await axios.post('/api/modules/profiles', {
        name: profileName,
        description:
          description ||
          `Configuration saved on ${new Date().toLocaleString()}`,
      });

      // Refresh profiles list
      const response = await axios.get('/api/modules/profiles');
      setProfiles(response.data.data || []);
      setCurrentProfile(profileName);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save configuration profile.');
    }
  };

  // Handle profile selection change
  const handleProfileChange = event => {
    const profileName = event.target.value;
    if (profileName !== 'custom') {
      loadProfile(profileName);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Module Controller
      </Typography>

      <Typography variant="body1" paragraph>
        Control which components of the Wrfcoin Core system are active. Enable
        or disable modules to optimize performance and resources.
      </Typography>

      {error && (
        <Alert
          severity={isOffline ? 'warning' : 'error'}
          sx={{ mb: 3 }}
          onClose={isOffline ? undefined : () => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Profile selection */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="profile-select-label">
                Configuration Profile
              </InputLabel>
              <Select
                labelId="profile-select-label"
                id="profile-select"
                value={currentProfile}
                label="Configuration Profile"
                onChange={handleProfileChange}
                disabled={isOffline}
              >
                <MenuItem value="custom">Custom Configuration</MenuItem>
                {profiles.map(profile => (
                  <MenuItem key={profile.name} value={profile.name}>
                    {profile.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={8}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() =>
                saveCurrentAsProfile(
                  `custom_${new Date().getTime()}`,
                  'Custom configuration',
                )
              }
              sx={{ mr: 2 }}
              disabled={isOffline}
            >
              Save Current Configuration
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={restartWorkflows}
              disabled={restartInProgress || isOffline}
            >
              {restartInProgress ? 'Restarting...' : 'Apply Changes'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Module Categories */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Module Categories
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {categories.map(category => (
          <Grid item xs={12} sm={6} md={4} key={category.name}>
            <Card variant="outlined">
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" component="div">
                    {category.name}
                  </Typography>
                  <Switch
                    checked={
                      category.status === 'active' ||
                      category.status === 'partial'
                    }
                    onChange={() =>
                      toggleCategory(
                        category.name,
                        category.status === 'active' ||
                          category.status === 'partial',
                      )
                    }
                    color="primary"
                    disabled={isOffline}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {category.enabledCount} of {category.totalCount} components
                  enabled
                </Typography>
                <Chip
                  label={category.status}
                  color={
                    category.status === 'active'
                      ? 'success'
                      : category.status === 'partial'
                        ? 'warning'
                        : 'error'
                  }
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Individual Modules */}
      <Typography variant="h6" gutterBottom>
        Individual Modules
      </Typography>

      <Grid container spacing={3}>
        {modules.map(module => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={module.name}>
            <Card variant="outlined">
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" component="div">
                    {module.name}
                  </Typography>
                  <Switch
                    checked={module.enabled}
                    onChange={() => toggleModule(module.name, module.enabled)}
                    color="primary"
                    disabled={isOffline}
                  />
                </Box>
                <Box display="flex" mt={2}>
                  <Button
                    size="small"
                    onClick={() => showDependencies(module.name)}
                    color="info"
                    disabled={isOffline}
                  >
                    Dependencies
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dependencies Dialog */}
      <Dialog
        open={showDependenciesDialog}
        onClose={() => setShowDependenciesDialog(false)}
      >
        <DialogTitle>{`Dependencies for ${selectedModule}`}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1">This module depends on:</Typography>
          <List>
            {dependencyList.length > 0 ? (
              dependencyList.map(dep => (
                <ListItem key={dep}>
                  <ListItemText primary={dep} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No dependencies" />
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1">
            Modules that depend on this:
          </Typography>
          <List>
            {dependentList.length > 0 ? (
              dependentList.map(dep => (
                <ListItem key={dep}>
                  <ListItemText primary={dep} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No dependent modules" />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDependenciesDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleController;
