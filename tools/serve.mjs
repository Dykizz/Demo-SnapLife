/**
 * SnapLife AI — server tĩnh tối giản, KHÔNG phụ thuộc gói ngoài.
 *
 * Vì sao cần: trình duyệt chặn ES module khi mở bằng file:// (CORS, origin "null").
 * Chạy file này rồi mở http://127.0.0.1:8137 — mọi thứ hoạt động như thiết kế.
 *
 *   node tools/serve.mjs            → cổng 8137
 *   node tools/serve.mjs 9000       → cổng khác
 *   node tools/serve.mjs 8137 --open  → tự mở trình duyệt
 */

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8137;
const SHOULD_OPEN = process.argv.includes('--open');
/* Mặc định mở lên MỌI giao diện để điện thoại/tablet cùng wifi vào được —
   đây là điều kiện để demo đa thiết bị. Dùng --local nếu chỉ muốn máy này. */
const HOST = process.argv.includes('--local') ? '127.0.0.1' : '0.0.0.0';

/** Danh sách địa chỉ IPv4 nội bộ, bỏ loopback và link-local. */
function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family !== 'IPv4' || ni.internal) continue;
      if (ni.address.startsWith('169.254.')) continue;
      out.push({ address: ni.address, name: ni.name || '' });
    }
  }
  return out;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';

  const target = path.join(ROOT, urlPath);
  // Chặn thoát khỏi thư mục demo.
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        `<h1 style="font:600 20px system-ui;padding:40px">404 — không có ${urlPath}</h1>` +
          `<p style="font:15px system-ui;padding:0 40px"><a href="/index.html">Về demo</a> · ` +
          `<a href="/gallery.html">Thư viện màn hình</a></p>`
      );
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const local = `http://127.0.0.1:${PORT}/index.html`;
  const lan = lanAddresses();

  console.log('');
  console.log('  SnapLife AI — demo đang chạy');
  console.log('');
  console.log(`  Máy này        : ${local}`);
  console.log(`  Thư viện màn hình: http://127.0.0.1:${PORT}/gallery.html`);
  console.log('');

  if (HOST === '0.0.0.0') {
    if (lan.length) {
      console.log('  ĐIỆN THOẠI / TABLET CÙNG WIFI mở một trong các địa chỉ sau:');
      for (const { address, name } of lan) {
        console.log(`    http://${address}:${PORT}/index.html     (${name})`);
      }
      console.log('');
      console.log('  Lần đầu Windows có thể hỏi cho phép Node.js qua tường lửa —');
      console.log('  chọn "Private networks" rồi Allow. Nếu điện thoại không vào được:');
      console.log('  kiểm tra máy tính và điện thoại có cùng mạng wifi không.');
    } else {
      console.log('  Không tìm thấy địa chỉ mạng nội bộ nào (đang offline?).');
    }
    console.log('');
    console.log(`  Chỉ máy này    : node tools/serve.mjs ${PORT} --local`);
  }

  console.log('');
  console.log('  Ctrl+C để dừng.');
  console.log('');

  if (SHOULD_OPEN) {
    const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', local] : [local];
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Cổng ${PORT} đang bị dùng. Thử: node tools/serve.mjs ${PORT + 1} --open\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
