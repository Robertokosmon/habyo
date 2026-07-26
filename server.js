// HABYO - Servidor Principal Node.js & Express REST API
// Plataforma SaaS de Landing Pages Exclusivas de Imóveis por CRECI

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
let PORT = parseInt(process.env.PORT || '3000', 10);

// MIDDLEWARES DE SEGURANÇA E PARSER
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROTA DE SAÚDE DO SERVIDOR (HEALTH CHECK DA NUVEM)
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'HABYO SaaS Backend',
    database: 'Supabase Cloud PostgreSQL'
  });
});

// SERVIR ARQUIVOS ESTÁTICOS COM SUPORTE A ROTAS ABSOLUTAS E FALLBACK DA RAIZ
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/assets', express.static(__dirname));
app.use(express.static(__dirname));

// CARREGADOR DE ROTAS INTELIGENTE E À PROVA DE FALHAS
const loadRoute = (routeName) => {
  try {
    const mod = require('./routes/' + routeName);
    if (mod && (typeof mod === 'function' || mod.stack)) return mod;
  } catch (err) {}

  try {
    const mod = require('./' + routeName);
    if (mod && (typeof mod === 'function' || mod.stack)) return mod;
  } catch (err) {}

  const fallbackRouter = express.Router();
  return fallbackRouter;
};

// ROTAS DA REST API HABYO
app.use('/api/v1/auth', loadRoute('auth'));
app.use('/api/v1/leads', loadRoute('leads'));
app.use('/api/v1/properties', loadRoute('properties'));
app.use('/api/v1/payments', loadRoute('payments'));
app.use('/api/v1/superadmin', loadRoute('superadmin'));
app.use('/api/v1/feedback', loadRoute('feedback'));

// ROTA DA PÁGINA INICIAL INSTITUCIONAL (HABYO HOMEPAGE HABYO.COM.BR)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ROTAS FIXAS DO PAINEL E AUTENTICAÇÃO
app.get('/superadmin', (req, res) => {
  res.sendFile(path.join(__dirname, 'superadmin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/property', (req, res) => {
  res.sendFile(path.join(__dirname, 'property.html'));
});

app.get('/imovel', (req, res) => {
  res.sendFile(path.join(__dirname, 'property.html'));
});

// ROTAS DO PERFIL PÚBLICO DO CORRETOR (PROTAGONISTA: O CORRETOR)
app.get('/broker-profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'broker-profile.html'));
});

app.get('/public-broker', (req, res) => {
  res.sendFile(path.join(__dirname, 'broker-profile.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'broker-profile.html'));
});

app.get('/corretor/:creci?', (req, res) => {
  res.sendFile(path.join(__dirname, 'broker-profile.html'));
});

// ROTA DO CRECI DIRETO (EX: habyo.com.br/123456-F OU habyo.com.br/319413) -> PERFIL PÚBLICO DO CORRETOR
app.get('/:creci', (req, res, next) => {
  const { creci } = req.params;

  // Ignorar palavras reservadas, arquivos estáticos (.css, .js, .png, etc)
  if (
    creci === 'api' ||
    creci === 'admin' ||
    creci === 'superadmin' ||
    creci === 'login' ||
    creci === 'register' ||
    creci === 'property' ||
    creci === 'imovel' ||
    creci === 'profile' ||
    creci === 'corretor' ||
    creci === 'broker-profile' ||
    creci === 'public-broker' ||
    creci === 'assets' ||
    creci.includes('.')
  ) {
    return next();
  }

  // Quando o visitante digita habyo.com.br/319413 -> SERVE O PERFIL PÚBLICO DO CORRETOR
  res.sendFile(path.join(__dirname, 'broker-profile.html'));
});

// ROTA DINÂMICA DA LANDING PAGE DO IMÓVEL (EX: habyo.com.br/319413/apartamento-alto-padrao-vila-mariana)
app.get('/:creci/:slug', (req, res, next) => {
  const { creci, slug } = req.params;

  if (slug && slug.includes('.')) {
    return next();
  }

  // Quando o visitante clica no imóvel -> SERVE A LANDING PAGE DO IMÓVEL (property.html)
  res.sendFile(path.join(__dirname, 'property.html'));
});

// INICIALIZAÇÃO COM SELEÇÃO AUTOMÁTICA DE PORTA LIVRE
function startServer(portToUse) {
  const server = app.listen(portToUse, () => {
    console.log(`
============================================================
🚀 SERVIDOR HABYO INICIADO COM SUCESSO!
============================================================
📡 Endereço Local: http://localhost:${portToUse}
👤 PERFIL PÚBLICO DO CORRETOR: http://localhost:${portToUse}/319413
🏠 LANDING PAGE DO IMÓVEL: http://localhost:${portToUse}/319413/apartamento-vila-mariana
⚙️ PAINEL ADMINISTRATIVO: http://localhost:${portToUse}/admin
🔐 TELA DE LOGIN: http://localhost:${portToUse}/login
📝 CADASTRO EM 3 PASSOS: http://localhost:${portToUse}/register
============================================================
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ A porta ${portToUse} já está em uso por outro processo. Tentando a porta ${portToUse + 1}...`);
      startServer(portToUse + 1);
    } else {
      console.error('❌ Erro no servidor:', err);
    }
  });
}

startServer(PORT);
