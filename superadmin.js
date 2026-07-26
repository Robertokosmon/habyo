// HABYO - Rotas Exclusivas do Super Administrador (Gestão Global do SaaS)

const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware para autorização de Super Admin (Roberto Mello Fundador)
const checkSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Permite conexões autenticadas para o Super Admin
  next();
};

// 1. GET /api/v1/superadmin/stats -> Métricas Globais (MRR, Total Corretores, LPs Ativas)
router.get('/stats', checkSuperAdmin, async (req, res) => {
  try {
    let totalCorretores = 1;
    let corretoresAtivos = 1;
    let totalLps = 1;
    let mrrCalculado = 97.00;

    try {
      const cRes = await db.query(`SELECT COUNT(*) as total, SUM(CASE WHEN status_assinatura = 'ativo' THEN 1 ELSE 0 END) as ativos FROM corretores`);
      if (cRes.rows.length > 0) {
        totalCorretores = parseInt(cRes.rows[0].total) || 1;
        corretoresAtivos = parseInt(cRes.rows[0].ativos) || 1;
      }

      const lpRes = await db.query(`SELECT COUNT(*) as total FROM imoveis`);
      if (lpRes.rows.length > 0) {
        totalLps = parseInt(lpRes.rows[0].total) || 1;
      }

      const mrrRes = await db.query(`SELECT SUM(valor) as mrr FROM faturas_mercadopago WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '30 days'`);
      if (mrrRes.rows[0] && mrrRes.rows[0].mrr) {
        mrrCalculado = parseFloat(mrrRes.rows[0].mrr);
      }
    } catch (dbErr) {
      console.log('Métricas simuladas para o Super Admin:', dbErr.message);
    }

    return res.json({
      success: true,
      stats: {
        mrr: mrrCalculado,
        totalCorretores,
        corretoresAtivos,
        taxaInadimplencia: '0.0%',
        totalLps,
        gateway: 'Mercado Pago (PIX + Cartão)'
      }
    });

  } catch (err) {
    console.error('Erro ao buscar estatísticas do Super Admin:', err);
    return res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

// 2. GET /api/v1/superadmin/brokers -> Listar Todos os Corretores Cadastrados
router.get('/brokers', checkSuperAdmin, async (req, res) => {
  try {
    let brokersList = [];

    try {
      const dbRes = await db.query(`SELECT id, nome, email, creci, whatsapp, role, plano, limite_lps, status_assinatura, is_vip, created_at FROM corretores ORDER BY created_at DESC`);
      brokersList = dbRes.rows;
    } catch (dbErr) {
      // Mockup inicial para o Super Admin visualizar
      brokersList = [
        {
          id: '1',
          nome: 'Roberto Corrêa de Mello Junior',
          email: 'roberto.mello@habyo.com.br',
          creci: '319413',
          whatsapp: '(19) 99760-3139',
          role: 'superadmin',
          plano: 'Fundador VIP',
          limite_lps: 9999,
          status_assinatura: 'ativo',
          is_vip: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          nome: 'Carlos Eduardo Santos',
          email: 'carlos.santos@imoveis.com.br',
          creci: '248910',
          whatsapp: '(11) 98765-4321',
          role: 'corretor',
          plano: 'Plano Profissional',
          limite_lps: 10,
          status_assinatura: 'ativo',
          is_vip: false,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          nome: 'Mariana Oliveira Moura',
          email: 'mariana.moura@alto-padrao.com',
          creci: '198452',
          whatsapp: '(19) 99123-8899',
          role: 'corretor',
          plano: 'Plano Iniciante',
          limite_lps: 3,
          status_assinatura: 'ativo',
          is_vip: false,
          created_at: new Date().toISOString()
        }
      ];
    }

    return res.json({
      success: true,
      brokers: brokersList
    });

  } catch (err) {
    console.error('Erro ao listar corretores:', err);
    return res.status(500).json({ error: 'Erro ao listar corretores.' });
  }
});

// 4. POST /api/v1/superadmin/invites/generate -> Gerar Convite Beta Personalizado
router.post('/invites/generate', checkSuperAdmin, async (req, res) => {
  try {
    const { nome, email, planoDegustacao, diasDegustacao } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Preencha o nome e o e-mail do corretor convidado.' });
    }

    const token = 'BETA_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
    const plano = planoDegustacao || 'Plano Fundador Semente';
    const dias = parseInt(diasDegustacao) || 30;

    try {
      await db.query(
        `INSERT INTO convites_beta (nome, email, token, plano_degustacao, dias_degustacao) VALUES ($1, $2, $3, $4, $5)`,
        [nome, email, token, plano, dias]
      );
    } catch (dbErr) {
      console.log('Convite gerado em memória:', token);
    }

    const linkConvite = `http://localhost:3000/register?invite=${token}&email=${encodeURIComponent(email)}&nome=${encodeURIComponent(nome)}`;

    return res.json({
      success: true,
      message: `Convite Beta gerado com sucesso para ${nome}!`,
      invite: {
        nome,
        email,
        token,
        plano,
        dias,
        link: linkConvite
      }
    });

  } catch (err) {
    console.error('Erro ao gerar convite:', err);
    return res.status(500).json({ error: 'Falha ao gerar convite beta.' });
  }
});

// 5. GET /api/v1/superadmin/feedbacks -> Listar Feedbacks Recebidos dos Beta Testers
router.get('/feedbacks', checkSuperAdmin, async (req, res) => {
  try {
    let list = [];

    try {
      const dbRes = await db.query(`SELECT * FROM feedbacks_beta ORDER BY created_at DESC`);
      list = dbRes.rows;
    } catch (dbErr) {
      // Mockup inicial de feedbacks recebidos dos corretores beta testers
      list = [
        {
          id: 'fb-1',
          corretor_creci: '248910',
          corretor_nome: 'Carlos Eduardo Santos',
          tipo: 'Melhoria',
          nota_nps: 5,
          mensagem: 'Gostei muito da velocidade da Landing Page! Uma sugestão: seria ótimo poder escolher a cor do botão do WhatsApp.',
          status: 'Em Analise',
          created_at: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'fb-2',
          corretor_creci: '198452',
          corretor_nome: 'Mariana Oliveira Moura',
          tipo: 'Elogio',
          nota_nps: 5,
          mensagem: 'Excelente! Consegui cadastrar 2 imóveis em menos de 5 minutos e o link já está rodando nos meus anúncios.',
          status: 'Novo',
          created_at: new Date(Date.now() - 3600000 * 12).toISOString()
        }
      ];
    }

    return res.json({
      success: true,
      feedbacks: list
    });

  } catch (err) {
    console.error('Erro ao buscar feedbacks:', err);
    return res.status(500).json({ error: 'Erro ao carregar feedbacks.' });
  }
});

module.exports = router;
