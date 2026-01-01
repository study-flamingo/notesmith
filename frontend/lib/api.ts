<<<<<<< Updated upstream
/**
 * API client for NoteSmith backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type RequestOptions = {
    method?: string;
    body?: unknown;
    token?: string;
};

async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, token } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_BASE}${endpoint}`;
    console.log(`[API] ${method} ${url}`);

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `API error: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Appointments API
export const appointmentsApi = {
    list: (token: string, params?: { practice_id?: string; status?: string }) =>
        apiRequest<Appointment[]>(
            `/api/v1/appointments${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""}`,
            { token }
        ),

    get: (token: string, id: string) =>
        apiRequest<Appointment>(`/api/v1/appointments/${id}`, { token }),

    create: (token: string, data: AppointmentCreate) =>
        apiRequest<Appointment>("/api/v1/appointments", {
            method: "POST",
            body: data,
            token,
        }),

    update: (token: string, id: string, data: Partial<Appointment>) =>
        apiRequest<Appointment>(`/api/v1/appointments/${id}`, {
            method: "PATCH",
            body: data,
            token,
        }),

    delete: (token: string, id: string) =>
        apiRequest<void>(`/api/v1/appointments/${id}`, {
            method: "DELETE",
            token,
        }),

    process: (token: string, id: string) =>
        apiRequest<{ message: string; task_id: string; appointment_id: string }>(
            `/api/v1/appointments/${id}/process`,
            { method: "POST", token }
        ),
};

// Recordings API
export const recordingsApi = {
    upload: async (token: string, appointmentId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${API_BASE}/api/v1/recordings/upload/${appointmentId}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Upload failed");
        }

        return response.json() as Promise<Recording>;
    },

    get: (token: string, id: string) =>
        apiRequest<Recording>(`/api/v1/recordings/${id}`, { token }),

    listForAppointment: (token: string, appointmentId: string) =>
        apiRequest<Recording[]>(`/api/v1/recordings/appointment/${appointmentId}`, {
            token,
        }),
};

// Transcripts API
export const transcriptsApi = {
    generate: (token: string, recordingId: string) =>
        apiRequest<Transcript>(`/api/v1/transcripts/generate/${recordingId}`, {
            method: "POST",
            token,
        }),

    get: (token: string, id: string) =>
        apiRequest<Transcript>(`/api/v1/transcripts/${id}`, { token }),

    getForRecording: (token: string, recordingId: string) =>
        apiRequest<Transcript>(`/api/v1/transcripts/recording/${recordingId}`, {
            token,
        }),
};

// Templates API
export const templatesApi = {
    list: (token: string, params?: { practice_id?: string; type?: string }) =>
        apiRequest<Template[]>(
            `/api/v1/templates/${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""}`,
            { token }
        ),

    get: (token: string, id: string) =>
        apiRequest<Template>(`/api/v1/templates/${id}`, { token }),

    create: (token: string, data: TemplateCreate) =>
        apiRequest<Template>("/api/v1/templates/", {
            method: "POST",
            body: data,
            token,
        }),

    update: (token: string, id: string, data: Partial<Template>) =>
        apiRequest<Template>(`/api/v1/templates/${id}`, {
            method: "PATCH",
            body: data,
            token,
        }),

    delete: (token: string, id: string) =>
        apiRequest<void>(`/api/v1/templates/${id}`, {
            method: "DELETE",
            token,
        }),
};

// Clinical Notes API
export const notesApi = {
    generate: (token: string, data: NoteCreate) =>
        apiRequest<ClinicalNote>("/api/v1/notes/generate", {
            method: "POST",
            body: data,
            token,
        }),

    get: (token: string, id: string) =>
        apiRequest<ClinicalNote>(`/api/v1/notes/${id}`, { token }),

    listForTranscript: (token: string, transcriptId: string) =>
        apiRequest<ClinicalNote[]>(`/api/v1/notes/transcript/${transcriptId}`, {
            token,
        }),

    update: (token: string, id: string, data: Partial<ClinicalNote>) =>
        apiRequest<ClinicalNote>(`/api/v1/notes/${id}`, {
            method: "PATCH",
            body: data,
            token,
        }),

    export: async (token: string, id: string, format: "pdf" | "docx") => {
        const response = await fetch(
            `${API_BASE}/api/v1/notes/${id}/export/${format}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            throw new Error("Export failed");
        }

        return response.blob();
    },
};

// Types
export interface Appointment {
    id: string;
    practice_id: string;
    patient_ref: string;
    appointment_date: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    notes?: string;
    template_ids?: string[];
    created_at: string;
    updated_at?: string;
}

export interface AppointmentCreate {
    practice_id: string;
    patient_ref: string;
    appointment_date: string;
    notes?: string;
    template_ids?: string[];
}

export interface Recording {
    id: string;
    appointment_id: string;
    storage_path: string;
    filename: string;
    content_type: string;
    file_size: number;
    duration_seconds?: number;
    status: string;
    created_at: string;
}

export interface Transcript {
    id: string;
    recording_id: string;
    content: string;
    segments: TranscriptSegment[];
    speaker_labels: SpeakerLabel[];
    status: "pending" | "processing" | "completed" | "failed";
    language: string;
    word_count?: number;
    created_at: string;
}

export interface TranscriptSegment {
    start_time: number;
    end_time: number;
    text: string;
    speaker?: string;
    confidence?: number;
}

export interface SpeakerLabel {
    speaker_id: string;
    label: string;
}

export interface Template {
    id: string;
    practice_id?: string;
    name: string;
    description?: string;
    template_type: "soap" | "dap" | "narrative" | "custom";
    content: string;
    variables: TemplateVariable[];
    is_default: boolean;
    is_active: boolean;
    version: number;
    created_at: string;
}

export interface TemplateVariable {
    name: string;
    description: string;
    required: boolean;
    default_value?: string;
}

export interface TemplateCreate {
    practice_id?: string;
    name: string;
    description?: string;
    template_type: string;
    content: string;
    variables?: TemplateVariable[];
}

export interface ClinicalNote {
    id: string;
    transcript_id: string;
    template_id: string;
    generated_content: string;
    final_content?: string;
    analysis?: AnalysisResult;
    status: "draft" | "generated" | "reviewed" | "finalized" | "exported";
    reviewed_at?: string;
    finalized_at?: string;
    created_at: string;
}

export interface NoteCreate {
    transcript_id: string;
    template_id: string;
}

export interface AnalysisResult {
    chief_complaint?: string;
    procedures: string[];
    findings: string[];
    recommendations: string[];
    summary?: string;
}

=======
/**
 * API client for NoteSmith backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type RequestOptions = {
    method?: string;
    body?: unknown;
    token?: string;
};

async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, token } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `API error: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Appointments API
export const appointmentsApi = {
    list: (token: string, params?: { practice_id?: string; status?: string }) =>
        apiRequest<Appointment[]>(
            `/api/v1/appointments${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""}`,
            { token }
        ),

    get: (token: string, id: string) =>
        apiRequest<Appointment>(`/api/v1/appointments/${id}`, { token }),

    create: (token: string, data: AppointmentCreate) =>
        apiRequest<Appointment>("/api/v1/appointments", {
            method: "POST",
            body: data,
            token,
        }),

    update: (token: string, id: string, data: Partial<Appointment>) =>
        apiRequest<Appointment>(`/api/v1/appointments/${id}`, {
            method: "PATCH",
            body: data,
            token,
        }),

    delete: (token: string, id: string) =>
        apiRequest<void>(`/api/v1/appointments/${id}`, {
            method: "DELETE",
            token,
        }),
};

// Recordings API
export const recordingsApi = {
    upload: async (token: string, appointmentId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${API_BASE}/api/v1/recordings/upload/${appointmentId}`,
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Upload failed");
        }

        return response.json() as Promise<Recording>;
    },

    get: (token: string, id: string) =>
        apiRequest<Recording>(`/api/v1/recordings/${id}`, { token }),

    listForAppointment: (token: string, appointmentId: string) =>
        apiRequest<Recording[]>(`/api/v1/recordings/appointment/${appointmentId}`, {
            token,
        }),
};

// Transcripts API
export const transcriptsApi = {
    generate: (token: string, recordingId: string) =>
        apiRequest<Transcript>(`/api/v1/transcripts/generate/${recordingId}`, {
            method: "POST",
            token,
        }),

    get: (token: string, id: string) =>
        apiRequest<Transcript>(`/api/v1/transcripts/${id}`, { token }),

    getForRecording: (token: string, recordingId: string) =>
        apiRequest<Transcript>(`/api/v1/transcripts/recording/${recordingId}`, {
            token,
        }),
};

// Templates API
export const templatesApi = {
    list: (token: string, params?: { practice_id?: string; type?: string }) =>
        apiRequest<Template[]>(
            `/api/v1/templates/${params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""}`,
            { token }
        ),

    get: (token: string, id: string) =>
        apiRequest<Template>(`/api/v1/templates/${id}`, { token }),

    create: (token: string, data: TemplateCreate) =>
        apiRequest<Template>("/api/v1/templates/", {
            method: "POST",
            body: data,
            token,
        }),

    update: (token: string, id: string, data: Partial<Template>) =>
        apiRequest<Template>(`/api/v1/templates/${id}`, {
            method: "PATCH",
            body: data,
            token,
        }),

    delete: (token: string, id: string) =>
        apiRequest<void>(`/api/v1/templates/${id}`, {
            method: "DELETE",
            token,
        }),
};

// Clinical Notes API
export const notesApi = {
    generate: (token: string, data: NoteCreate) =>
        apiRequest<ClinicalNote>("/api/v1/notes/generate", {
            method: "POST",
            body: data,
            token,
        }),

    get: (token: string, id: string) =>
        apiRequest<ClinicalNote>(`/api/v1/notes/${id}`, { token }),

    listForTranscript: (token: string, transcriptId: string) =>
        apiRequest<ClinicalNote[]>(`/api/v1/notes/transcript/${transcriptId}`, {
            token,
        }),

    update: (token: string, id: string, data: Partial<ClinicalNote>) =>
        apiRequest<ClinicalNote>(`/api/v1/notes/${id}`, {
            method: "PATCH",
            body: data,
            token,
        }),

    export: async (token: string, id: string, format: "pdf" | "docx") => {
        const response = await fetch(
            `${API_BASE}/api/v1/notes/${id}/export/${format}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!response.ok) {
            throw new Error("Export failed");
        }

        return response.blob();
    },
};

// Types
export interface Appointment {
    id: string;
    practice_id: string;
    patient_ref: string;
    appointment_date: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export interface AppointmentCreate {
    practice_id: string;
    patient_ref: string;
    appointment_date: string;
    notes?: string;
}

export interface Recording {
    id: string;
    appointment_id: string;
    storage_path: string;
    filename: string;
    content_type: string;
    file_size: number;
    duration_seconds?: number;
    status: string;
    created_at: string;
}

export interface Transcript {
    id: string;
    recording_id: string;
    content: string;
    segments: TranscriptSegment[];
    speaker_labels: SpeakerLabel[];
    status: "pending" | "processing" | "completed" | "failed";
    language: string;
    word_count?: number;
    created_at: string;
}

export interface TranscriptSegment {
    start_time: number;
    end_time: number;
    text: string;
    speaker?: string;
    confidence?: number;
}

export interface SpeakerLabel {
    speaker_id: string;
    label: string;
}

export interface Template {
    id: string;
    practice_id?: string;
    name: string;
    description?: string;
    template_type: "soap" | "dap" | "narrative" | "custom";
    content: string;
    variables: TemplateVariable[];
    is_default: boolean;
    is_active: boolean;
    version: number;
    created_at: string;
}

export interface TemplateVariable {
    name: string;
    description: string;
    required: boolean;
    default_value?: string;
}

export interface TemplateCreate {
    practice_id?: string;
    name: string;
    description?: string;
    template_type: string;
    content: string;
    variables?: TemplateVariable[];
}

export interface ClinicalNote {
    id: string;
    transcript_id: string;
    template_id: string;
    generated_content: string;
    final_content?: string;
    analysis?: AnalysisResult;
    status: "draft" | "generated" | "reviewed" | "finalized" | "exported";
    reviewed_at?: string;
    finalized_at?: string;
    created_at: string;
}

export interface NoteCreate {
    transcript_id: string;
    template_id: string;
}

export interface AnalysisResult {
    chief_complaint?: string;
    procedures: string[];
    findings: string[];
    recommendations: string[];
    summary?: string;
}

>>>>>>> Stashed changes
