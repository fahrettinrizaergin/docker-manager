import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Stack,
} from '@mui/material';
import {
  RestartAlt as RestartIcon,
  Terminal as TerminalIcon,
  Description as LogsIcon,
  CleaningServices as CleaningIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const SystemSettings: React.FC = () => {
  const handleAction = (action: string) => {
    toast.info(`Action triggered: ${action} (Mock)`);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Web Server Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RestartIcon />}
              onClick={() => handleAction('Reload Web Server')}
            >
              Reload Server
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<TerminalIcon />}
              onClick={() => handleAction('Open Terminal')}
            >
              Terminal
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<LogsIcon />}
              onClick={() => handleAction('View Logs')}
            >
              View Logs
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestartIcon />}
              onClick={() => handleAction('Clean & Reload Redis')}
            >
              Clean & Reload Redis
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Space Actions
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Clean up unused resources to free up space.
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => handleAction('Clean Unused Images')}
          >
            Clean Unused Images
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => handleAction('Clean Unused Volumes')}
          >
            Clean Unused Volumes
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => handleAction('Clean Stopped Containers')}
          >
            Clean Stopped Containers
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => handleAction('Clean Builder & System')}
          >
            Clean Builder & System
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => handleAction('Clean Monitoring')}
          >
            Clean Monitoring
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<CleaningIcon />}
            onClick={() => handleAction('Clean All')}
          >
            Clean All
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SystemSettings;
