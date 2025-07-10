import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, File, Image, FileText, Video, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { FileCategory, isImageFile, isDocumentFile, isVideoFile, formatFileSize } from '@/lib/storage';

interface FileUploadProps {
  category: FileCategory;
  userId?: string;
  customPath?: string;
  multiple?: boolean;
  maxFiles?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (files: Array<{ url: string; path: string; fileName: string }>) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  uploadButtonText?: string;
  dragDropText?: string;
}

interface FileWithPreview extends File {
  preview?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  category,
  userId,
  customPath,
  multiple = false,
  maxFiles = 5,
  acceptedTypes,
  onUploadComplete,
  onUploadError,
  className = '',
  disabled = false,
  showPreview = true,
  uploadButtonText = 'Upload Files',
  dragDropText = 'Drag and drop files here, or click to select'
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadState, uploadSingleFile, uploadMultipleFiles, resetUploadState, clearError } = useFileUpload();

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Create preview URLs for images
    const filesWithPreview = fileArray.map(file => {
      const fileWithPreview: FileWithPreview = file;
      if (isImageFile(file) && showPreview) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });

    setSelectedFiles(prev => [...prev, ...filesWithPreview]);
  }, [selectedFiles.length, maxFiles, showPreview, onUploadError]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      
      // Clean up preview URL
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      clearError();
      
      if (multiple) {
        const results = await uploadMultipleFiles(selectedFiles, category, userId, customPath);
        if (results) {
          onUploadComplete?.(results);
          setSelectedFiles([]);
          resetUploadState();
        }
      } else {
        const result = await uploadSingleFile(selectedFiles[0], category, userId, customPath);
        if (result) {
          onUploadComplete?.([result]);
          setSelectedFiles([]);
          resetUploadState();
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  };

  const getFileIcon = (file: File) => {
    if (isImageFile(file)) return <Image className="h-4 w-4" />;
    if (isDocumentFile(file)) return <FileText className="h-4 w-4" />;
    if (isVideoFile(file)) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getAcceptedTypesString = () => {
    if (!acceptedTypes) return '';
    return acceptedTypes.join(',');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">{dragDropText}</p>
              <p className="text-sm text-gray-500">
                {acceptedTypes ? `Accepted types: ${acceptedTypes.join(', ')}` : 'All file types supported'}
              </p>
              <p className="text-sm text-gray-500">Maximum {maxFiles} files</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploadState.isUploading}
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={getAcceptedTypesString()}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={disabled || uploadState.isUploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploadState.isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadState.isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Uploading...</span>
            <span className="text-sm text-gray-500">{uploadState.progress}%</span>
          </div>
          <Progress value={uploadState.progress} className="w-full" />
        </div>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">{uploadState.error}</span>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && !uploadState.isUploading && (
        <Button
          onClick={handleUpload}
          disabled={disabled}
          className="w-full"
        >
          {uploadButtonText}
        </Button>
      )}

      {/* Uploaded Files */}
      {uploadState.uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadState.uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center">
                    <File className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.fileName}</p>
                    <Badge variant="secondary" className="text-xs">Uploaded</Badge>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 