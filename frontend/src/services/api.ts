import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
  async getOrganizations() {
    const response = await this.client.get('/organizations');
    return response.data;
  }

  async createOrganization(data: any) {
    const response = await this.client.post('/organizations', data);
    return response.data;
  }

  // Projects
  async getProjects() {
    const response = await this.client.get('/projects');
    return response.data;
  }

  async createProject(data: any) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  // Applications
  async getApplications() {
    const response = await this.client.get('/applications');
    return response.data;
  }

  async createApplication(data: any) {
    const response = await this.client.post('/applications', data);
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

export default new ApiService();
