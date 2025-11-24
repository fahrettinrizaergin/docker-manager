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
  Chip,
  Alert,
  Slider,
  InputAdornment,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ExpandMore as ExpandMoreIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  Code as CodeIcon,
  RestartAlt as RestartIcon,
  Dns as DnsIcon,
  HealthAndSafety as HealthIcon,
  Label as LabelIcon,
  Save as SaveIcon,
  Info as InfoIcon,
  SettingsEthernet as PortIcon,
  Hub as ClusterIcon,
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

// Collapsible Section Card Component
interface ConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  badgeColor?: 'success' | 'warning' | 'error' | 'info' | 'default';
  onSave?: () => void;
  saving?: boolean;
  hasChanges?: boolean;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = true,
  badge,
  badgeColor = 'default',
  onSave,
  saving,
  hasChanges,
}) => {
  return (
    <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: 'grey.50',
          borderRadius: 1,
          '&:hover': { bgcolor: 'grey.100' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
          <Box sx={{ color: 'primary.main' }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {title}
          </Typography>
          {badge && (
            <Chip
              label={badge}
              size="small"
              color={badgeColor}
              sx={{ ml: 1 }}
            />
          )}
          {hasChanges && (
            <Chip
              label="Unsaved"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ ml: 'auto', mr: 2 }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2, pb: 3 }}>
        {children}
        {onSave && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const ContainerConfiguration: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId, containerId } = useParams<{ projectId: string; containerId: string }>();
  const [container, setContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);

  // General Tab State
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [cleanCache, setCleanCache] = useState(false);
  const [provider, setProvider] = useState('github');
  const [deploySettings, setDeploySettings] = useState({
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
  const [envVars, setEnvVars] = useState<Array<{ key: string, value: string, protected: boolean, masked: boolean }>>([]);
  const [secretVars, setSecretVars] = useState<Array<{ key: string, value: string }>>([]);

  // Domains State
  const [domains, setDomains] = useState<Array<{ host: string, path: string, internalPath: string, port: number, https: string }>>([]);

  // Advanced State
  const [runCommand, setRunCommand] = useState('');
  const [entrypoint, setEntrypoint] = useState('');
  const [workingDir, setWorkingDir] = useState('');
  const [user, setUser] = useState('');
  const [restartPolicy, setRestartPolicy] = useState('no');
  const [network, setNetwork] = useState('bridge');
  const [customNetworkName, setCustomNetworkName] = useState('');
  const [resources, setResources] = useState({ memory: '', cpu: '', memoryReservation: '', cpuReservation: '' });
  const [replicas, setReplicas] = useState(1);
  const [volumes, setVolumes] = useState<Array<{ type: string, hostPath: string, containerPath: string, readOnly: boolean }>>([]);
  const [ports, setPorts] = useState<Array<{ hostPort: number, containerPort: number, protocol: string }>>([]);
  const [basicAuth, setBasicAuth] = useState({ enabled: false, username: '', password: '' });
  const [traefik, setTraefik] = useState({ enabled: false, entryPoints: ['http', 'https'], middlewares: [] as string[], loadBalancer: false });
  
  // New Advanced Features
  const [healthCheck, setHealthCheck] = useState({
    enabled: false,
    command: '',
    interval: 30,
    timeout: 10,
    retries: 3,
    startPeriod: 0,
  });
  const [labels, setLabels] = useState<Array<{ key: string, value: string }>>([]);
  const [privileged, setPrivileged] = useState(false);
  const [readOnlyRootfs, setReadOnlyRootfs] = useState(false);
  const [logging, setLogging] = useState({
    driver: 'json-file',
    maxSize: '10m',
    maxFile: 3,
  });
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [gpuCount, setGpuCount] = useState(1);
  const [dnsServers, setDnsServers] = useState<string[]>([]);
  const [extraHosts, setExtraHosts] = useState<Array<{ host: string, ip: string }>>([]);
  const [stopGracePeriod, setStopGracePeriod] = useState(10);
  const [stopSignal, setStopSignal] = useState('SIGTERM');

  useEffect(() => {
    loadContainerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  const loadContainerDetails = async () => {
    try {
      setLoading(true);
      const response = await api.getContainer(containerId!);
      setContainer(response);
      
      // Initialize form state from container data
      if (response) {
        setRunCommand(response.command || '');
        setEntrypoint(response.entrypoint || '');
        setWorkingDir(response.working_dir || '');
        setUser(response.user || '');
        setRestartPolicy(response.restart_policy || 'no');
        setResources({
          memory: response.memory_limit ? `${response.memory_limit}M` : '',
          cpu: response.cpu_limit ? String(response.cpu_limit) : '',
          memoryReservation: response.memory_reserve ? `${response.memory_reserve}M` : '',
          cpuReservation: response.cpu_reserve ? String(response.cpu_reserve) : '',
        });
        setReplicas(response.min_replicas || 1);
      }
    } catch (error: unknown) {
      console.error('Failed to load container details:', error);
      toast.error('Failed to load container details');
    } finally {
      setLoading(false);
    }
  };

  // API handlers
  const handleSaveCommand = async () => {
    try {
      setSaving('command');
      await api.updateContainer(containerId!, {
        command: runCommand,
        entrypoint: entrypoint,
        working_dir: workingDir,
        user: user,
      });
      toast.success('Command settings saved successfully');
    } catch (error: unknown) {
      toast.error('Failed to save command settings');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveRestartPolicy = async () => {
    try {
      setSaving('restart');
      await api.updateContainer(containerId!, {
        restart_policy: restartPolicy,
      });
      toast.success('Restart policy saved successfully');
    } catch (error: unknown) {
      toast.error('Failed to save restart policy');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveResources = async () => {
    try {
      setSaving('resources');
      const parseMemory = (val: string) => {
        if (!val) return null;
        const num = parseInt(val);
        return isNaN(num) ? null : num;
      };
      const parseCpu = (val: string) => {
        if (!val) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      await api.updateContainer(containerId!, {
        memory_limit: parseMemory(resources.memory),
        cpu_limit: parseCpu(resources.cpu),
        memory_reserve: parseMemory(resources.memoryReservation),
        cpu_reserve: parseCpu(resources.cpuReservation),
      });
      toast.success('Resource limits saved successfully');
    } catch (error: unknown) {
      toast.error('Failed to save resource limits');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveReplicas = async () => {
    try {
      setSaving('replicas');
      await api.updateContainer(containerId!, {
        min_replicas: replicas,
        max_replicas: replicas,
      });
      toast.success('Replica count saved successfully');
    } catch (error: unknown) {
      toast.error('Failed to save replica count');
    } finally {
      setSaving(null);
    }
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', protected: false, masked: false }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleUpdateEnvVar = (index: number, field: string, value: string | boolean) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  const handleAddSecretVar = () => {
    setSecretVars([...secretVars, { key: '', value: '' }]);
  };

  const handleAddDomain = () => {
    setDomains([...domains, { host: '', path: '/', internalPath: '/', port: 80, https: 'letsencrypt' }]);
  };

  const handleAddVolume = () => {
    setVolumes([...volumes, { type: 'bind', hostPath: '', containerPath: '', readOnly: false }]);
  };

  const handleRemoveVolume = (index: number) => {
    setVolumes(volumes.filter((_, i) => i !== index));
  };

  const handleUpdateVolume = (index: number, field: string, value: string | boolean) => {
    const updated = [...volumes];
    updated[index] = { ...updated[index], [field]: value };
    setVolumes(updated);
  };

  const handleAddPort = () => {
    setPorts([...ports, { hostPort: 80, containerPort: 80, protocol: 'tcp' }]);
  };

  const handleRemovePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index));
  };

  const handleUpdatePort = (index: number, field: string, value: number | string) => {
    const updated = [...ports];
    updated[index] = { ...updated[index], [field]: value };
    setPorts(updated);
  };

  const handleAddLabel = () => {
    setLabels([...labels, { key: '', value: '' }]);
  };

  const handleRemoveLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index));
  };

  const handleUpdateLabel = (index: number, field: string, value: string) => {
    const updated = [...labels];
    updated[index] = { ...updated[index], [field]: value };
    setLabels(updated);
  };

  const handleAddDns = () => {
    setDnsServers([...dnsServers, '']);
  };

  const handleRemoveDns = (index: number) => {
    setDnsServers(dnsServers.filter((_, i) => i !== index));
  };

  const handleUpdateDns = (index: number, value: string) => {
    const updated = [...dnsServers];
    updated[index] = value;
    setDnsServers(updated);
  };

  const handleAddExtraHost = () => {
    setExtraHosts([...extraHosts, { host: '', ip: '' }]);
  };

  const handleRemoveExtraHost = (index: number) => {
    setExtraHosts(extraHosts.filter((_, i) => i !== index));
  };

  const handleUpdateExtraHost = (index: number, field: string, value: string) => {
    const updated = [...extraHosts];
    updated[index] = { ...updated[index], [field]: value };
    setExtraHosts(updated);
  };

  const handleDeploy = async () => {
    try {
      await api.deployContainer(containerId!);
      toast.success('Deployment started');
    } catch (error: unknown) {
      toast.error('Failed to start deployment');
    }
  };

  const handleOpenTerminal = () => {
    toast.info('Terminal feature coming soon');
  };

  if (loading) {
    return (
      <Layout>
        <MuiContainer maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        </MuiContainer>
      </Layout>
    );
  }

  if (!container) {
    return (
      <Layout>
        <MuiContainer maxWidth="xl">
          <Alert severity="error" sx={{ mt: 2 }}>
            Container not found
          </Alert>
        </MuiContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <MuiContainer maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1">
                  {container.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Container Configuration
                </Typography>
              </Box>
            </Box>
            <Chip
              label={container.status}
              color={container.status === 'running' ? 'success' : container.status === 'stopped' ? 'default' : 'warning'}
              size="medium"
            />
          </Box>
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
                    <TextField
                      label="Account"
                      fullWidth
                      value={deploySettings.account}
                      onChange={(e) => setDeploySettings({ ...deploySettings, account: e.target.value })}
                    />
                    <TextField
                      label="Repository"
                      fullWidth
                      value={deploySettings.repo}
                      onChange={(e) => setDeploySettings({ ...deploySettings, repo: e.target.value })}
                    />
                    <TextField
                      label="Branch"
                      fullWidth
                      value={deploySettings.branch}
                      onChange={(e) => setDeploySettings({ ...deploySettings, branch: e.target.value })}
                    />
                    <TextField
                      label="Build Path"
                      fullWidth
                      value={deploySettings.buildPath}
                      onChange={(e) => setDeploySettings({ ...deploySettings, buildPath: e.target.value })}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Trigger Type</InputLabel>
                      <Select
                        value={deploySettings.triggerType}
                        label="Trigger Type"
                        onChange={(e) => setDeploySettings({ ...deploySettings, triggerType: e.target.value })}
                      >
                        <MenuItem value="push">Push</MenuItem>
                        <MenuItem value="tag">Tag</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {provider === 'docker' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Image"
                      fullWidth
                      value={deploySettings.image}
                      onChange={(e) => setDeploySettings({ ...deploySettings, image: e.target.value })}
                    />
                    <TextField
                      label="Registry URL"
                      fullWidth
                      value={deploySettings.registryUrl}
                      onChange={(e) => setDeploySettings({ ...deploySettings, registryUrl: e.target.value })}
                    />
                    <TextField
                      label="Username"
                      fullWidth
                      value={deploySettings.username}
                      onChange={(e) => setDeploySettings({ ...deploySettings, username: e.target.value })}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      fullWidth
                      value={deploySettings.password}
                      onChange={(e) => setDeploySettings({ ...deploySettings, password: e.target.value })}
                    />
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
                            <TextField
                              size="small"
                              value={env.key}
                              onChange={(e) => handleUpdateEnvVar(idx, 'key', e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={env.value}
                              onChange={(e) => handleUpdateEnvVar(idx, 'value', e.target.value)}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={env.protected}
                              onChange={(e) => handleUpdateEnvVar(idx, 'protected', e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={env.masked}
                              onChange={(e) => handleUpdateEnvVar(idx, 'masked', e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleRemoveEnvVar(idx)}>
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

          {/* Tab 9: Advanced - Improved Dockploy-style Design */}
          <TabPanel value={tabValue} index={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Configure advanced container settings. Changes require a redeploy to take effect.
                </Typography>
              </Alert>

              {/* Command & Execution Section */}
              <ConfigSection
                title="Command & Execution"
                icon={<CodeIcon />}
                defaultExpanded={true}
                onSave={handleSaveCommand}
                saving={saving === 'command'}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Command"
                      value={runCommand}
                      onChange={(e) => setRunCommand(e.target.value)}
                      placeholder="npm start"
                      helperText="Override the default container command (CMD)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TerminalIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Entrypoint"
                      value={entrypoint}
                      onChange={(e) => setEntrypoint(e.target.value)}
                      placeholder="/bin/sh -c"
                      helperText="Override the container entrypoint (ENTRYPOINT)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Working Directory"
                      value={workingDir}
                      onChange={(e) => setWorkingDir(e.target.value)}
                      placeholder="/app"
                      helperText="Set the working directory inside the container"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="User"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      placeholder="node or 1000:1000"
                      helperText="User to run the container as (username or UID:GID)"
                    />
                  </Grid>
                </Grid>
              </ConfigSection>

              {/* Restart Policy Section */}
              <ConfigSection
                title="Restart Policy"
                icon={<RestartIcon />}
                defaultExpanded={true}
                badge={restartPolicy}
                badgeColor={restartPolicy === 'always' ? 'success' : restartPolicy === 'no' ? 'default' : 'info'}
                onSave={handleSaveRestartPolicy}
                saving={saving === 'restart'}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Restart Policy</InputLabel>
                      <Select
                        value={restartPolicy}
                        onChange={(e) => setRestartPolicy(e.target.value)}
                        label="Restart Policy"
                      >
                        <MenuItem value="no">
                          <Box>
                            <Typography>No</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Do not automatically restart
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="on-failure">
                          <Box>
                            <Typography>On Failure</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Restart only if the container exits with error
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="always">
                          <Box>
                            <Typography>Always</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Always restart regardless of exit status
                            </Typography>
                          </Box>
                        </MenuItem>
                        <MenuItem value="unless-stopped">
                          <Box>
                            <Typography>Unless Stopped</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Restart unless manually stopped
                            </Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stop Grace Period (seconds)"
                      type="number"
                      value={stopGracePeriod}
                      onChange={(e) => setStopGracePeriod(parseInt(e.target.value) || 10)}
                      helperText="Time to wait before force killing the container"
                      InputProps={{ inputProps: { min: 0, max: 300 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Stop Signal</InputLabel>
                      <Select
                        value={stopSignal}
                        onChange={(e) => setStopSignal(e.target.value)}
                        label="Stop Signal"
                      >
                        <MenuItem value="SIGTERM">SIGTERM (graceful)</MenuItem>
                        <MenuItem value="SIGKILL">SIGKILL (force)</MenuItem>
                        <MenuItem value="SIGINT">SIGINT</MenuItem>
                        <MenuItem value="SIGQUIT">SIGQUIT</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </ConfigSection>

              {/* Resource Limits Section */}
              <ConfigSection
                title="Resource Limits"
                icon={<MemoryIcon />}
                defaultExpanded={true}
                onSave={handleSaveResources}
                saving={saving === 'resources'}
              >
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    Setting resource limits helps prevent containers from consuming excessive system resources.
                  </Typography>
                </Alert>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Memory Limit"
                      value={resources.memory}
                      onChange={(e) => setResources({ ...resources, memory: e.target.value })}
                      placeholder="512M, 1G, 2048M"
                      helperText="Maximum memory the container can use"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MemoryIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Memory Reservation"
                      value={resources.memoryReservation}
                      onChange={(e) => setResources({ ...resources, memoryReservation: e.target.value })}
                      placeholder="256M"
                      helperText="Soft limit for memory allocation"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CPU Limit"
                      value={resources.cpu}
                      onChange={(e) => setResources({ ...resources, cpu: e.target.value })}
                      placeholder="0.5, 1, 2"
                      helperText="Number of CPUs (e.g., 0.5 = 50% of one CPU)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SpeedIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="CPU Reservation"
                      value={resources.cpuReservation}
                      onChange={(e) => setResources({ ...resources, cpuReservation: e.target.value })}
                      placeholder="0.25"
                      helperText="Minimum CPU allocation"
                    />
                  </Grid>
                </Grid>
              </ConfigSection>

              {/* Scaling Section */}
              <ConfigSection
                title="Scaling & Replicas"
                icon={<ClusterIcon />}
                defaultExpanded={false}
                badge={`${replicas} replica${replicas > 1 ? 's' : ''}`}
                badgeColor={replicas > 1 ? 'info' : 'default'}
                onSave={handleSaveReplicas}
                saving={saving === 'replicas'}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Number of Replicas</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Slider
                        value={replicas}
                        onChange={(e, v) => setReplicas(v as number)}
                        min={1}
                        max={10}
                        marks
                        valueLabelDisplay="on"
                        sx={{ flexGrow: 1 }}
                      />
                      <TextField
                        type="number"
                        value={replicas}
                        onChange={(e) => setReplicas(Math.max(1, parseInt(e.target.value) || 1))}
                        inputProps={{ min: 1, max: 100, style: { width: 60 } }}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Running multiple replicas enables load balancing and high availability
                    </Typography>
                  </Grid>
                </Grid>
              </ConfigSection>

              {/* Network Section */}
              <ConfigSection
                title="Network Settings"
                icon={<NetworkIcon />}
                defaultExpanded={false}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Network Mode</InputLabel>
                      <Select
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        label="Network Mode"
                      >
                        <MenuItem value="bridge">Bridge (default)</MenuItem>
                        <MenuItem value="host">Host</MenuItem>
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="custom">Custom Network</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {network === 'custom' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Custom Network Name"
                        value={customNetworkName}
                        onChange={(e) => setCustomNetworkName(e.target.value)}
                        placeholder="my-network"
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      DNS Servers
                    </Typography>
                    {dnsServers.map((dns, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          size="small"
                          value={dns}
                          onChange={(e) => handleUpdateDns(idx, e.target.value)}
                          placeholder="8.8.8.8"
                          fullWidth
                        />
                        <IconButton color="error" onClick={() => handleRemoveDns(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddDns}>
                      Add DNS Server
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Extra Hosts (hosts file entries)
                    </Typography>
                    {extraHosts.map((entry, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <TextField
                          size="small"
                          value={entry.host}
                          onChange={(e) => handleUpdateExtraHost(idx, 'host', e.target.value)}
                          placeholder="hostname"
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          value={entry.ip}
                          onChange={(e) => handleUpdateExtraHost(idx, 'ip', e.target.value)}
                          placeholder="192.168.1.1"
                          sx={{ flex: 1 }}
                        />
                        <IconButton color="error" onClick={() => handleRemoveExtraHost(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={handleAddExtraHost}>
                      Add Host Entry
                    </Button>
                  </Grid>
                </Grid>
              </ConfigSection>

              {/* Ports Section */}
              <ConfigSection
                title="Port Mappings"
                icon={<PortIcon />}
                defaultExpanded={false}
                badge={ports.length > 0 ? `${ports.length} port${ports.length > 1 ? 's' : ''}` : undefined}
              >
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Host Port</TableCell>
                        <TableCell>Container Port</TableCell>
                        <TableCell>Protocol</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ports.map((port, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={port.hostPort}
                              onChange={(e) => handleUpdatePort(idx, 'hostPort', parseInt(e.target.value))}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={port.containerPort}
                              onChange={(e) => handleUpdatePort(idx, 'containerPort', parseInt(e.target.value))}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              size="small"
                              value={port.protocol}
                              onChange={(e) => handleUpdatePort(idx, 'protocol', e.target.value)}
                              fullWidth
                            >
                              <MenuItem value="tcp">TCP</MenuItem>
                              <MenuItem value="udp">UDP</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleRemovePort(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {ports.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No port mappings configured
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddPort} sx={{ mt: 2 }}>
                  Add Port Mapping
                </Button>
              </ConfigSection>

              {/* Volumes Section */}
              <ConfigSection
                title="Volumes & Mounts"
                icon={<StorageIcon />}
                defaultExpanded={false}
                badge={volumes.length > 0 ? `${volumes.length} volume${volumes.length > 1 ? 's' : ''}` : undefined}
              >
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Host Path / Volume Name</TableCell>
                        <TableCell>Container Path</TableCell>
                        <TableCell>Read Only</TableCell>
                        <TableCell width={80}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {volumes.map((vol, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Select
                              size="small"
                              value={vol.type}
                              onChange={(e) => handleUpdateVolume(idx, 'type', e.target.value)}
                              fullWidth
                            >
                              <MenuItem value="bind">Bind Mount</MenuItem>
                              <MenuItem value="volume">Named Volume</MenuItem>
                              <MenuItem value="tmpfs">tmpfs</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={vol.hostPath}
                              onChange={(e) => handleUpdateVolume(idx, 'hostPath', e.target.value)}
                              placeholder={vol.type === 'volume' ? 'my-volume' : '/host/path'}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={vol.containerPath}
                              onChange={(e) => handleUpdateVolume(idx, 'containerPath', e.target.value)}
                              placeholder="/container/path"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={vol.readOnly}
                              onChange={(e) => handleUpdateVolume(idx, 'readOnly', e.target.checked)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => handleRemoveVolume(idx)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {volumes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No volumes configured
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button startIcon={<AddIcon />} onClick={handleAddVolume} sx={{ mt: 2 }}>
                  Add Volume
                </Button>
              </ConfigSection>

              {/* Health Check Section */}
              <ConfigSection
                title="Health Check"
                icon={<HealthIcon />}
                defaultExpanded={false}
                badge={healthCheck.enabled ? 'Enabled' : 'Disabled'}
                badgeColor={healthCheck.enabled ? 'success' : 'default'}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={healthCheck.enabled}
                      onChange={(e) => setHealthCheck({ ...healthCheck, enabled: e.target.checked })}
                    />
                  }
                  label="Enable Health Check"
                />
                {healthCheck.enabled && (
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Health Check Command"
                        value={healthCheck.command}
                        onChange={(e) => setHealthCheck({ ...healthCheck, command: e.target.value })}
                        placeholder="curl -f http://localhost/ || exit 1"
                        helperText="Command to run to check health"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Interval (seconds)"
                        value={healthCheck.interval}
                        onChange={(e) => setHealthCheck({ ...healthCheck, interval: parseInt(e.target.value) || 30 })}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Timeout (seconds)"
                        value={healthCheck.timeout}
                        onChange={(e) => setHealthCheck({ ...healthCheck, timeout: parseInt(e.target.value) || 10 })}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Retries"
                        value={healthCheck.retries}
                        onChange={(e) => setHealthCheck({ ...healthCheck, retries: parseInt(e.target.value) || 3 })}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Start Period (seconds)"
                        value={healthCheck.startPeriod}
                        onChange={(e) => setHealthCheck({ ...healthCheck, startPeriod: parseInt(e.target.value) || 0 })}
                        helperText="Grace period for startup"
                      />
                    </Grid>
                  </Grid>
                )}
              </ConfigSection>

              {/* Labels Section */}
              <ConfigSection
                title="Labels & Metadata"
                icon={<LabelIcon />}
                defaultExpanded={false}
                badge={labels.length > 0 ? `${labels.length} label${labels.length > 1 ? 's' : ''}` : undefined}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add custom labels to your container for organization or integration with other tools.
                </Typography>
                {labels.map((label, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      size="small"
                      value={label.key}
                      onChange={(e) => handleUpdateLabel(idx, 'key', e.target.value)}
                      placeholder="com.example.label"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      value={label.value}
                      onChange={(e) => handleUpdateLabel(idx, 'value', e.target.value)}
                      placeholder="value"
                      sx={{ flex: 1 }}
                    />
                    <IconButton color="error" onClick={() => handleRemoveLabel(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button startIcon={<AddIcon />} onClick={handleAddLabel} sx={{ mt: 1 }}>
                  Add Label
                </Button>
              </ConfigSection>

              {/* Security Section */}
              <ConfigSection
                title="Security & Permissions"
                icon={<SecurityIcon />}
                defaultExpanded={false}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Modifying security settings can expose your system to risks. Use with caution.
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={privileged}
                          onChange={(e) => setPrivileged(e.target.checked)}
                          color="warning"
                        />
                      }
                      label={
                        <Box>
                          <Typography>Privileged Mode</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Grant full access to host devices
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={readOnlyRootfs}
                          onChange={(e) => setReadOnlyRootfs(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Typography>Read-only Root Filesystem</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Mount container filesystem as read-only
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Basic Authentication
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={basicAuth.enabled}
                          onChange={(e) => setBasicAuth({ ...basicAuth, enabled: e.target.checked })}
                        />
                      }
                      label="Enable Basic Auth"
                    />
                    {basicAuth.enabled && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <TextField
                          label="Username"
                          value={basicAuth.username}
                          onChange={(e) => setBasicAuth({ ...basicAuth, username: e.target.value })}
                          size="small"
                        />
                        <TextField
                          label="Password"
                          type="password"
                          value={basicAuth.password}
                          onChange={(e) => setBasicAuth({ ...basicAuth, password: e.target.value })}
                          size="small"
                        />
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </ConfigSection>

              {/* Logging Section */}
              <ConfigSection
                title="Logging Configuration"
                icon={<InfoIcon />}
                defaultExpanded={false}
              >
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Logging Driver</InputLabel>
                      <Select
                        value={logging.driver}
                        onChange={(e) => setLogging({ ...logging, driver: e.target.value })}
                        label="Logging Driver"
                      >
                        <MenuItem value="json-file">JSON File (default)</MenuItem>
                        <MenuItem value="syslog">Syslog</MenuItem>
                        <MenuItem value="journald">Journald</MenuItem>
                        <MenuItem value="gelf">GELF</MenuItem>
                        <MenuItem value="fluentd">Fluentd</MenuItem>
                        <MenuItem value="none">None</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {logging.driver === 'json-file' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Max Size"
                          value={logging.maxSize}
                          onChange={(e) => setLogging({ ...logging, maxSize: e.target.value })}
                          placeholder="10m"
                          helperText="Maximum size of log file (e.g., 10m, 1g)"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Max Files"
                          value={logging.maxFile}
                          onChange={(e) => setLogging({ ...logging, maxFile: parseInt(e.target.value) || 3 })}
                          helperText="Number of log files to keep"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </ConfigSection>

              {/* GPU Section */}
              <ConfigSection
                title="GPU Configuration"
                icon={<SpeedIcon />}
                defaultExpanded={false}
                badge={gpuEnabled ? 'Enabled' : undefined}
                badgeColor="info"
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={gpuEnabled}
                      onChange={(e) => setGpuEnabled(e.target.checked)}
                    />
                  }
                  label="Enable GPU Access"
                />
                {gpuEnabled && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      type="number"
                      label="GPU Count"
                      value={gpuCount}
                      onChange={(e) => setGpuCount(Math.max(1, parseInt(e.target.value) || 1))}
                      helperText="Number of GPUs to allocate (use 'all' for all available)"
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Requires NVIDIA Container Toolkit to be installed on the host
                    </Typography>
                  </Box>
                )}
              </ConfigSection>

              {/* Traefik Settings */}
              <ConfigSection
                title="Traefik Integration"
                icon={<DnsIcon />}
                defaultExpanded={false}
                badge={traefik.enabled ? 'Enabled' : undefined}
                badgeColor="success"
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={traefik.enabled}
                      onChange={(e) => setTraefik({ ...traefik, enabled: e.target.checked })}
                    />
                  }
                  label="Enable Traefik Labels"
                />
                {traefik.enabled && (
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Entry Points"
                        value={traefik.entryPoints.join(', ')}
                        onChange={(e) => setTraefik({ ...traefik, entryPoints: e.target.value.split(',').map(s => s.trim()) })}
                        helperText="Comma-separated (e.g., http, https)"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Middlewares"
                        value={traefik.middlewares.join(', ')}
                        onChange={(e) => setTraefik({ ...traefik, middlewares: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                        placeholder="auth@docker, ratelimit@docker"
                        helperText="Comma-separated middleware references"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={traefik.loadBalancer}
                            onChange={(e) => setTraefik({ ...traefik, loadBalancer: e.target.checked })}
                          />
                        }
                        label="Enable Load Balancer Sticky Sessions"
                      />
                    </Grid>
                  </Grid>
                )}
              </ConfigSection>
            </Box>
          </TabPanel>
        </Paper>
      </MuiContainer>
    </Layout>
  );
};

export default ContainerConfiguration;
