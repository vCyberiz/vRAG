import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox, 
  FormControlLabel, 
  Typography, 
  Box, 
  CircularProgress 
} from '@mui/material';

function DocumentManager({ onSelectionChange, refreshTrigger }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/documents');
        console.log('Fetched documents:', response.data);
        
        // Extract documents from nested response
        const docList = response.data?.data?.documents || [];
        
        setDocuments(docList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to fetch documents');
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [refreshTrigger]);

  const handleDocumentToggle = (docName) => {
    const currentIndex = selectedDocs.indexOf(docName);
    const newSelectedDocs = [...selectedDocs];

    if (currentIndex === -1) {
      newSelectedDocs.push(docName);
    } else {
      newSelectedDocs.splice(currentIndex, 1);
    }

    setSelectedDocs(newSelectedDocs);
    onSelectionChange(newSelectedDocs);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ 
      overflowY: 'auto', 
      maxHeight: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" align="center" sx={{ mb: 2 }}>
        Available Documents
      </Typography>
      
      {documents.length === 0 ? (
        <Typography align="center" color="textSecondary">
          No documents available
        </Typography>
      ) : (
        <List dense>
          {documents.map((doc) => (
            <ListItem key={doc} disablePadding>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedDocs.indexOf(doc) !== -1}
                    onChange={() => handleDocumentToggle(doc)}
                  />
                }
                label={doc}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default DocumentManager;
