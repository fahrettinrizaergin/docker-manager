import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  organizations: string[];
}

const UsersSettings: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'Admin', organizations: ['All'] },
    { id: 2, username: 'developer', email: 'dev@example.com', role: 'User', organizations: ['Org A'] },
  ]);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openPermsDialog, setOpenPermsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleInvite = () => {
    toast.success('Invitation sent successfully (Mock)');
    setOpenInviteDialog(false);
  };

  const handleSavePerms = () => {
    toast.success('Permissions updated successfully (Mock)');
    setOpenPermsDialog(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenInviteDialog(true)}
        >
          Invite User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Access</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} color={user.role === 'Admin' ? 'primary' : 'default'} size="small" />
                </TableCell>
                <TableCell>
                  {user.organizations.map((org) => (
                    <Chip key={org} label={org} size="small" sx={{ mr: 0.5 }} variant="outlined" />
                  ))}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    title="Permissions"
                    onClick={() => {
                      setSelectedUser(user);
                      setOpenPermsDialog(true);
                    }}
                  >
                    <SecurityIcon />
                  </IconButton>
                  <IconButton size="small" title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" title="Delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invite Dialog */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email Address" fullWidth type="email" />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select label="Role" defaultValue="User">
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="User">User</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              An invitation email will be sent to the user to set their password.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button onClick={handleInvite} variant="contained" startIcon={<EmailIcon />}>
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={openPermsDialog} onClose={() => setOpenPermsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Permissions: {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Organizations</InputLabel>
              <Select
                multiple
                value={['Org A']}
                input={<OutlinedInput label="Organizations" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="Org A">Org A</MenuItem>
                <MenuItem value="Org B">Org B</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Projects</InputLabel>
              <Select
                multiple
                value={['Project X']}
                input={<OutlinedInput label="Projects" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="Project X">Project X</MenuItem>
                <MenuItem value="Project Y">Project Y</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermsDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePerms} variant="contained">
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersSettings;
