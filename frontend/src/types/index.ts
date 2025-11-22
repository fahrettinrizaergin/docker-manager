// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  owner_id: string;
  is_active: boolean;
  settings?: string;
  created_at: string;
  updated_at: string;
  owner?: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// Project types
export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  status: 'active' | 'archived' | 'suspended';
  settings?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Folder {
  id: string;
  project_id: string;
  parent_id?: string;
  name: string;
  description?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  is_protected: boolean;
  settings?: string;
  created_at: string;
  updated_at: string;
}

// Application types
export interface Application {
  id: string;
  project_id: string;
  folder_id?: string;
  node_id?: string;
  name: string;
  slug: string;
  description?: string;
  type: 'docker-compose' | 'container' | 'template';
  status: 'running' | 'stopped' | 'deploying' | 'error' | 'paused';
  
  // Deployment Configuration
  repository?: string;
  branch: string;
  build_path: string;
  dockerfile_path: string;
  compose_file: string;
  
  // Docker Configuration
  image?: string;
  tag: string;
  registry?: string;
  
  // Runtime Configuration
  command?: string;
  entrypoint?: string;
  working_dir?: string;
  user?: string;
  
  // Networking
  domain?: string;
  domains?: string;
  port?: number;
  internal_port?: number;
  protocol: string;
  
  // Resources
  cpu_limit?: number;
  memory_limit?: number;
  cpu_reserve?: number;
  memory_reserve?: number;
  
  // Auto Scaling
  auto_scale: boolean;
  min_replicas: number;
  max_replicas: number;
  scale_metric: string;
  scale_threshold: number;
  
  // Deployment Strategy
  strategy: string;
  
  // Settings
  restart_policy: string;
  labels?: string;
  capabilities?: string;
  
  created_at: string;
  updated_at: string;
  
  project?: Project;
  folder?: Folder;
}

export interface EnvVar {
  id: string;
  application_id?: string;
  environment_id?: string;
  project_id?: string;
  key: string;
  value?: string;
  is_secret: boolean;
  is_shared: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Container types
export interface Container {
  id: string;
  application_id: string;
  node_id: string;
  container_id: string;
  name: string;
  image: string;
  status: string;
  state?: string;
  started_at?: string;
  finished_at?: string;
  restart_count: number;
  ip_address?: string;
  ports?: string;
  networks?: string;
  created_at: string;
  updated_at: string;
  application?: Application;
}

// Permission types
export interface UserPermission {
  id: string;
  user_id: string;
  resource_type: 'organization' | 'project' | 'application' | 'container';
  resource_id: string;
  permissions: string; // JSON array
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface PermissionSet {
  read: boolean;
  write: boolean;
  delete: boolean;
  deploy: boolean;
  manage: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  details?: string;
}
