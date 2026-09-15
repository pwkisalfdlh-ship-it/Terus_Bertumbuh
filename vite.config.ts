import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function lockPhotoPlugin(): Plugin {
  return {
    name: 'lock-photo-plugin',
    configureServer(server) {
      server.middlewares.use('/api/lock-photo', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.image && data.image.includes('base64,')) {
                const base64Data = data.image.split('base64,')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const publicDir = path.resolve(process.cwd(), 'public');
                if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
                fs.writeFileSync(path.resolve(publicDir, 'foto-saya.jpg'), buffer);
                const distDir = path.resolve(process.cwd(), 'dist');
                if (fs.existsSync(distDir)) {
                  fs.writeFileSync(path.resolve(distDir, 'foto-saya.jpg'), buffer);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Photo locked permanently' }));
                return;
              }
            } catch (err) {
              console.error('Error locking photo:', err);
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'invalid data' }));
          });
        } else {
          res.writeHead(405).end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), lockPhotoPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
