import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import './queryresults.css';

function LoadingBubbles() {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'flex-start',
      mb: 1
    }}>
      <Box className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </Box>
    </Box>
  );
}

function QueryResults({ messages, isLoading }) {
  if (!messages || messages.length === 0) return null;

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      pt: 4,
      overflowY: 'auto',
      overflowX: 'hidden',
      '&::-webkit-scrollbar': {
        width: '6px'
      },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(0,0,0,0.05)'
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '3px'
      }
    }}>
      {messages.map((message, index) => (
        <Box key={index} sx={{ mb: 3, mt: index === 0 ? 2 : 0 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            mb: 1,
            justifyContent: message.type === 'question' ? 'flex-end' : 'flex-start'
          }}>
            <Paper 
              elevation={0}
              sx={{ 
                bgcolor: message.type === 'question' ? 'primary.main' : 'grey.100',
                color: message.type === 'question' ? 'white' : 'text.primary',
                p: 2.5,
                borderRadius: '18px',
                maxWidth: 'calc(100% - 32px)',
                minWidth: '120px',
                width: 'fit-content',
                borderTopRightRadius: message.type === 'question' ? '18px' : '4px',
                borderTopLeftRadius: message.type === 'question' ? '4px' : '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  [message.type === 'question' ? 'right' : 'left']: '-8px',
                  top: '12px',
                  border: '8px solid transparent',
                  borderRightColor: message.type === 'question' ? 'primary.main' : 'grey.100',
                  transform: message.type === 'question' ? 'rotate(-90deg)' : 'rotate(90deg)'
                }
              }}
            >
              <Typography 
                variant="body1" 
                sx={{
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {message.type === 'question' ? message.question : message.answer}
              </Typography>
            </Paper>
          </Box>
          
          {message.type === 'answer' && message.sources && message.sources.length > 0 && (
            <Box sx={{ 
              ml: 2, 
              mt: 1, 
              maxWidth: '70%',
              p: 2,
              bgcolor: 'rgba(0,0,0,0.02)',
              borderRadius: 2,
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
                Sources:
          </Typography>
              {message.sources.map((source, sourceIndex) => {
                const documentName = source.metadata?.source || 'Document';
                return (
                  <Box key={sourceIndex} sx={{ 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {documentName} - {source.content.substring(0, 100)}...
                    </Typography>
                  </Box>
                );
              })}
          </Box>
          )}
          
          {index < messages.length - 1 && (
            <Divider sx={{ my: 3 }} />
      )}
        </Box>
      ))}
      {isLoading && <LoadingBubbles />}
    </Box>
  );
}

                        } catch (error) {
                          console.error('Error deleting document:', error);
                        }
                      }}
                      sx={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'error.main',
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Delete
                    </Box>
                  </Box>
                );
              })}
          </Box>
          )}
          
          {index < messages.length - 1 && (
            <Divider sx={{ my: 3 }} />
      )}
        </Box>
      ))}
      {isLoading && <LoadingBubbles />}
    </Box>
  );
}

export default QueryResults;
