"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileAudio,
  Upload,
  X,
  Play,
  Pause,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn, formatFileSize, formatDuration } from "@/lib/utils";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  duration?: number;
  transcript?: string;
}

export default function RecordingsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "uploading",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach((uploadedFile) => {
      simulateUpload(uploadedFile.id);
    });
  }, []);

  const simulateUpload = (fileId: string) => {
    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += 10;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: Math.min(progress, 100) } : f
        )
      );

      if (progress >= 100) {
        clearInterval(uploadInterval);
        // Start processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "processing" } : f
          )
        );

        // Simulate processing completion
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "completed",
                    duration: Math.floor(Math.random() * 600) + 60,
                    transcript:
                      "This is a sample transcript of the dental appointment...",
                  }
                : f
            )
          );
        }, 3000);
      }
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".webm"],
    },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-clinical-900">Recordings</h1>
        <p className="text-clinical-500 mt-1">
          Upload audio recordings for transcription
        </p>
      </div>

      {/* Appointment selector */}
      <div className="card p-6">
        <label className="label block mb-2">Select Appointment</label>
        <select
          value={selectedAppointment}
          onChange={(e) => setSelectedAppointment(e.target.value)}
          className="input max-w-md"
        >
          <option value="">Select an appointment...</option>
          <option value="1">PT-1001 - Today at 9:00 AM</option>
          <option value="2">PT-1002 - Today at 10:30 AM</option>
          <option value="3">PT-1003 - Today at 2:00 PM</option>
        </select>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          "card border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-dental-500 bg-dental-50"
            : "border-clinical-300 hover:border-dental-400 hover:bg-clinical-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              isDragActive ? "bg-dental-100" : "bg-clinical-100"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8",
                isDragActive ? "text-dental-600" : "text-clinical-400"
              )}
            />
          </div>
          <p className="text-lg font-medium text-clinical-900 mb-2">
            {isDragActive
              ? "Drop your files here"
              : "Drag & drop audio files here"}
          </p>
          <p className="text-sm text-clinical-500 mb-4">
            or click to browse from your computer
          </p>
          <p className="text-xs text-clinical-400">
            Supported formats: MP3, WAV, M4A, OGG, WebM (max 100MB)
          </p>
        </div>
      </div>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="card divide-y divide-clinical-100">
          {files.map((uploadedFile) => (
            <div key={uploadedFile.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-clinical-100 rounded-lg flex items-center justify-center">
                  <FileAudio className="w-6 h-6 text-clinical-600" />
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-clinical-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    {uploadedFile.status === "completed" && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {uploadedFile.status === "error" && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-clinical-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </span>
                    {uploadedFile.duration && (
                      <span className="text-sm text-clinical-500">
                        {formatDuration(uploadedFile.duration)}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-sm capitalize",
                        uploadedFile.status === "completed"
                          ? "text-green-600"
                          : uploadedFile.status === "error"
                          ? "text-red-600"
                          : "text-clinical-500"
                      )}
                    >
                      {uploadedFile.status === "uploading" &&
                        `Uploading ${uploadedFile.progress}%`}
                      {uploadedFile.status === "processing" && "Transcribing..."}
                      {uploadedFile.status === "completed" && "Ready"}
                      {uploadedFile.status === "error" && "Failed"}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {(uploadedFile.status === "uploading" ||
                    uploadedFile.status === "processing") && (
                    <div className="mt-2 h-1.5 bg-clinical-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          uploadedFile.status === "processing"
                            ? "bg-dental-500 animate-pulse w-full"
                            : "bg-dental-500"
                        )}
                        style={{
                          width:
                            uploadedFile.status === "uploading"
                              ? `${uploadedFile.progress}%`
                              : undefined,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {uploadedFile.status === "completed" && (
                    <>
                      <button className="btn btn-secondary text-sm">
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </button>
                      <button className="btn btn-primary text-sm">
                        Generate Note
                      </button>
                    </>
                  )}
                  {uploadedFile.status === "processing" && (
                    <Loader2 className="w-5 h-5 text-dental-500 animate-spin" />
                  )}
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="p-2 text-clinical-400 hover:text-clinical-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

