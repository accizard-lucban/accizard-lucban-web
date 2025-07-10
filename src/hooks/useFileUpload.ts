import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import {
  uploadFile as uploadFileUtil,
  uploadMultipleFiles as uploadMultipleFilesUtil,
  uploadProfilePicture as uploadProfilePictureUtil,
  uploadValidIdImage as uploadValidIdImageUtil,
  uploadDocument as uploadDocumentUtil,
  uploadAnnouncementMedia as uploadAnnouncementMediaUtil,
  uploadReportMedia as uploadReportMediaUtil,
  validateFile,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_VIDEO_TYPES,
  FileCategory,
  UploadProgressCallback,
  formatFileSize
} from '@/lib/storage';

interface UploadState {
  isUploading: boolean;
  progress: number;
  uploadedFiles: Array<{ url: string; path: string; fileName: string }>;
  error: string | null;
}

interface UseFileUploadReturn {
  uploadState: UploadState;
  uploadSingleFile: (file: File, category: FileCategory, userId?: string, customPath?: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  uploadMultipleFiles: (files: File[], category: FileCategory, userId?: string, customPath?: string) => Promise<Array<{ url: string; path: string; fileName: string }> | null>;
  uploadProfilePicture: (file: File, userId: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  uploadValidIdImage: (file: File, userId: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  uploadDocument: (file: File, userId: string, documentType: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  uploadAnnouncementMedia: (file: File, announcementId: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  uploadReportMedia: (file: File, reportId: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  validateAndUpload: (file: File, category: FileCategory, userId?: string, customPath?: string) => Promise<{ url: string; path: string; fileName: string } | null>;
  resetUploadState: () => void;
  clearError: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploadedFiles: [],
    error: null
  });

  const updateProgress: UploadProgressCallback = useCallback((progress: number) => {
    setUploadState(prev => ({ ...prev, progress }));
  }, []);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      uploadedFiles: [],
      error: null
    });
  }, []);

  const clearError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

  const uploadSingleFile = useCallback(async (
    file: File,
    category: FileCategory,
    userId?: string,
    customPath?: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadFileUtil(file, category, userId, customPath, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }));

      toast.success(`File "${file.name}" uploaded successfully!`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    category: FileCategory,
    userId?: string,
    customPath?: string
  ): Promise<Array<{ url: string; path: string; fileName: string }> | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const results = await uploadMultipleFilesUtil(files, category, userId, customPath, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, ...results]
      }));

      toast.success(`${files.length} files uploaded successfully!`);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const uploadProfilePicture = useCallback(async (
    file: File,
    userId: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadProfilePictureUtil(file, userId, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }));

      toast.success('Profile picture uploaded successfully!');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Profile picture upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const uploadValidIdImage = useCallback(async (
    file: File,
    userId: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadValidIdImageUtil(file, userId, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }));

      toast.success('Valid ID image uploaded successfully!');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Valid ID upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const uploadDocument = useCallback(async (
    file: File,
    userId: string,
    documentType: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadDocumentUtil(file, userId, documentType, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }));

      toast.success(`Document "${file.name}" uploaded successfully!`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Document upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const uploadAnnouncementMedia = useCallback(async (
    file: File,
    announcementId: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadAnnouncementMediaUtil(file, announcementId, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }));

      toast.success('Announcement media uploaded successfully!');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Announcement media upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const uploadReportMedia = useCallback(async (
    file: File,
    reportId: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    try {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }));

      const result = await uploadReportMediaUtil(file, reportId, updateProgress);
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedFiles: [...prev.uploadedFiles, result]
      }));

      toast.success('Report media uploaded successfully!');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage
      }));
      toast.error(`Report media upload failed: ${errorMessage}`);
      return null;
    }
  }, [updateProgress]);

  const validateAndUpload = useCallback(async (
    file: File,
    category: FileCategory,
    userId?: string,
    customPath?: string
  ): Promise<{ url: string; path: string; fileName: string } | null> => {
    // Determine allowed types based on category
    let allowedTypes = ALLOWED_IMAGE_TYPES;
    if (category === 'document') {
      allowedTypes = ALLOWED_DOCUMENT_TYPES;
    } else if (category === 'general') {
      allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_VIDEO_TYPES];
    }

    // Validate file
    const validation = validateFile(file, allowedTypes);
    if (!validation.isValid) {
      toast.error(validation.error || 'File validation failed');
      return null;
    }

    // Show file info
    toast.info(`Uploading ${file.name} (${formatFileSize(file.size)})`);

    // Upload file
    return await uploadSingleFile(file, category, userId, customPath);
  }, [uploadSingleFile]);

  return {
    uploadState,
    uploadSingleFile,
    uploadMultipleFiles,
    uploadProfilePicture,
    uploadValidIdImage,
    uploadDocument,
    uploadAnnouncementMedia,
    uploadReportMedia,
    validateAndUpload,
    resetUploadState,
    clearError
  };
}; 