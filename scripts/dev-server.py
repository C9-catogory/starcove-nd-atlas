import argparse, http.server, os, socketserver

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path.split('?',1)[0])
        if not os.path.exists(path) and not os.path.splitext(path)[1]:
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--directory',default='dist');p.add_argument('--port',type=int,default=8080);a=p.parse_args()
    os.chdir(a.directory)
    with socketserver.TCPServer(('127.0.0.1',a.port),SPAHandler) as server:
        print(f'http://127.0.0.1:{a.port}')
        server.serve_forever()
