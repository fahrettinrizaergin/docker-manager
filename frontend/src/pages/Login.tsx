import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  
  // Password reset
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'token'>('email');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.login(loginEmail, loginPassword);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      toast.success('Login successful!');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.register({
        email: registerEmail,
        username: registerUsername,
        password: registerPassword,
        first_name: registerFirstName,
        last_name: registerLastName,
      });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      toast.success('Registration successful!');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.requestPasswordReset(resetEmail);
      toast.success('Password reset instructions sent to your email');
      // For development, show the token
      if (response.token) {
        setResetToken(response.token);
        setResetStep('token');
      } else {
        setResetDialogOpen(false);
        setResetEmail('');
      }
    } catch (err: any) {
      toast.error('Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken || !newPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await api.resetPassword(resetToken, newPassword);
      toast.success('Password reset successfully! Please login with your new password.');
      setResetDialogOpen(false);
      setResetEmail('');
      setResetToken('');
      setNewPassword('');
      setResetStep('email');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Docker Manager
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Manage your Docker containers with ease
          </Typography>

          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} centered sx={{ mb: 3 }}>
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tabValue === 0 ? (
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setResetDialogOpen(true)}
                  sx={{ cursor: 'pointer' }}
                >
                  Forgot password?
                </Link>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={registerFirstName}
                  onChange={(e) => setRegisterFirstName(e.target.value)}
                  margin="normal"
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={registerLastName}
                  onChange={(e) => setRegisterLastName(e.target.value)}
                  margin="normal"
                  disabled={loading}
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Username"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                margin="normal"
                required
                helperText="At least 8 characters"
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>
            </form>
          )}

          {/* Password Reset Dialog */}
          <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogContent>
              {resetStep === 'email' ? (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter your email address and we'll send you instructions to reset your password.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={loading}
                  />
                </Box>
              ) : (
                <Box sx={{ pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter the reset token sent to your email and your new password.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Reset Token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    margin="normal"
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    margin="normal"
                    helperText="At least 8 characters"
                    disabled={loading}
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setResetDialogOpen(false);
                setResetStep('email');
                setResetEmail('');
                setResetToken('');
                setNewPassword('');
              }} disabled={loading}>
                Cancel
              </Button>
              {resetStep === 'email' ? (
                <Button onClick={handleRequestPasswordReset} variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                </Button>
              ) : (
                <Button onClick={handleResetPassword} variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
