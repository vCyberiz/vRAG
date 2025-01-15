import React, { useState } from 'react';
import { ThemeProvider, createTheme, Container, CssBaseline, Typography, Box, Grid, Paper } from '@mui/material';
import QueryInterface from './components/queryinterface';
import FileUpload from './components/fileupload';
import DocumentManager from './components/documentmanager';
import '@fontsource/montserrat';
import './styles/main.css';

const theme = createTheme({
  palette: {
    background: {
      default: '#fdf6e3',
      paper: 'rgba(255, 255, 255, 0.9)',
    },
    primary: {
      main: '#cb4b16',
    },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDocumentSelection = (documents) => {
    setSelectedDocuments(documents);
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 3 }}>
        <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 3 }}>
          {/* Admin Panel */}
          <Box sx={{ width: 320, display: 'flex', flexDirection: 'column' }}>
            {/* Title */}
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #cb4b16 30%, #dc322f 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                textAlign: 'center',
                width: '100%'
              }}
            >
              vRAG
            </Typography>

            {/* Admin Content */}
            <Paper 
              elevation={3} 
              sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              {/* Documents Section */}
              <Box sx={{ 
                flex: 1,
                overflowY: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}>
                <DocumentManager 
                  onSelectionChange={handleDocumentSelection} 
                  refreshTrigger={refreshTrigger}
                />
              </Box>

              {/* Upload Section */}
              <Box sx={{ 
                borderTop: '1px solid rgba(0,0,0,0.1)',
                p: 3,
              }}>
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </Box>
            </Paper>
          </Box>

          {/* Chat Interface */}
          <Paper 
            elevation={3} 
            sx={{ 
              flex: 1,
              display: 'flex',
              overflow: 'hidden'
            }}
          >
            <QueryInterface selectedDocuments={selectedDocuments} />
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;