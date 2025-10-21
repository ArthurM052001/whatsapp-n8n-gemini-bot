const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Config
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/whatsapp';
const PORT = process.env.PORT || 3000;
const SEND_TOKEN = process.env.SEND_TOKEN || 'change-me'; // token shared with n8n to allow sending replies

const fs = require('fs');
const path = require('path');

const PUPPETEER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
];

// You can set PUPPETEER_EXECUTABLE_PATH to use your installed Chrome/Chromium
// e.g. C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "bot-1" }),
    puppeteer: {
        headless: true,
        args: PUPPETEER_ARGS,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    }
});

client.on('qr', (qr) => {
    console.log('QR recebido, abra o WhatsApp e escaneie:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Cliente pronto!');
});

client.on('message', async (message) => {
    try {
        console.log('Mensagem recebida de', message.from, message.body);

        // Envia para o n8n webhook para processamento (e então Gemini)
        await axios.post(N8N_WEBHOOK_URL, {
            from: message.from,
            body: message.body,
            isMedia: message.hasMedia
        }, { timeout: 5000 });

    } catch (err) {
        console.error('Erro ao encaminhar mensagem para n8n:', err.message);
    }
});

client.initialize();

// Resilience: restart the client on disconnects or Puppeteer protocol errors
client.on('disconnected', (reason) => {
    console.warn('WhatsApp client disconnected:', reason);
    try {
        client.destroy();
    } catch (e) {
        console.error('Error while destroying client:', e && e.message);
    }
    // small delay before restart
    setTimeout(() => {
        console.log('Re-initializing WhatsApp client...');
        client.initialize();
    }, 5000);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err && err.stack ? err.stack : err);
    // If it's a puppeteer ProtocolError, attempt a graceful restart
    if (err && err.message && err.message.includes('Protocol error')) {
        try {
            client.destroy();
        } catch (e) { /* ignore */ }
        setTimeout(() => client.initialize(), 3000);
    }
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    if (reason && reason.message && reason.message.includes('Protocol error')) {
        try { client.destroy(); } catch (e) { }
        setTimeout(() => client.initialize(), 3000);
    }
});

// --- Express server: endpoint para n8n enviar respostas ao WhatsApp ---
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => res.send('WhatsApp bot running'));

// Endpoint seguro para enviar mensagens via bot
app.post('/send', async (req, res) => {
    const token = req.headers['x-send-token'] || req.body.token;
    if (!token || token !== SEND_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, text, mediaUrl, filename } = req.body;
    if (!to || (!text && !mediaUrl)) {
        return res.status(400).json({ error: 'Missing to or text/mediaUrl' });
    }

    try {
        if (mediaUrl) {
            // envia mídia remoto
            const media = await MessageMedia.fromUrl(mediaUrl);
            if (text) await client.sendMessage(to, text);
            await client.sendMessage(to, media, { caption: filename || '' });
        } else {
            await client.sendMessage(to, text);
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('Erro ao enviar mensagem via WhatsApp:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Simple reviews storage (file-based) for initial validation period
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');
function loadReviews() {
    try {
        if (!fs.existsSync(REVIEWS_FILE)) return [];
        const raw = fs.readFileSync(REVIEWS_FILE, 'utf8');
        return JSON.parse(raw || '[]');
    } catch (e) {
        console.error('Erro ao ler reviews:', e);
        return [];
    }
}

function saveReviews(list) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// Endpoint para criar uma revisão (o n8n vai postar aqui ao invés de chamar /send diretamente)
app.post('/review', (req, res) => {
    const token = req.headers['x-send-token'] || req.body.token;
    if (!token || token !== SEND_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const { to, text, originalMessageId, metadata } = req.body;
    if (!to || !text) return res.status(400).json({ error: 'Missing to or text' });

    const reviews = loadReviews();
    const id = Date.now().toString();
    const item = { id, to, text, originalMessageId: originalMessageId || null, metadata: metadata || {}, status: 'pending', createdAt: new Date().toISOString() };
    reviews.push(item);
    saveReviews(reviews);
    return res.json({ ok: true, id });
});

// List pending reviews
app.get('/reviews', (req, res) => {
    const token = req.headers['x-send-token'] || req.query.token;
    if (!token || token !== SEND_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const reviews = loadReviews();
    return res.json(reviews.filter(r => r.status === 'pending'));
});

// Approve a review and send the message
app.post('/reviews/:id/approve', async (req, res) => {
    const token = req.headers['x-send-token'] || req.body.token;
    if (!token || token !== SEND_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = req.params.id;
    const reviews = loadReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const item = reviews[idx];
    if (item.status !== 'pending') return res.status(400).json({ error: 'Not pending' });

    try {
        await client.sendMessage(item.to, item.text);
        reviews[idx].status = 'approved';
        reviews[idx].approvedAt = new Date().toISOString();
        saveReviews(reviews);
        return res.json({ ok: true });
    } catch (err) {
        console.error('Erro ao enviar mensagem aprovada:', err);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
