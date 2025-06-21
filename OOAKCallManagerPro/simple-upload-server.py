#!/usr/bin/env python3
"""
Simple Upload Server for OOAK Call Manager Pro
Handles audio file uploads from the mobile app for transcription processing
"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import cgi
from datetime import datetime

# Configuration
UPLOAD_DIR = "uploads/audio"
PORT = 8083

class UploadHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/upload-audio':
            self.handle_audio_upload()
        else:
            self.send_error(404, "Not Found")
    
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"""
            <html>
            <head><title>OOAK Audio Upload Server</title></head>
            <body>
                <h1>OOAK Call Manager Pro - Audio Upload Server</h1>
                <p>Server is running on port 8083</p>
                <p>Upload endpoint: /upload-audio</p>
                <p>Upload directory: uploads/audio/</p>
            </body>
            </html>
            """)
        else:
            self.send_error(404, "Not Found")
    
    def handle_audio_upload(self):
        try:
            # Parse the multipart form data
            content_type = self.headers['content-type']
            if not content_type.startswith('multipart/form-data'):
                self.send_error(400, "Expected multipart/form-data")
                return
            
            # Create upload directory if it doesn't exist
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            # Parse form data
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )
            
            # Get the audio file
            if 'audio' not in form:
                self.send_error(400, "No audio file provided")
                return
            
            audio_file = form['audio']
            if not audio_file.filename:
                self.send_error(400, "No audio file selected")
                return
            
            # Get metadata
            call_id = form.getvalue('call_id', 'unknown')
            employee_id = form.getvalue('employee_id', 'unknown')
            contact_name = form.getvalue('contact_name', 'Unknown')
            contact_phone = form.getvalue('contact_phone', 'Unknown')
            
            # Save the audio file
            filename = audio_file.filename
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            with open(filepath, 'wb') as f:
                f.write(audio_file.file.read())
            
            # Create metadata file
            metadata = {
                'call_id': call_id,
                'employee_id': employee_id,
                'contact_name': contact_name,
                'contact_phone': contact_phone,
                'audio_file': filename,
                'uploaded_at': datetime.now().isoformat(),
                'transcription_status': 'pending'
            }
            
            metadata_filename = f"{os.path.splitext(filename)[0]}_metadata.json"
            metadata_filepath = os.path.join(UPLOAD_DIR, metadata_filename)
            
            with open(metadata_filepath, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'success',
                'message': 'Audio file uploaded successfully',
                'filename': filename,
                'call_id': call_id
            }
            
            self.wfile.write(json.dumps(response).encode())
            
            print(f"✅ Audio uploaded: {filename} (Call ID: {call_id})")
            
        except Exception as e:
            print(f"❌ Upload error: {str(e)}")
            self.send_error(500, f"Upload failed: {str(e)}")
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, UploadHandler)
    
    print(f"🚀 OOAK Audio Upload Server starting on port {PORT}")
    print(f"📁 Upload directory: {os.path.abspath(UPLOAD_DIR)}")
    print(f"🌐 Access at: http://localhost:{PORT}")
    print(f"📤 Upload endpoint: http://localhost:{PORT}/upload-audio")
    print("\n⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server() 