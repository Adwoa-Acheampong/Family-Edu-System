import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, X } from 'lucide-react';
import { User } from '../types';
import { apiFetch } from '../lib/apiCore';

interface DocumentUploaderProps {
  user: User;
}

export function DocumentUploader({ user }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name.split('.')[0]); // Default title to filename
      }
      setUploadStatus('idle');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!title) {
        setTitle(e.dataTransfer.files[0].name.split('.')[0]);
      }
      setUploadStatus('idle');
    }
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('userId', user.id);

      await apiFetch('/api/documents/upload', formData, 'POST');
      
      setUploadStatus('success');
      setTimeout(() => {
        clearFile();
      }, 3000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Upload size={18} className="text-[var(--theme-color)]" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
          Upload Study Material
        </h2>
      </div>

      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] p-5 sm:p-6">
        <form onSubmit={handleUpload}>
          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--theme-color)] transition-colors"
            >
              <Upload size={40} className="text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drag and drop a document here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports PDF, DOCX, TXT, and Images
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black rounded-xl border border-black/10 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <FileText className="text-[var(--theme-color)]" size={24} />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isUploading && (
                  <button type="button" onClick={clearFile} className="text-gray-500 hover:text-red-500">
                    <X size={20} />
                  </button>
                )}
              </div>
              
              <label className="block">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Document Title
                </span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  className="w-full h-11 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black px-4 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[var(--theme-color)]"
                />
              </label>

              <div className="flex items-center gap-4 mt-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="h-11 px-6 rounded-xl bg-[var(--theme-color)] text-black font-bold text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isUploading ? 'Uploading & Analyzing...' : 'Upload to Engine Room'}
                </button>
                
                {uploadStatus === 'success' && (
                  <span className="flex items-center gap-2 text-sm font-bold text-green-500">
                    <CheckCircle2 size={16} /> Successfully Uploaded
                  </span>
                )}
                {uploadStatus === 'error' && (
                  <span className="text-sm font-bold text-red-500">
                    {errorMessage}
                  </span>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
