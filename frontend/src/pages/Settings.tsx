import React, { useState } from 'react';
import { Container, Typography, Paper, Box, Tabs, Tab, Divider } from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Dns as DnsIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import NotificationsSettings from '../components/settings/NotificationsSettings';
import TraefikSettings from '../components/settings/TraefikSettings';
import SystemSettings from '../components/settings/SystemSettings';
import AccountSettings from '../components/settings/AccountSettings';
import RemoteServersSettings from '../components/settings/RemoteServersSettings';
import UsersSettings from '../components/settings/UsersSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Settings
          </Typography>
        </Box>
        
        <Paper sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', minHeight: 600 }}>
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={value}
            onChange={handleChange}
            aria-label="Settings tabs"
            sx={{ borderRight: 1, borderColor: 'divider', minWidth: 200 }}
          >
            <Tab icon={<PersonIcon />} iconPosition="start" label="Account" />
            <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
            <Tab icon={<DnsIcon />} iconPosition="start" label="Traefik & Certs" />
            <Tab icon={<TuneIcon />} iconPosition="start" label="System & Web Server" />
            <Tab icon={<StorageIcon />} iconPosition="start" label="Remote Servers" />
            <Tab icon={<GroupIcon />} iconPosition="start" label="Users & Permissions" />
          </Tabs>
          
          <TabPanel value={value} index={0}>
            <AccountSettings />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <NotificationsSettings />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <TraefikSettings />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <SystemSettings />
          </TabPanel>
          <TabPanel value={value} index={4}>
            <RemoteServersSettings />
          </TabPanel>
          <TabPanel value={value} index={5}>
            <UsersSettings />
          </TabPanel>
        </Paper>
      </Container>
    </Layout>
  );
};

export default Settings;
