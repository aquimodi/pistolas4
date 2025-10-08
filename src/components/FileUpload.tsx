import React, { useState, useRef, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { Upload, X, File, CheckCircle, AlertCircle, Camera } from 'lucide-react';

interface FileUploadProps {
  onFileUploaded: (filePath: string) => void;
  currentFile?: string;
  accept?: string;
  maxSize?: number; // in MB
  uploadType: 'projects' | 'delivery_notes' | 'equipment';
  label?: string;
  className?: string;
  projectName: string; // REQUIRED: Project name for organizing files
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  currentFile,
  accept = '.pdf,.docx,.xlsx,.doc,.xls,.csv',
  maxSize = 10,
  uploadType,
  label = 'Upload File',
  className = '',
  projectName
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(currentFile || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addNotification } = useNotification();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not allowed. Accepted types: ${accept}`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_name', projectName); // Add project name to form data

      const response = await fetch(`/api/upload/${uploadType}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadedFile(result.filePath);
      onFileUploaded(result.filePath);
      
      addNotification({
        type: 'success',
        title: 'File Uploaded',
        message: `${file.name} uploaded successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    await uploadFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileSelect(e.target.files);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setError(null);
    onFileUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : uploadedFile
            ? 'border-green-400 bg-green-50'
            : error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />
        
        {/* Display based on upload status */}

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-2">
              <div className="animate-spin mx-auto h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-600">Uploading file...</p>
            </div>
          ) : uploadedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center justify-between bg-white border border-green-200 rounded p-3">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {getFileName(uploadedFile)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-green-600">File uploaded successfully</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                {error ? (
                  <AlertCircle className="h-8 w-8 text-red-500" />
                ) : (
                  uploadType === 'equipment' ? (
                    <Camera className="h-8 w-8 text-gray-400" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400" />
                  )
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {isDragging ? 'Drop file here' : 
                   uploadType === 'equipment' ? 'Drag & drop photo here' : 'Drag & drop file here'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or click to browse • Max {maxSize}MB • {uploadType === 'equipment' ? 'Images' : accept.replace(/\./g, '').toUpperCase()}
                </p>
              </div>
              {error && (
                <p className="text-xs text-red-600 mt-2">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;