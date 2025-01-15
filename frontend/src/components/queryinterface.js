import React, { useState, useRef } from 'react';
import { TextField, Button, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';
import QueryResults from './queryresults';

function QueryInterface({ selectedDocuments }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  const handleStop = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setError('Response generation stopped');
      // Remove the last question since we stopped the response
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Clear any previous error
    setError('');
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    // Add the question to messages immediately
    const newQuestion = { type: 'question', question: query };
    setMessages(prev => [...prev, newQuestion]);

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/query', {
        question: query,
        documents: selectedDocuments
      }, {
        signal: abortControllerRef.current.signal,
        timeout: 60000 // 60 second timeout
      });
      
      // Add the answer to messages
      const newAnswer = { 
        type: 'answer', 
        answer: response.data.data?.answer || 'No answer provided',
        sources: response.data.data?.sources || []
      };
      setMessages(prev => [...prev, newAnswer]);
      setQuery(''); // Clear input after successful query
    } catch (error) {
      if (axios.isCancel(error)) {
        // Don't set error message here as it's handled in handleStop
        return;
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.response?.data?.message || 'Failed to get response');
      }
      // Remove the question if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const getPlaceholderText = () => {
    return selectedDocuments.length > 0
      ? "Ask a question about your documents..."
      : "Select documents to ask questions about them";
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%',
      position: 'relative'
    }}>
      {/* Chat Window */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        mb: 2,
        px: 2
      }}>
        <QueryResults messages={messages} isLoading={loading} />
      </Box>

      {/* Input Area */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          borderRadius: '16px',
          backgroundColor: 'background.paper',
        }}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            multiline
            rows={2}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 2 
          }}>
            {loading ? (
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleStop}
                sx={{ minWidth: 100 }}
              >
                Stop
              </Button>
            ) : (
              <Button 
                variant="outlined" 
                type="submit"
                disabled={!query.trim() || selectedDocuments.length === 0}
                sx={{ minWidth: 100 }}
              >
                Ask
              </Button>
            )}
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default QueryInterface;
