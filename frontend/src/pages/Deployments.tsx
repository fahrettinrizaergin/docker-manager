import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import Layout from '../components/Layout';

const Deployments: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <CloudQueueIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Deployments
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Deployments management - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Deployments;
