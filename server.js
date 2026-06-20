// 不正经修仙模拟器 —— Node.js 本地服务器
// 由 start-server.ps1 调用，也可手动运行：node server.js
var http = require('http'), fs = require('fs'), path = require('path');

var port = parseInt(process.argv[2]) || 8080;
var dir = path.dirname(process.argv[1]); // server.js 所在目录

var mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.json': 'application/json'
};

http.createServer(function(req, res) {
  var url = req.url.split('?')[0].split('#')[0];
  if (url === '/') url = '/index.html';
  // favicon 不存在时静默忽略
  if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }

  var filePath = path.join(dir, url);
  fs.access(filePath, fs.constants.R_OK, function(err) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - ' + url);
      return;
    }
    var ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(port, function() {
  console.log('========================================');
  console.log('  不正经修仙模拟器 - Node.js 服务器');
  console.log('========================================');
  console.log('');
  console.log('  📡 http://localhost:' + port);
  console.log('');
  console.log('  按 Ctrl+C 停止服务器');
  console.log('');
});
