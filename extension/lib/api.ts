/**
 * NoteSmith API client for the extension
 */

import { storage } from './storage';
import type { Note } from './types';

// TODO: Make configurable via options page
const API_BASE_URL = 'http://localhost:8000/api/v1';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await storage.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear auth
        await storage.clearAuth();
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get recent notes for the current user
   */
  async getNotes(): Promise<Note[]> {
    // TODO: Implement actual endpoint
    // return this.request<Note[]>('/notes/pending');

    // Mock data for development
    return [
      {
        id: '1',
        content:
          'Chief Complaint: Patient presents for routine cleaning.\n\nExamination: All teeth present and in good condition. No visible decay or periodontal issues.\n\nTreatment: Prophylaxis completed. Fluoride treatment applied.\n\nRecommendations: Continue regular brushing and flossing. Return in 6 months.',
        patientName: 'John Smith',
        appointmentDate: '2024-12-10',
        templateName: 'Routine Exam',
        status: 'pending',
        createdAt: '2024-12-10T10:30:00Z',
      },
      {
        id: '2',
        content:
          'Chief Complaint: Tooth sensitivity on upper right.\n\nExamination: Class II cavity identified on tooth #3.\n\nTreatment: Composite filling placed.\n\nRecommendations: Avoid hard foods for 24 hours. Use sensitivity toothpaste.',
        patientName: 'Jane Doe',
        appointmentDate: '2024-12-10',
        templateName: 'Restorative',
        status: 'pending',
        createdAt: '2024-12-10T11:00:00Z',
      },
    ];
  }

  /**
   * Get a single note by ID
   */
  async getNote(id: string): Promise<Note> {
    return this.request<Note>(`/notes/${id}`);
  }

  /**
   * Mark a note as inserted (for audit trail)
   */
  async markInserted(id: string): Promise<void> {
    await this.request(`/notes/${id}/mark-inserted`, { method: 'POST' });
  }
}

export const api = new ApiClient();

