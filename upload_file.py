import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify API key is set
if not os.getenv("OPENAI_API_KEY"):
    print("Error: OPENAI_API_KEY not found in environment variables")
    exit(1)

file_path = r"C:\Users\SreeramYashasvi\Downloads\Excel CSV Dump\lingSpam.csv"
url = "http://localhost:8000/upload"

with open(file_path, 'rb') as f:
    files = {'file': f}
    response = requests.post(url, files=files)
    print(response.json()) 