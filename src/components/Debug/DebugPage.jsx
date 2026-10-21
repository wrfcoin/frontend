import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import ConnectionStatus from './ConnectionStatus';
import { devLog } from '../../utils/logger';

/**
 * DebugPage Component
 * A dedicated page for debugging application and connection issues
 */
const DebugPage = () => {
  return (
    <div className="debug-page">
      <Typography variant="h4" sx={{ mb: 4 }}>System Diagnostics</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ConnectionStatus />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title={<Typography variant="h6">Debug Tools</Typography>} />
            <CardContent>
              <List disablePadding>
                <ListItemButton
                  onClick={() => window.localStorage.clear()}
                  divider
                >
                  <ListItemText primary="Clear LocalStorage" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => window.location.reload(true)}
                  divider
                >
                  <ListItemText primary="Force Page Reload" />
                </ListItemButton>
                <ListItemButton
                  onClick={() => devLog('Application State:', window._wsClient)}
                >
                  <ListItemText primary="Log WebSocket State to Console" />
                </ListItemButton>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 4 }}>
            <CardHeader title={<Typography variant="h6">Environment Information</Typography>} />
            <CardContent>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Browser</TableCell>
                    <TableCell>{navigator.userAgent}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Protocol</TableCell>
                    <TableCell>{window.location.protocol}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Host</TableCell>
                    <TableCell>{window.location.host}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>Language</TableCell>
                    <TableCell>{navigator.language}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default DebugPage;
