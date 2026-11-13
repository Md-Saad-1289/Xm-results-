import {
  Project,
  Subject,
  Student,
  MarkEntry,
  ProjectOverview,
  StudentResult,
  MarksheetData,
  KataIdentification
} from '../types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'একটি ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
  }
  return data;
}

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>('/api/projects');
  },
  async getProject(id: string): Promise<Project> {
    return request<Project>(`/api/projects/${id}`);
  },
  async getProjectOverview(id: string): Promise<ProjectOverview> {
    return request<ProjectOverview>(`/api/projects/${id}/overview`);
  },
  async createProject(name: string, totalWorkingDays: number): Promise<Project> {
    return request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, totalWorkingDays })
    });
  },
  async updateProject(
    id: string,
    name: string,
    totalWorkingDays: number,
    meta?: { instituteName?: string; examName?: string; className?: string; sectionName?: string }
  ): Promise<Project> {
    return request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, totalWorkingDays, ...meta })
    });
  },
  async deleteProject(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/projects/${id}`, {
      method: 'DELETE'
    });
  },

  // Subjects
  async getSubjects(projectId: string): Promise<Subject[]> {
    return request<Subject[]>(`/api/projects/${projectId}/subjects`);
  },
  async createSubject(projectId: string, name: string, totalMarks: number, passMarks: number): Promise<Subject> {
    return request<Subject>(`/api/projects/${projectId}/subjects`, {
      method: 'POST',
      body: JSON.stringify({ name, totalMarks, passMarks })
    });
  },
  async updateSubject(projectId: string, id: string, name: string, totalMarks: number, passMarks: number): Promise<Subject> {
    return request<Subject>(`/api/projects/${projectId}/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, totalMarks, passMarks })
    });
  },
  async deleteSubject(projectId: string, id: string): Promise<{ message: string; marksRemoved: number }> {
    return request<{ message: string; marksRemoved: number }>(`/api/projects/${projectId}/subjects/${id}`, {
      method: 'DELETE'
    });
  },

  // Students
  async getStudents(projectId: string, search?: string): Promise<Student[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Student[]>(`/api/projects/${projectId}/students${query}`);
  },
  async createStudent(projectId: string, name: string, subjectCodes: { subjectId: string; code: string }[], totalAttendance: number): Promise<Student> {
    return request<Student>(`/api/projects/${projectId}/students`, {
      method: 'POST',
      body: JSON.stringify({ name, subjectCodes, totalAttendance })
    });
  },
  async updateStudent(projectId: string, id: string, name: string, subjectCodes: { subjectId: string; code: string }[], totalAttendance: number): Promise<Student> {
    return request<Student>(`/api/projects/${projectId}/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, subjectCodes, totalAttendance })
    });
  },
  async deleteStudent(projectId: string, id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/projects/${projectId}/students/${id}`, {
      method: 'DELETE'
    });
  },

  // Mark Entries
  async getMarkEntries(projectId: string): Promise<MarkEntry[]> {
    return request<MarkEntry[]>(`/api/projects/${projectId}/mark-entries`);
  },
  async identifyKataCode(projectId: string, code: string): Promise<KataIdentification> {
    return request<KataIdentification>(`/api/projects/${projectId}/mark-entries/identify?code=${encodeURIComponent(code)}`);
  },
  async createMarkEntry(projectId: string, kataCode: string, obtainedMarks: number): Promise<MarkEntry> {
    return request<MarkEntry>(`/api/projects/${projectId}/mark-entries`, {
      method: 'POST',
      body: JSON.stringify({ kataCode, obtainedMarks })
    });
  },
  async updateMarkEntry(projectId: string, id: string, obtainedMarks: number): Promise<MarkEntry> {
    return request<MarkEntry>(`/api/projects/${projectId}/mark-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ obtainedMarks })
    });
  },
  async deleteMarkEntry(projectId: string, id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/projects/${projectId}/mark-entries/${id}`, {
      method: 'DELETE'
    });
  },

  // Results & Marksheet
  async getResults(projectId: string, search?: string): Promise<{
    project: {
      _id: string;
      name: string;
      totalWorkingDays: number;
      instituteName?: string;
      examName?: string;
      className?: string;
      sectionName?: string;
    };
    results: StudentResult[];
  }> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/projects/${projectId}/results${query}`);
  },
  async getMarksheet(projectId: string, studentId: string): Promise<MarksheetData> {
    return request<MarksheetData>(`/api/projects/${projectId}/results/${studentId}/marksheet`);
  }
};
