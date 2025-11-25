import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
} from '@mui/material';
import { toast } from 'react-toastify';

const TraefikSettings: React.FC = () => {
  const [traefikPath, setTraefikPath] = useState('/etc/traefik');
  const [certDomain, setCertDomain] = useState('');

  const handleSavePath = () => {
    toast.success('Traefik path saved (Mock)');
  };

  const handleCreateCertificate = () => {
    if (!certDomain) {
      toast.error('Please enter a domain');
      return;
    }
    toast.success(`Certificate creation started for ${certDomain} (Mock)`);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Traefik Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          File System Configuration
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              label="Traefik Configuration Path"
              value={traefikPath}
              onChange={(e) => setTraefikPath(e.target.value)}
              helperText="Path to Traefik dynamic configuration files"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="contained" onClick={handleSavePath} fullWidth>
              Save Path
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Certificates
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create certificates in the Traefik directory for your domains.
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              label="Domain Name"
              placeholder="example.com"
              value={certDomain}
              onChange={(e) => setCertDomain(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button variant="contained" color="secondary" onClick={handleCreateCertificate} fullWidth>
              Create Certificate
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TraefikSettings;
