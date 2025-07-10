import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, ALLOWED_VIDEO_TYPES } from '@/lib/storage';
import { toast } from '@/components/ui/sonner';

export const FileUploadExample: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; path: string; fileName: string }>>([]);

  const handleUploadComplete = (files: Array<{ url: string; path: string; fileName: string }>) => {
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) uploaded successfully!`);
  };

  const handleUploadError = (error: string) => {
    toast.error(`Upload failed: ${error}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">File Upload Examples</h1>
        <p className="text-gray-600">Demonstrating different file upload scenarios</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile Picture</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="media">Media Files</TabsTrigger>
          <TabsTrigger value="general">General Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                category="profile"
                userId="user123"
                multiple={false}
                maxFiles={1}
                acceptedTypes={ALLOWED_IMAGE_TYPES}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                uploadButtonText="Upload Profile Picture"
                dragDropText="Drag and drop your profile picture here"
                showPreview={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                category="document"
                userId="user123"
                multiple={true}
                maxFiles={5}
                acceptedTypes={ALLOWED_DOCUMENT_TYPES}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                uploadButtonText="Upload Documents"
                dragDropText="Drag and drop your documents here"
                showPreview={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Files Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                category="general"
                userId="user123"
                multiple={true}
                maxFiles={10}
                acceptedTypes={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                uploadButtonText="Upload Media Files"
                dragDropText="Drag and drop your media files here"
                showPreview={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General File Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                category="general"
                userId="user123"
                multiple={true}
                maxFiles={20}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                uploadButtonText="Upload Files"
                dragDropText="Drag and drop any files here"
                showPreview={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Uploaded Files Summary */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <p className="text-sm text-gray-500">{file.path}</p>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 