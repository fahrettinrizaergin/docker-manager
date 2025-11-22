import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Organization, Project } from '../types';

interface AppState {
  selectedOrganization: Organization | null;
  selectedProject: Project | null;
  setSelectedOrganization: (org: Organization | null) => void;
  setSelectedProject: (project: Project | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedOrganization: null,
      selectedProject: null,
      setSelectedOrganization: (org) => set({ selectedOrganization: org, selectedProject: null }),
      setSelectedProject: (project) => set({ selectedProject: project }),
    }),
    {
      name: 'app-storage',
    }
  )
);
