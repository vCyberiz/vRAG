def list_documents(self):
    """
    List all documents from Supabase
    
    :return: List of document metadata
    """
    try:
        # Fetch documents from the database
        response = self.supabase.table('documents').select('*').execute()
        
        print("Supabase response:", response)
        
        # Extract document names
        documents = [doc['original_filename'] for doc in response.data]
        
        print("Extracted documents:", documents)
        
        return {
            'documents': documents,
            'status': 'success'
        }
    
    except Exception as e:
        print(f"Error listing documents: {str(e)}")
        return {
            'message': f'Failed to list documents: {str(e)}',
            'status': 'error'
        } 