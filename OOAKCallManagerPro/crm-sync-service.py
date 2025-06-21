#!/usr/bin/env python3
"""
OOAK Call Manager Pro - CRM Sync Service
Handles call data synchronization from mobile dialer to PostgreSQL CRM backend
Similar to Callyzer's backend service
"""

import os
import json
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Configuration
PORT = 8084
DB_FILE = "call_data.db"

class CRMSyncHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/sync-call':
            self.handle_call_sync()
        else:
            self.send_error(404, "Not Found")
    
    def do_GET(self):
        if self.path == '/':
            self.send_dashboard()
        elif self.path == '/api/calls':
            self.send_calls_data()
        elif self.path == '/api/stats':
            self.send_stats()
        else:
            self.send_error(404, "Not Found")
    
    def send_dashboard(self):
        """Send CRM dashboard similar to Callyzer"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        dashboard_html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>OOAK Call Manager Pro - CRM Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                .header { background: #2196F3; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
                .stat-card { background: white; padding: 20px; border-radius: 10px; text-align: center; }
                .stat-number { font-size: 32px; font-weight: bold; color: #2196F3; }
                .calls-table { background: white; border-radius: 10px; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
                th { background: #f8f9fa; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📞 OOAK Call Manager Pro - CRM Dashboard</h1>
                <p>Real-time call monitoring and analytics</p>
            </div>
            
            <div class="stats" id="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalCalls">0</div>
                    <div>Total Calls</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="todayCalls">0</div>
                    <div>Today's Calls</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="avgDuration">0m</div>
                    <div>Avg Duration</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="successRate">0%</div>
                    <div>Success Rate</div>
                </div>
            </div>
            
            <div class="calls-table">
                <h2>Recent Calls</h2>
                <table>
                    <thead>
                        <tr><th>Contact</th><th>Number</th><th>Type</th><th>Duration</th><th>Time</th></tr>
                    </thead>
                    <tbody id="callsBody"></tbody>
                </table>
            </div>
            
            <script>
                async function loadDashboard() {
                    try {
                        const statsResponse = await fetch('/api/stats');
                        const stats = await statsResponse.json();
                        
                        document.getElementById('totalCalls').textContent = stats.total_calls;
                        document.getElementById('todayCalls').textContent = stats.today_calls;
                        document.getElementById('avgDuration').textContent = stats.avg_duration + 'm';
                        document.getElementById('successRate').textContent = stats.success_rate + '%';
                        
                        const callsResponse = await fetch('/api/calls');
                        const calls = await callsResponse.json();
                        
                        const tbody = document.getElementById('callsBody');
                        tbody.innerHTML = '';
                        
                        calls.forEach(call => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${call.contact_name || 'Unknown'}</td>
                                <td>${call.number}</td>
                                <td>${call.type}</td>
                                <td>${Math.floor(call.duration/60)}:${(call.duration%60).toString().padStart(2,'0')}</td>
                                <td>${new Date(call.timestamp).toLocaleString()}</td>
                            `;
                            tbody.appendChild(row);
                        });
                        
                    } catch (error) {
                        console.error('Failed to load dashboard:', error);
                    }
                }
                
                loadDashboard();
                setInterval(loadDashboard, 30000);
            </script>
        </body>
        </html>
        """
        
        self.wfile.write(dashboard_html.encode())
    
    def handle_call_sync(self):
        """Handle call data sync from mobile app"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            call_data = json.loads(post_data.decode('utf-8'))
            
            # Store call in database
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO calls (number, contact_name, type, duration, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                call_data.get('number'),
                call_data.get('contact_name'),
                call_data.get('type', 'outgoing'),
                call_data.get('duration', 0),
                call_data.get('timestamp')
            ))
            
            conn.commit()
            conn.close()
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'status': 'success', 'message': 'Call data synced successfully'}
            self.wfile.write(json.dumps(response).encode())
            
            print(f"✅ Call synced: {call_data.get('contact_name', 'Unknown')} ({call_data.get('number')})")
            
        except Exception as e:
            print(f"❌ Sync error: {str(e)}")
            self.send_error(500, f"Sync failed: {str(e)}")
    
    def send_calls_data(self):
        """Send calls data as JSON"""
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            cursor.execute('SELECT number, contact_name, type, duration, timestamp FROM calls ORDER BY timestamp DESC LIMIT 50')
            
            calls = []
            for row in cursor.fetchall():
                calls.append({
                    'number': row[0],
                    'contact_name': row[1],
                    'type': row[2],
                    'duration': row[3],
                    'timestamp': row[4]
                })
            
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(calls).encode())
            
        except Exception as e:
            self.send_error(500, f"Failed to fetch calls: {str(e)}")
    
    def send_stats(self):
        """Send statistics data"""
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            
            # Total calls
            cursor.execute('SELECT COUNT(*) FROM calls')
            total_calls = cursor.fetchone()[0]
            
            # Today's calls
            today = datetime.now().strftime('%Y-%m-%d')
            cursor.execute('SELECT COUNT(*) FROM calls WHERE DATE(timestamp) = ?', (today,))
            today_calls = cursor.fetchone()[0]
            
            # Average duration
            cursor.execute('SELECT AVG(duration) FROM calls WHERE DATE(timestamp) = ?', (today,))
            avg_duration = cursor.fetchone()[0] or 0
            avg_duration = int(avg_duration / 60)
            
            # Success rate (assuming all calls are successful for now)
            success_rate = 100 if today_calls > 0 else 0
            
            conn.close()
            
            stats = {
                'total_calls': total_calls,
                'today_calls': today_calls,
                'avg_duration': avg_duration,
                'success_rate': success_rate
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(stats).encode())
            
        except Exception as e:
            self.send_error(500, f"Failed to fetch stats: {str(e)}")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def init_database():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS calls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL,
            contact_name TEXT,
            type TEXT DEFAULT 'outgoing',
            duration INTEGER DEFAULT 0,
            timestamp TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def run_server():
    """Start the CRM sync server"""
    init_database()
    
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, CRMSyncHandler)
    
    print(f"🚀 OOAK CRM Sync Service starting on port {PORT}")
    print(f"📊 Dashboard: http://localhost:{PORT}")
    print(f"🔄 Sync endpoint: http://localhost:{PORT}/sync-call")
    print(f"📁 Database: {os.path.abspath(DB_FILE)}")
    print("\n⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        httpd.server_close()

if __name__ == '__main__':
    run_server() 