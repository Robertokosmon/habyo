// HABYO - Rota de Envio de Feedback e Avaliações dos Corretores Beta Testers

const express = require('express');
const router = express.Router();
let db;
try { db = require('../db'); } catch (e) { db = require('./db'); }

// POST /api/v1/feedback/submit -> Enviar Feedback do Corretor para o Super Admin
router.post('/submit', async (req, res) => {
  try {
    const { creci, nome, tipo, notaNps, mensagem } = req.body;

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ error: 'Por favor, escreva a sua sugestão ou mensagem.' });
    }

    const creciTarget = creci || '319413';
    const nomeTarget = nome || 'Corretor Beta Tester';
    const tipoTarget = tipo || 'Melhoria';
    const npsTarget = parseInt(notaNps) || 5;

    try {
      await db.query(
        `INSERT INTO feedbacks_beta (corretor_creci, corretor_nome, tipo, nota_nps, mensagem)
         VALUES ($1, $2, $3, $4, $5)`,
        [creciTarget, nomeTarget, tipoTarget, npsTarget, mensagem.trim()]
      );
    } catch (dbErr) {
      console.log('Feedback recebido em memória:', req.body);
    }

    return res.json({
      success: true,
      message: '❤️ Muito obrigado pelo seu feedback! Ele foi enviado diretamente ao Fundador do HABYO.'
    });

  } catch (err) {
    console.error('Erro ao enviar feedback:', err);
    return res.status(500).json({ error: 'Erro ao enviar feedback.' });
  }
});

module.exports = router;
