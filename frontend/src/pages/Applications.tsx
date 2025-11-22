import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import Layout from '../components/Layout';

const Applications: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <AppsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Applications
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Applications management - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Applications;
