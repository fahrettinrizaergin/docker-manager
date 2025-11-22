# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Docker Manager seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **Do not** open a public GitHub issue
2. Send an email to security@example.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Status Updates**: Every 14 days until resolved
- **Resolution**: Depends on severity and complexity

### Security Best Practices

When using Docker Manager, follow these security guidelines:

#### 1. Authentication & Authorization

- **Strong Passwords**: Enforce minimum 12 characters with complexity requirements
- **JWT Secrets**: Use cryptographically secure random strings (minimum 32 bytes)
- **Token Expiration**: Keep token expiration reasonable (24 hours recommended)
- **Role-Based Access**: Implement least privilege principle
- **Multi-Factor Authentication**: Enable when available

#### 2. Secrets Management

- **Environment Variables**: Never commit secrets to version control
- **Docker Secrets**: Use Docker secrets for sensitive data in production
- **Vault Integration**: Consider HashiCorp Vault for production environments
- **Rotation**: Regularly rotate passwords and API keys
- **Encryption**: All secrets stored in database must be encrypted

#### 3. Network Security

- **HTTPS Only**: Always use HTTPS in production
- **Certificate Management**: Use Let's Encrypt or valid SSL certificates
- **Firewall**: Configure firewall to allow only necessary ports
- **Internal Network**: Use Docker networks to isolate services
- **VPN/SSH**: Use VPN or SSH tunnels for remote node access

#### 4. Container Security

- **Image Sources**: Only use trusted Docker images
- **Image Scanning**: Enable vulnerability scanning (Trivy, Clair)
- **Image Updates**: Keep images updated with security patches
- **Read-Only Filesystem**: Use read-only root filesystem when possible
- **Drop Capabilities**: Remove unnecessary Linux capabilities
- **User Namespace**: Don't run containers as root
- **Resource Limits**: Set CPU and memory limits

#### 5. Database Security

- **Strong Credentials**: Use strong database passwords
- **Network Isolation**: Database should not be publicly accessible
- **SSL/TLS**: Enable SSL for database connections
- **Backup Encryption**: Encrypt database backups
- **Regular Updates**: Keep PostgreSQL updated

#### 6. Docker Socket Security

- **Never Expose Publicly**: Docker socket should never be exposed to the internet
- **Read-Only Access**: Mount Docker socket as read-only when possible
- **Socket Proxy**: Consider using Docker socket proxy for additional security
- **TLS**: Enable Docker TLS when accessing remotely
- **SSH Tunneling**: Use SSH tunnels for remote access

#### 7. API Security

- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Input Validation**: Validate and sanitize all user input
- **CORS**: Configure CORS properly for your domains
- **Request ID**: Log all requests with unique IDs for audit
- **API Versioning**: Use API versioning for backward compatibility

#### 8. Logging & Monitoring

- **Audit Logs**: Log all security-relevant events
- **Log Retention**: Keep logs for compliance requirements
- **Alerting**: Set up alerts for suspicious activities
- **Monitoring**: Monitor resource usage and anomalies
- **SIEM**: Consider SIEM integration for large deployments

#### 9. Updates & Patching

- **Regular Updates**: Keep Docker Manager updated
- **Dependency Updates**: Update dependencies regularly
- **Security Advisories**: Subscribe to security advisories
- **Testing**: Test updates in staging before production

#### 10. Backup & Recovery

- **Regular Backups**: Backup database and configuration regularly
- **Backup Testing**: Test backup restoration periodically
- **Secure Storage**: Store backups in secure, encrypted location
- **Disaster Recovery**: Have a disaster recovery plan

### Security Checklist for Production

Before deploying to production, ensure:

- [ ] All default passwords changed
- [ ] JWT secret is strong and unique
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall configured properly
- [ ] Database credentials are strong
- [ ] Docker socket not exposed
- [ ] Environment variables not committed to Git
- [ ] CORS configured for your domains
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Backup system in place
- [ ] Security scanning enabled
- [ ] All services updated to latest versions
- [ ] Access logs monitored
- [ ] Admin accounts secured

### Vulnerability Disclosure

We follow responsible disclosure practices:

1. **Coordination**: Work with reporter to understand and fix issue
2. **Fix Development**: Develop and test fix
3. **Notification**: Notify affected users if necessary
4. **Public Disclosure**: Disclose vulnerability after fix is released
5. **Credit**: Credit reporter (if desired)

### Security Resources

- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

### Common Vulnerabilities

#### Preventing Common Issues

1. **SQL Injection**: Use parameterized queries (GORM handles this)
2. **XSS**: Sanitize user input, use Content Security Policy
3. **CSRF**: Use CSRF tokens for state-changing operations
4. **Command Injection**: Never execute user input directly
5. **Path Traversal**: Validate file paths
6. **Privilege Escalation**: Implement proper RBAC
7. **Information Disclosure**: Don't expose sensitive data in errors

### Compliance

Docker Manager aims to help with compliance for:

- GDPR (Data Protection)
- SOC 2 (Security Controls)
- HIPAA (Healthcare)
- PCI DSS (Payment Card Industry)

Note: Full compliance requires proper deployment and operational procedures.

### Contact

For security concerns:
- Email: security@example.com
- PGP Key: Available on request

For general support:
- GitHub Issues: https://github.com/fahrettinrizaergin/docker-manager/issues
