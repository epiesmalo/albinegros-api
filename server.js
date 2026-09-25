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
const footballRoutes = require('./routes/football.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', healthRoutes);
app.use('/', calendarRoutes);
app.use('/', standingsRoutes);
app.use('/', footballRoutes);
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});