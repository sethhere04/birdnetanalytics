/**
 * Simple CORS Proxy for BirdNET-Go Audio Files
 * Solves CORS issues by proxying audio requests with proper headers
 *
 * Usage:
 *   node cors-proxy.js
 *
 * Then your dashboard can fetch audio from:
 *   http://localhost:3000/audio/82337
 * Instead of:
 *   http://192.168.68.129:8080/api/v2/audio/82337
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PROXY_PORT = 3000;
const BIRDNET_API = 'http://192.168.68.129:8080';

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Only handle /audio/:id requests
    const match = req.url.match(/^\/audio\/(\d+)$/);
    if (!match) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found. Use /audio/{id}');
        return;
    }

    const detectionId = match[1];
    const apiUrl = `${BIRDNET_API}/api/v2/audio/${detectionId}`;

    console.log(`[${new Date().toISOString()}] Proxying: ${apiUrl}`);

    // Proxy the request to BirdNET-Go
    const protocol = apiUrl.startsWith('https') ? https : http;

    protocol.get(apiUrl, (apiRes) => {
        // Forward status code
        res.writeHead(apiRes.statusCode, {
            ...res.getHeaders(),
            'Content-Type': apiRes.headers['content-type'] || 'audio/mp4',
            'Content-Length': apiRes.headers['content-length']
        });

        // Pipe the response
        apiRes.pipe(res);
    }).on('error', (error) => {
        console.error(`[${new Date().toISOString()}] Error:`, error.message);
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway: Could not reach BirdNET-Go API');
    });
});

server.listen(PROXY_PORT, () => {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     BirdNET-Go CORS Proxy Server                      ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  ✓ Listening on: http://localhost:${PROXY_PORT}`);
    console.log(`  ✓ Proxying to:  ${BIRDNET_API}`);
    console.log('');
    console.log('  Audio URLs:');
    console.log(`    http://localhost:${PROXY_PORT}/audio/{detection_id}`);
    console.log('');
    console.log('  Press Ctrl+C to stop');
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down proxy server...');
    server.close(() => {
        console.log('Proxy server stopped.');
        process.exit(0);
    });
});
