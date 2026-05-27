require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const newsRoutes = require('./routes/news.routes');
const instagramRoutes = require('./routes/instagram.routes');
const standingsRoutes = require('./routes/standings.routes');
const adminRoutes = require('./routes/admin.routes');
const calendarRoutes = require('./routes/calendar.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', healthRoutes);
app.use('/', calendarRoutes);
app.use('/', standingsRoutes);
app.use('/', adminRoutes);
app.use('/', instagramRoutes);
app.use('/', newsRoutes);

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Panel Admin"');
    return res.status(401).send('Acceso restringido');
  }

  const base64Credentials = auth.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [user, password] = credentials.split(':');

  if (
    user === process.env.ADMIN_USER?.trim() &&
    password === process.env.ADMIN_PASSWORD?.trim()
  ) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Panel Admin"');
  return res.status(401).send('Usuario o contraseña incorrectos');
};

app.get('/admin.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/test-supabase', async (req, res) => {
  res.json({
    hasUrl: !!process.env.SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_KEY,
    url: process.env.SUPABASE_URL,
  });
});

app.get('/get-token', async (req, res) => {
  try {
    const code = req.query.code;

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: 'https://localhost/',
        code,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});