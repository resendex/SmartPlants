from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os

DATA_FILE = 'chat_history.json'

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/atividades':
            if os.path.exists('atividades.json'):
                with open('atividades.json', 'r') as f:
                    data = f.read()
            else:
                data = '[]'
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data.encode())
        elif self.path == '/chat_history':
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, 'r') as f:
                    data = f.read()
            else:
                data = '{}'
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/atividades':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            with open('atividades.json', 'w') as f:
                f.write(post_data.decode())
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        elif self.path == '/chat_history':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            with open(DATA_FILE, 'w') as f:
                f.write(post_data.decode())
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), RequestHandler)
    print('Servidor rodando em http://localhost:8080')
    server.serve_forever()
