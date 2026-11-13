import { useState, useEffect, useCallback } from 'react';
import { Project } from './types';
import { api } from './services/api';
import { HomeDashboard } from './components/HomeDashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    return localStorage.getItem('active_project_id');
  });
  const [loading, setLoading] = useState(true);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);

      // If there's an active project in localStorage, ensure it exists in the fetched list
      if (selectedProjectId) {
        const found = data.find(p => p._id === selectedProjectId);
        if (!found) {
          setSelectedProjectId(null);
          localStorage.removeItem('active_project_id');
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSelectProject = (project: Project) => {
    setSelectedProjectId(project._id);
    localStorage.setItem('active_project_id', project._id);
  };

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    localStorage.removeItem('active_project_id');
    loadProjects();
  };

  const handleCreateProject = async (name: string, totalWorkingDays: number) => {
    const created = await api.createProject(name, totalWorkingDays);
    await loadProjects();
    // Automatically open the newly created project workspace
    handleSelectProject(created);
  };

  const handleUpdateProject = async (
    id: string,
    name: string,
    totalWorkingDays: number,
    meta?: { instituteName?: string; examName?: string; className?: string; sectionName?: string }
  ) => {
    const updated = await api.updateProject(id, name, totalWorkingDays, meta);
    setProjects(prev => prev.map(p => (p._id === id ? updated : p)));
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
      localStorage.removeItem('active_project_id');
    }
    await loadProjects();
  };

  const currentProject = projects.find(p => p._id === selectedProjectId);

  if (currentProject) {
    return (
      <ProjectWorkspace
        project={currentProject}
        onBackToDashboard={handleBackToDashboard}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  return (
    <HomeDashboard
      projects={projects}
      loading={loading}
      onSelectProject={handleSelectProject}
      onCreateProject={handleCreateProject}
      onUpdateProject={handleUpdateProject}
      onDeleteProject={handleDeleteProject}
    />
  );
}
