import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import Layout from '../components/Layout';

const Organizations: React.FC = () => {
  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Organizations
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography>Organizations management - Coming soon</Typography>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Organizations;
