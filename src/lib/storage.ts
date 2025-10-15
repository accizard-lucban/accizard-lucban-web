import { storage } from './firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  UploadResult,
  StorageReference
} from 'firebase/storage';

// File type validation
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// File type categories
export type FileCategory = 'profile' | 'validId' | 'document' | 'announcement' | 'report' | 'general';

// Upload progress callback type
export type UploadProgressCallback = (progress: number) => void;

// File validation
export const validateFile = (file: File, allowedTypes: string[] = ALLOWED_IMAGE_TYPES): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  return { isValid: true };
};

// Generate unique filename
export const generateFileName = (originalName: string, userId?: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
};

// Upload single file
export const uploadFile = async (
  file: File,
  category: FileCategory,
  userId?: string,
  customPath?: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string; fileName: string }> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate file path
    const fileName = generateFileName(file.name, userId);
    const filePath = customPath || `${category}/${userId || 'anonymous'}/${fileName}`;
    const storageRef = ref(storage, filePath);

    // Upload file
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: filePath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (
  files: File[],
  category: FileCategory,
  userId?: string,
  customPath?: string,
  onProgress?: UploadProgressCallback
): Promise<Array<{ url: string; path: string; fileName: string }>> => {
  const uploadPromises = files.map((file, index) => {
    const fileCustomPath = customPath ? `${customPath}/${index + 1}` : undefined;
    return uploadFile(file, category, userId, fileCustomPath, onProgress);
  });

  return Promise.all(uploadPromises);
};

// Upload profile picture
export const uploadProfilePicture = async (
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string; fileName: string }> => {
  return uploadFile(file, 'profile', userId, `profile-pictures-web/${userId}/profile`, onProgress);
};

// Upload valid ID image
export const uploadValidIdImage = async (
  file: File,
  userId: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string; fileName: string }> => {
  return uploadFile(file, 'validId', userId, `validIds/${userId}/id`, onProgress);
};

// Upload document
export const uploadDocument = async (
  file: File,
  userId: string,
  documentType: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string; fileName: string }> => {
  return uploadFile(file, 'document', userId, `documents/${userId}/${documentType}`, onProgress);
};

// Upload announcement media
export const uploadAnnouncementMedia = async (
  file: File,
  announcementId: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string; fileName: string }> => {
  return uploadFile(file, 'announcement', undefined, `announcements/${announcementId}/media`, onProgress);
};

// Upload report media
export const uploadReportMedia = async (
  file: File,
  reportId: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; path: string; fileName: string }> => {
  return uploadFile(file, 'report', undefined, `reports/${reportId}/media`, onProgress);
};

// Delete file
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete multiple files
export const deleteMultipleFiles = async (filePaths: string[]): Promise<void> => {
  const deletePromises = filePaths.map(path => deleteFile(path));
  await Promise.all(deletePromises);
};

// Get file download URL
export const getFileDownloadURL = async (filePath: string): Promise<string> => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// List files in a directory
export const listFiles = async (directoryPath: string): Promise<string[]> => {
  try {
    const directoryRef = ref(storage, directoryPath);
    const result = await listAll(directoryRef);
    return result.items.map(item => item.fullPath);
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Compress image before upload (for browser compatibility)
export const compressImage = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Create a reusable upload hook for React components
export const useFileUpload = () => {
  const uploadWithProgress = async (
    file: File,
    category: FileCategory,
    userId?: string,
    customPath?: string,
    onProgress?: UploadProgressCallback
  ) => {
    try {
      // Compress image if it's an image file
      let fileToUpload = file;
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        fileToUpload = await compressImage(file);
      }

      const result = await uploadFile(fileToUpload, category, userId, customPath, onProgress);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  return { uploadWithProgress };
};

// Utility function to check if file is an image
export const isImageFile = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
};

// Utility function to check if file is a document
export const isDocumentFile = (file: File): boolean => {
  return ALLOWED_DOCUMENT_TYPES.includes(file.type);
};

// Utility function to check if file is a video
export const isVideoFile = (file: File): boolean => {
  return ALLOWED_VIDEO_TYPES.includes(file.type);
};

// Get file extension
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 