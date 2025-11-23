import React, { useState, useEffect } from 'react';
import {
  Container as MuiContainer,
  Typography,
  Paper,
  Box,
  Button,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  Divider,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Terminal as TerminalIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Build as BuildIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import api from '../services/api';
import { Container } from '../types';

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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ContainerConfiguration: React.FC = () => {
  const { containerId } = useParams<{ projectId: string; containerId: string }>();
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // General Tab State
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [cleanCache, setCleanCache] = useState(false);
  const [provider, setProvider] = useState('github');
  const [deploySettings] = useState({
    account: '',
    repo: '',
    branch: '',
    buildPath: '',
    triggerType: 'push',
    image: '',
    registryUrl: '',
    username: '',
    password: '',
  });

  // Environment Variables State
  const [envVars, setEnvVars] = useState<Array<{key: string, value: string, protected: boolean, masked: boolean}>>([]);
  const [secretVars, setSecretVars] = useState<Array<{key: string, value: string}>>([]);

  // Domains State
  const [domains, setDomains] = useState<Array<{host: string, path: string, internalPath: string, port: number, https: string}>>([]);

  // Advanced State
  const [runCommand, setRunCommand] = useState('');
  const [restartPolicy, setRestartPolicy] = useState('no');
  const [network, setNetwork] = useState('bridge');
  const [resources, setResources] = useState({ memory: '', cpu: '', disk: '' });
  const [replicas, setReplicas] = useState(1);
  const [volumes, setVolumes] = useState<Array<{type: string, hostPath: string, containerPath: string}>>([]);
  const [ports, setPorts] = useState<Array<{hostPort: number, containerPort: number, protocol: string}>>([]);
  const [basicAuth, setBasicAuth] = useState({ enabled: false, username: '', password: '' });
  const [traefik, setTraefik] = useState({ enabled: false, entryPoints: ['http', 'https'], middlewares: [], loadBalancer: false });

  useEffect(() => {
    loadContainerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const loadContainerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getContainer(containerId!);
      setContainer(response.data);
    } catch (error: any) {
      console.error('Failed to load container details:', error);
      toast.error('Failed to load container details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', protected: false, masked: false }]);
  };

  const handleAddSecretVar = () => {
    setSecretVars([...secretVars, { key: '', value: '' }]);
  };

  const handleAddDomain = () => {
    setDomains([...domains, { host: '', path: '/', internalPath: '/', port: 80, https: 'letsencrypt' }]);
  };

  const handleAddVolume = () => {
    setVolumes([...volumes, { type: 'bind', hostPath: '', containerPath: '' }]);
  };

  const handleAddPort = () => {
    setPorts([...ports, { hostPort: 80, containerPort: 80, protocol: 'tcp' }]);
  };

  const handleDeploy = () => {
    toast.info('Deploy triggered');
  };

  const handleOpenTerminal = () => {
    toast.info('Terminal feature not yet implemented');
  };

  if (loading) {
    return (
      <Layout>
        <MuiContainer maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography>Loading...</Typography>
          </Box>
        </MuiContainer>
      </Layout>
    );
  }

  if (!container) {
    return (
      <Layout>
        <MuiContainer maxWidth="xl">
          <Typography variant="h6" color="error">
            Container not found
          </Typography>
        </MuiContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <MuiContainer maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1">
            <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Container Configuration: {container.name}
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="General" />
            <Tab label="Environment" />
            <Tab label="Domains" />
            <Tab label="Deployments" />
            <Tab label="Schedules" />
            <Tab label="Volume Backups" />
            <Tab label="Logs" />
            <Tab label="Monitoring" />
            <Tab label="Advanced" />
          </Tabs>

          {/* Tab 1: General */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>Deploy Settings</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button variant="contained" startIcon={<PlayIcon />} onClick={handleDeploy}>
                    Deploy
                  </Button>
                  <Button variant="outlined" startIcon={<RefreshIcon />}>
                    Reload
                  </Button>
                  <Button variant="outlined" startIcon={<BuildIcon />}>
                    Rebuild
                  </Button>
                  <Button variant="outlined" startIcon={<PlayIcon />}>
                    Start
                  </Button>
                  <Button variant="outlined" startIcon={<TerminalIcon />} onClick={handleOpenTerminal}>
                    Open Terminal
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <FormControlLabel
                    control={<Switch checked={autoDeploy} onChange={(e) => setAutoDeploy(e.target.checked)} />}
                    label="Auto Deploy"
                  />
                  <FormControlLabel
                    control={<Switch checked={cleanCache} onChange={(e) => setCleanCache(e.target.checked)} />}
                    label="Clean Cache"
                  />
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Provider Options</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Provider</InputLabel>
                  <Select value={provider} onChange={(e) => setProvider(e.target.value)} label="Provider">
                    <MenuItem value="github">GitHub</MenuItem>
                    <MenuItem value="gitea">Gitea</MenuItem>
                    <MenuItem value="docker">Docker</MenuItem>
                    <MenuItem value="drop">Drop (Upload ZIP)</MenuItem>
                    <MenuItem value="dockerfile">Dockerfile</MenuItem>
                    <MenuItem value="compose">Compose</MenuItem>
                  </Select>
                </FormControl>

                {(provider === 'github' || provider === 'gitea') && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Account" fullWidth value={deploySettings.account} />
                    <TextField label="Repository" fullWidth value={deploySettings.repo} />
                    <TextField label="Branch" fullWidth value={deploySettings.branch} />
                    <TextField label="Build Path" fullWidth value={deploySettings.buildPath} />
                    <FormControl fullWidth>
                      <InputLabel>Trigger Type</InputLabel>
                      <Select value={deploySettings.triggerType} label="Trigger Type">
                        <MenuItem value="push">Push</MenuItem>
                        <MenuItem value="tag">Tag</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {provider === 'docker' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Image" fullWidth value={deploySettings.image} />
                    <TextField label="Registry URL" fullWidth value={deploySettings.registryUrl} />
                    <TextField label="Username" fullWidth value={deploySettings.username} />
                    <TextField label="Password" type="password" fullWidth value={deploySettings.password} />
                  </Box>
                )}

                {provider === 'drop' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<UploadIcon />} component="label">
                      Upload ZIP
                      <input type="file" hidden accept=".zip" />
                    </Button>
                    <TextField label="Build Path" fullWidth />
                  </Box>
                )}

                {provider === 'dockerfile' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button variant="outlined" startIcon={<UploadIcon />} component="label">
                      Upload Dockerfile
                      <input type="file" hidden accept="Dockerfile,*" />
                    </Button>
                  </Box>
                )}

                {provider === 'compose' && (
                  <TextField
                    label="Compose Content"
                    fullWidth
                    multiline
                    rows={10}
                    placeholder="version: '3.8'\nservices:\n  ..."
                  />
                )}
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 2: Environment */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>Environment Variables</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Key</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Protected</TableCell>
                        <TableCell>Masked</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {envVars.map((env, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField size="small" value={env.key} fullWidth />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={env.value} fullWidth />
                          </TableCell>
                          <TableCell>
                            <Switch checked={env.protected} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={env.masked} />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddEnvVar} sx={{ mt: 2 }}>
                  Add Variable
                </Button>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Secret Variables</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Key</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {secretVars.map((secret, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField size="small" value={secret.key} fullWidth />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="password" value={secret.value} fullWidth />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddSecretVar} sx={{ mt: 2 }}>
                  Add Secret
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 3: Domains */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" gutterBottom>Domain Configuration (Traefik)</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Host</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Internal Path</TableCell>
                      <TableCell>Port</TableCell>
                      <TableCell>HTTPS</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {domains.map((domain, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <TextField size="small" value={domain.host} fullWidth placeholder="example.com" />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={domain.path} fullWidth />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" value={domain.internalPath} fullWidth />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={domain.port} />
                        </TableCell>
                        <TableCell>
                          <Select size="small" value={domain.https} fullWidth>
                            <MenuItem value="letsencrypt">Let's Encrypt</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button startIcon={<AddIcon />} onClick={handleAddDomain}>
                Add Domain
              </Button>
            </Box>
          </TabPanel>

          {/* Tab 4: Deployments */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>Deployment History</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Deployed At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No deployments yet
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab 5: Schedules */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>Cron-based Jobs</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Next Run</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No schedules configured
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Button startIcon={<AddIcon />} sx={{ mt: 2 }}>
              Add Schedule
            </Button>
          </TabPanel>

          {/* Tab 6: Volume Backups */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h6" gutterBottom>Volume Backups</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No backups available
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Backup Settings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField label="Task Name" fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Schedule (Cron)" fullWidth placeholder="0 0 * * *" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Volumes" fullWidth placeholder="/data,/config" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Prefix" fullWidth />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Keep Latest" type="number" fullWidth defaultValue={5} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Turn Off During Backup"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Enabled"
                  />
                </Grid>
              </Grid>
              <Button variant="contained" sx={{ mt: 2 }}>
                Save Backup Settings
              </Button>
            </Box>
          </TabPanel>

          {/* Tab 7: Logs */}
          <TabPanel value={tabValue} index={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Select Container</InputLabel>
                  <Select label="Select Container">
                    <MenuItem value={container.id}>{container.name}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Log Level</InputLabel>
                  <Select label="Log Level" defaultValue="info">
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<RefreshIcon />}>
                  Refresh
                </Button>
              </Box>
              <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#fff', fontFamily: 'monospace', minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
                <pre>Container logs will appear here...</pre>
              </Paper>
            </Box>
          </TabPanel>

          {/* Tab 8: Monitoring */}
          <TabPanel value={tabValue} index={7}>
            <Typography variant="h6" gutterBottom>Resource Monitoring</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">CPU Usage</Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', mt: 2 }}>
                      <Typography color="text.secondary">Chart: CPU over time</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Memory Usage</Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', mt: 2 }}>
                      <Typography color="text.secondary">Chart: Memory over time</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Network I/O</Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', mt: 2 }}>
                      <Typography color="text.secondary">Chart: Network traffic</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Disk I/O</Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', mt: 2 }}>
                      <Typography color="text.secondary">Chart: Disk operations</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 9: Advanced */}
          <TabPanel value={tabValue} index={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Run Command */}
              <Box>
                <Typography variant="h6" gutterBottom>Run Command</Typography>
                <TextField
                  fullWidth
                  value={runCommand}
                  onChange={(e) => setRunCommand(e.target.value)}
                  placeholder="npm start"
                />
                <Button variant="contained" sx={{ mt: 1 }}>Save</Button>
              </Box>

              <Divider />

              {/* Restart Policy */}
              <Box>
                <Typography variant="h6" gutterBottom>Restart Policy</Typography>
                <FormControl fullWidth>
                  <Select value={restartPolicy} onChange={(e) => setRestartPolicy(e.target.value)}>
                    <MenuItem value="no">No</MenuItem>
                    <MenuItem value="on-failure">On Failure</MenuItem>
                    <MenuItem value="always">Always</MenuItem>
                    <MenuItem value="unless-stopped">Unless Stopped</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" sx={{ mt: 1 }}>Save</Button>
              </Box>

              <Divider />

              {/* Network Settings */}
              <Box>
                <Typography variant="h6" gutterBottom>Network Settings</Typography>
                <FormControl fullWidth>
                  <Select value={network} onChange={(e) => setNetwork(e.target.value)}>
                    <MenuItem value="bridge">Bridge</MenuItem>
                    <MenuItem value="host">Host</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" sx={{ mt: 1 }}>Save</Button>
              </Box>

              <Divider />

              {/* Resource Limits */}
              <Box>
                <Typography variant="h6" gutterBottom>Resource Limits</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Memory"
                      fullWidth
                      value={resources.memory}
                      onChange={(e) => setResources({...resources, memory: e.target.value})}
                      placeholder="512M"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="CPU"
                      fullWidth
                      value={resources.cpu}
                      onChange={(e) => setResources({...resources, cpu: e.target.value})}
                      placeholder="0.5"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Disk"
                      fullWidth
                      value={resources.disk}
                      onChange={(e) => setResources({...resources, disk: e.target.value})}
                      placeholder="10G"
                    />
                  </Grid>
                </Grid>
                <Button variant="contained" sx={{ mt: 1 }}>Save</Button>
              </Box>

              <Divider />

              {/* Cluster Settings */}
              <Box>
                <Typography variant="h6" gutterBottom>Cluster Settings</Typography>
                <TextField
                  label="Replicas"
                  type="number"
                  value={replicas}
                  onChange={(e) => setReplicas(parseInt(e.target.value))}
                  inputProps={{ min: 1 }}
                />
                <Button variant="contained" sx={{ ml: 2 }}>Save</Button>
              </Box>

              <Divider />

              {/* Volumes */}
              <Box>
                <Typography variant="h6" gutterBottom>Volumes</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Host Path</TableCell>
                        <TableCell>Container Path</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {volumes.map((vol, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Select size="small" value={vol.type} fullWidth>
                              <MenuItem value="bind">Bind Mount</MenuItem>
                              <MenuItem value="volume">Volume Mount</MenuItem>
                              <MenuItem value="file">File Mount</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={vol.hostPath} fullWidth />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={vol.containerPath} fullWidth />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddVolume} sx={{ mt: 1 }}>
                  Add Volume
                </Button>
              </Box>

              <Divider />

              {/* Security */}
              <Box>
                <Typography variant="h6" gutterBottom>Security</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={basicAuth.enabled}
                      onChange={(e) => setBasicAuth({...basicAuth, enabled: e.target.checked})}
                    />
                  }
                  label="Enable Basic Auth"
                />
                {basicAuth.enabled && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <TextField
                      label="Username"
                      value={basicAuth.username}
                      onChange={(e) => setBasicAuth({...basicAuth, username: e.target.value})}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={basicAuth.password}
                      onChange={(e) => setBasicAuth({...basicAuth, password: e.target.value})}
                    />
                  </Box>
                )}
                <Button variant="contained" sx={{ mt: 1 }}>Save</Button>
              </Box>

              <Divider />

              {/* Ports */}
              <Box>
                <Typography variant="h6" gutterBottom>Ports</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Host Port</TableCell>
                        <TableCell>Container Port</TableCell>
                        <TableCell>Protocol</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ports.map((port, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField size="small" type="number" value={port.hostPort} />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" type="number" value={port.containerPort} />
                          </TableCell>
                          <TableCell>
                            <Select size="small" value={port.protocol}>
                              <MenuItem value="tcp">TCP</MenuItem>
                              <MenuItem value="udp">UDP</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddPort} sx={{ mt: 1 }}>
                  Add Port
                </Button>
              </Box>

              <Divider />

              {/* Traefik Settings */}
              {domains.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Traefik Settings</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={traefik.enabled}
                        onChange={(e) => setTraefik({...traefik, enabled: e.target.checked})}
                      />
                    }
                    label="Enable Traefik"
                  />
                  {traefik.enabled && (
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Entry Points"
                        value={traefik.entryPoints.join(', ')}
                        helperText="Comma-separated list (e.g., http, https)"
                      />
                      <TextField
                        label="Middlewares"
                        placeholder="middleware1, middleware2"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={traefik.loadBalancer}
                            onChange={(e) => setTraefik({...traefik, loadBalancer: e.target.checked})}
                          />
                        }
                        label="Load Balancer Stickiness"
                      />
                    </Box>
                  )}
                  <Button variant="contained" sx={{ mt: 1 }}>Save</Button>
                </Box>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </MuiContainer>
    </Layout>
  );
};

export default ContainerConfiguration;
