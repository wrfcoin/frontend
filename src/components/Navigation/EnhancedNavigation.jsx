import React from 'react';
import { Link, useLocation } from 'react-router';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as NFTIcon,
  Nature as EnvironmentalIcon,
  HowToVote as GovernanceIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const EnhancedNavigation = ({ open, onClose }) => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/nft/create',
      label: 'Create NFT (Enhanced)',
      icon: <NFTIcon />,
      description: 'Multi-step NFT creation wizard',
      badge: 'NEW',
    },
    {
      path: '/environmental/submit',
      label: 'Submit Environmental Data (Enhanced)',
      icon: <EnvironmentalIcon />,
      description: 'Quality scoring & real-time validation',
      badge: 'NEW',
    },
    {
      path: '/governance/proposals/new',
      label: 'Create Proposal (Enhanced)',
      icon: <GovernanceIcon />,
      description: 'Step-by-step proposal creation',
      badge: 'NEW',
    },
    {
      path: '/nft/create/basic',
      label: 'Create NFT (Basic)',
      icon: <NFTIcon />,
      description: 'Original NFT creation form',
    },
    {
      path: '/environmental/submit/basic',
      label: 'Submit Environmental Data (Basic)',
      icon: <EnvironmentalIcon />,
      description: 'Original environmental data form',
    },
    {
      path: '/governance/proposals/new/basic',
      label: 'Create Proposal (Basic)',
      icon: <GovernanceIcon />,
      description: 'Original proposal creation form',
    },
  ];

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Enhanced Interface Components
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Critical Priority Frontend Interface Completions
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <List>
          {navigationItems.map(item => (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ListItemText primary={item.label} />
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default EnhancedNavigation;
