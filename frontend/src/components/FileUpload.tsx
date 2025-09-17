import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

interface FileUploadResponse {
  message: string;
  content: {
    id: string;
    originalFilename: string;
    fileType: string;
    fileSize: number;
    uploadStatus: string;
    createdAt: string;
  };
}

interface ContentItem {
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  uploadStatus: string;
  createdAt: string;
  hasTopics: boolean;
}

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const queryClient = useQueryClient();

  // Fetch uploaded content
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const response = await api.get('/api/upload/content');
      return response.data;
    },
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<FileUploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', 'default-subject-id'); // TODO: Allow subject selection
      
      const response = await api.post('/api/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const response = await api.delete(`/api/upload/content/${contentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'primary';
      case 'processing': return 'warning';
      case 'processed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Study Materials
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Upload PDF documents and video files to generate personalized quizzes
      </Typography>

      {/* Upload Area */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {selectedFile ? selectedFile.name : 'Drop files here or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: PDF, MP4, AVI, MOV (max 100MB)
        </Typography>
        <input
          id="file-input"
          type="file"
          accept=".pdf,.mp4,.avi,.mov"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </Paper>

      {selectedFile && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected File:
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2">{selectedFile.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              startIcon={<CloudUploadIcon />}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
          {uploadMutation.isPending && (
            <LinearProgress sx={{ mt: 1 }} />
          )}
        </Box>
      )}

      {uploadMutation.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Upload failed: {(uploadMutation.error as any)?.response?.data?.message || 'Unknown error'}
        </Alert>
      )}

      {/* Uploaded Files List */}
      <Typography variant="h6" gutterBottom>
        Your Uploaded Files
      </Typography>
      
      {contentLoading ? (
        <LinearProgress />
      ) : contentData?.content?.length > 0 ? (
        <List>
          {contentData.content.map((item: ContentItem) => (
            <ListItem key={item.id} divider>
              <FileIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <ListItemText
                primary={item.originalFilename}
                secondary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption">
                      {formatFileSize(item.fileSize)} • {new Date(item.createdAt).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label={item.uploadStatus} 
                      size="small" 
                      color={getStatusColor(item.uploadStatus) as any}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No files uploaded yet. Start by uploading your first study material!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;