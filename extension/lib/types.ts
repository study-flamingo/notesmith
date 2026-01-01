/**
 * Shared type definitions for the extension
 */

export interface Note {
  id: string;
  content: string;
  patientName?: string;
  appointmentDate?: string;
  templateName?: string;
  status: 'pending' | 'inserted';
  createdAt: string;
}

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: number;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  practiceName?: string;
}

