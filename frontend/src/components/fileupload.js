import React, { useState } from 'react';
import { Button, Typography, Box, LinearProgress } from '@mui/material';
import axios from 'axios';

function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'text/plain', 'text/csv'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      setMessage('Error: Only PDF, TXT, and CSV files are allowed');
      return;
    }

    if (file.size > maxSize) {
      setMessage(`Error: File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setMessage(response.data.message || 'File uploaded successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to upload file';
      setMessage(`Error: ${errorMessage}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Upload Document
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
        <input
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="raised-button-file">
          <Button variant="outlined" component="span" size="small">
            Choose File
          </Button>
        </label>
        
        <Button
          variant="outlined"
          onClick={handleUpload}
          disabled={!file || uploading}
          size="small"
        >
          Upload
        </Button>
      </Box>

      {file && (
        <Typography variant="caption" align="center" sx={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {file.name}
        </Typography>
      )}
      
      {uploading && <LinearProgress sx={{ mt: 1 }} />}
      
      {message && (
        <Typography 
          variant="caption" 
          color={message.includes('Error') ? 'error' : 'success'}
          align="center"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default FileUpload;
