import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // Organizations
  async getOrganizations(params?: { page?: number; page_size?: number }) {
    const response = await this.client.get('/organizations', { params });
    return response.data;
  }

  async getOrganization(id: string) {
    const response = await this.client.get(`/organizations/${id}`);
    return response.data;
  }

  async createOrganization(data: any) {
    const response = await this.client.post('/organizations', data);
    return response.data;
  }

  async updateOrganization(id: string, data: any) {
    const response = await this.client.put(`/organizations/${id}`, data);
    return response.data;
  }

  async deleteOrganization(id: string) {
    const response = await this.client.delete(`/organizations/${id}`);
    return response.data;
  }

  async getOrganizationMembers(id: string) {
    const response = await this.client.get(`/organizations/${id}/members`);
    return response.data;
  }

  async addOrganizationMember(id: string, data: { user_id: string; role: string }) {
    const response = await this.client.post(`/organizations/${id}/members`, data);
    return response.data;
  }

  async removeOrganizationMember(orgId: string, userId: string) {
    const response = await this.client.delete(`/organizations/${orgId}/members/${userId}`);
    return response.data;
  }

  // Projects
  async getProjects(params?: { page?: number; page_size?: number; organization_id?: string }) {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async getProject(id: string) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: any) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: any) {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  async getProjectFolders(id: string) {
    const response = await this.client.get(`/projects/${id}/folders`);
    return response.data;
  }

  async createProjectFolder(id: string, data: any) {
    const response = await this.client.post(`/projects/${id}/folders`, data);
    return response.data;
  }

  async updateProjectFolder(projectId: string, folderId: string, data: any) {
    const response = await this.client.put(`/projects/${projectId}/folders/${folderId}`, data);
    return response.data;
  }

  async deleteProjectFolder(projectId: string, folderId: string) {
    const response = await this.client.delete(`/projects/${projectId}/folders/${folderId}`);
    return response.data;
  }

  async getProjectEnvironments(id: string) {
    const response = await this.client.get(`/projects/${id}/environments`);
    return response.data;
  }

  async createProjectEnvironment(id: string, data: any) {
    const response = await this.client.post(`/projects/${id}/environments`, data);
    return response.data;
  }

  // Applications
  async getApplications(params?: { page?: number; page_size?: number; project_id?: string }) {
    const response = await this.client.get('/applications', { params });
    return response.data;
  }

  async getApplication(id: string) {
    const response = await this.client.get(`/applications/${id}`);
    return response.data;
  }

  async createApplication(data: any) {
    const response = await this.client.post('/applications', data);
    return response.data;
  }

  async updateApplication(id: string, data: any) {
    const response = await this.client.put(`/applications/${id}`, data);
    return response.data;
  }

  async deleteApplication(id: string) {
    const response = await this.client.delete(`/applications/${id}`);
    return response.data;
  }

  async startApplication(id: string) {
    const response = await this.client.post(`/applications/${id}/start`);
    return response.data;
  }

  async stopApplication(id: string) {
    const response = await this.client.post(`/applications/${id}/stop`);
    return response.data;
  }

  async restartApplication(id: string) {
    const response = await this.client.post(`/applications/${id}/restart`);
    return response.data;
  }

  async deployApplication(id: string) {
    const response = await this.client.post(`/applications/${id}/deploy`);
    return response.data;
  }

  async getApplicationEnvVars(id: string) {
    const response = await this.client.get(`/applications/${id}/env`);
    return response.data;
  }

  async createApplicationEnvVar(id: string, data: any) {
    const response = await this.client.post(`/applications/${id}/env`, data);
    return response.data;
  }

  async updateApplicationEnvVar(appId: string, envId: string, data: any) {
    const response = await this.client.put(`/applications/${appId}/env/${envId}`, data);
    return response.data;
  }

  async deleteApplicationEnvVar(appId: string, envId: string) {
    const response = await this.client.delete(`/applications/${appId}/env/${envId}`);
    return response.data;
  }

  // Containers
  async getContainers(params?: { page?: number; page_size?: number; application_id?: string; node_id?: string }) {
    const response = await this.client.get('/containers', { params });
    return response.data;
  }

  async getContainer(id: string) {
    const response = await this.client.get(`/containers/${id}`);
    return response.data;
  }

  async createContainer(data: any) {
    const response = await this.client.post('/containers', data);
    return response.data;
  }

  async updateContainer(id: string, data: any) {
    const response = await this.client.put(`/containers/${id}`, data);
    return response.data;
  }

  async deleteContainer(id: string) {
    const response = await this.client.delete(`/containers/${id}`);
    return response.data;
  }

  async startContainer(id: string) {
    const response = await this.client.post(`/containers/${id}/start`);
    return response.data;
  }

  async stopContainer(id: string) {
    const response = await this.client.post(`/containers/${id}/stop`);
    return response.data;
  }

  async restartContainer(id: string) {
    const response = await this.client.post(`/containers/${id}/restart`);
    return response.data;
  }

  // Permissions
  async grantPermission(data: {
    user_id: string;
    resource_type: string;
    resource_id: string;
    permissions: string[];
    expires_at?: string;
  }) {
    const response = await this.client.post('/permissions/grant', data);
    return response.data;
  }

  async revokePermission(data: {
    user_id: string;
    resource_type: string;
    resource_id: string;
  }) {
    const response = await this.client.post('/permissions/revoke', data);
    return response.data;
  }

  async getUserPermissions(userId: string) {
    const response = await this.client.get(`/permissions/users/${userId}`);
    return response.data;
  }

  async getResourcePermissions(resourceType: string, resourceId: string) {
    const response = await this.client.get('/permissions/resources', {
      params: { resource_type: resourceType, resource_id: resourceId }
    });
    return response.data;
  }

  async getUserResources(userId: string, type: string) {
    const response = await this.client.get(`/permissions/users/${userId}/resources`, {
      params: { type }
    });
    return response.data;
  }

  async updatePermission(id: string, data: { permissions: string[]; expires_at?: string }) {
    const response = await this.client.put(`/permissions/${id}`, data);
    return response.data;
  }

  async deletePermission(id: string) {
    const response = await this.client.delete(`/permissions/${id}`);
    return response.data;
  }

  // Nodes
  async getNodes() {
    const response = await this.client.get('/nodes');
    return response.data;
  }

  async createNode(data: any) {
    const response = await this.client.post('/nodes', data);
    return response.data;
  }

  // Deployments
  async getDeployments() {
    const response = await this.client.get('/deployments');
    return response.data;
  }

  // Templates
  async getTemplates() {
    const response = await this.client.get('/templates');
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
