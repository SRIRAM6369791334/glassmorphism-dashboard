// Local-only SMTP receiver and in-memory viewer. Never forwards or persists mail.
const { SMTPServer } = require('smtp-server');
const http = require('node:http');
const messages = [];
const smtp = new SMTPServer({ authOptional: true, disabledCommands: ['STARTTLS'],
  onData(stream, session, callback) {
    let content = ''; let tooLarge = false;
    stream.on('data', chunk => { if (content.length < 65536) content += chunk.toString(); else tooLarge = true; });
    stream.on('end', () => {
      if (tooLarge) return callback(new Error('Message too large'));
      const code = /verification code is (\d{6})/.exec(content)?.[1];
      if (code) {
        messages.unshift({ to: session.envelope.rcptTo[0]?.address, code, receivedAt: Date.now() });
        messages.splice(50);
      }
      callback();
    });
  },
});
const page = `<!doctype html><meta charset="utf-8"><title>Local authentication email</title>
<style>body{font:18px system-ui;max-width:800px;margin:48px auto;background:#18151d;color:#eee;padding:20px}article{border:1px solid #555;padding:16px;margin:16px 0}strong{font-size:28px;letter-spacing:5px}button{font:inherit}</style>
<h1>Local authentication email</h1><p>Messages expire after ten minutes and stay in this process only.</p><button id="reload">Refresh</button><main></main>
<script>async function refresh(){const items=await fetch('/messages').then(r=>r.json());const main=document.querySelector('main');main.replaceChildren();for(const item of items){const article=document.createElement('article'),to=document.createElement('p'),code=document.createElement('strong');to.textContent=item.to;code.textContent=item.code;article.append(to,code);main.append(article)}}document.querySelector('button').onclick=refresh;refresh();setInterval(refresh,3000)</script>`;
const viewer = http.createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  if (request.headers.host !== '127.0.0.1:8025' && request.headers.host !== 'localhost:8025') { response.writeHead(403); return response.end(); }
  if (request.url === '/messages') {
    response.setHeader('Content-Type', 'application/json');
    return response.end(JSON.stringify(messages.filter(message => Date.now() - message.receivedAt < 600000)));
  }
  if (request.url !== '/') { response.writeHead(404); return response.end(); }
  response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(page);
});
smtp.listen(1025, '127.0.0.1'); viewer.listen(8025, '127.0.0.1', () => console.log('Local email viewer: http://127.0.0.1:8025'));
function close() { smtp.close(); viewer.close(); }
process.on('SIGINT', close); process.on('SIGTERM', close);
