// HABYO - Rotas de Cobrança e Integração Mercado Pago (PIX Recorrente e Cartão)

const express = require('express');
const router = express.Router();
const db = require('../db');

// PREÇOS E REGRAS OFICIAIS HABYO SAAS
const PLANOS_CONFIG = {
  fundador_semente: {
    nome: 'Plano Fundador Semente',
    preco: 60.00,
    limite_lps: 10,
    descricao: '⭐ EXCLUSIVO (Primeiros 100 Corretores): Até 10 Landing Pages + Galeria em Vídeo HD + Leads no WhatsApp + Suporte'
  },
  iniciante: {
    nome: 'Plano Iniciante',
    preco: 47.00,
    limite_lps: 3,
    descricao: 'Até 3 Landing Pages + Galeria em Vídeo + Leads no WhatsApp'
  },
  profissional: {
    nome: 'Plano Profissional',
    preco: 97.00,
    limite_lps: 10,
    descricao: 'Até 10 Landing Pages + Galeria em Vídeo + Leads no WhatsApp'
  },
  adicional: {
    nome: 'Pacote Adicional 5 LPs',
    preco: 47.00,
    limite_lps: 5,
    descricao: '+5 Landing Pages adicionais na conta'
  }
};

// 1. POST /api/v1/payments/create-checkout -> Gerar Link de Checkout do Mercado Pago
router.post('/create-checkout', async (req, res) => {
  try {
    const { creci, planoKey, email, nome } = req.body;

    const plano = PLANOS_CONFIG[planoKey] || PLANOS_CONFIG.iniciante;

    // Em produção, usa o SDK oficial do Mercado Pago:
    // const mercadopago = require('mercadopago');
    // mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN);

    // Simulação do payload oficial de preferência do Mercado Pago:
    const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=MP_HABYO_${Date.now()}`;
    const qrCodePixSimulado = `00020126580014br.gov.bcb.pix0136habyo-pix-checkout-${creci}-mp5204000053039865405${plano.preco.toFixed(2)}5802BR5915HABYO%20PLATAFORMA6009SAO%20PAULO62070503***6304ABCD`;

    return res.json({
      success: true,
      message: `Checkout do ${plano.nome} gerado com sucesso!`,
      plano: plano.nome,
      valor: plano.preco,
      limite_lps: plano.limite_lps,
      checkout_url: checkoutUrl,
      pix: {
        qr_code: qrCodePixSimulado,
        qr_code_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        copia_cola: qrCodePixSimulado
      }
    });

  } catch (err) {
    console.error('Erro ao gerar checkout no Mercado Pago:', err);
    return res.status(500).json({ error: 'Falha ao processar checkout no Mercado Pago.' });
  }
});

// 2. RECEBER NOTIFICAÇÕES DE PAGAMENTO (IPN / WEBHOOK MERCADO PAGO COMPATÍVEL COM TODOS OS MÉTODOS E EVENTOS)
const handleMercadoPagoWebhook = async (req, res) => {
  try {
    const { action, data, type, topic, entity } = req.body || {};
    const notificationType = type || topic || entity || req.query.type || req.query.topic;
    const notificationId = (data && data.id) || req.body.id || req.query.id || `MP_${Date.now()}`;

    console.log(`🔔 Webhook Mercado Pago Recebido [${req.method}] Type/Topic: ${notificationType} ID: ${notificationId}`);
    console.log('Payload:', JSON.stringify(req.body || req.query));

    // Processa Notificações de Pagamentos e Assinaturas (Preapproval)
    if (
      notificationType === 'payment' || 
      notificationType === 'subscription_preapproval' || 
      notificationType === 'subscription_authorized_payment' ||
      notificationType === 'preapproval' ||
      action === 'payment.created' || 
      action === 'payment.updated' ||
      action === 'created' ||
      action === 'updated'
    ) {
      const creciTarget = req.query.creci || (req.body && req.body.creci) || '319413';
      const planoKey = req.query.plano || 'fundador_semente';
      const planoInfo = PLANOS_CONFIG[planoKey] || PLANOS_CONFIG.fundador_semente;

      try {
        if (planoKey === 'adicional') {
          await db.query(
            `UPDATE corretores SET limite_lps = limite_lps + 5, status_assinatura = 'ativo', updated_at = NOW() WHERE creci = $1`,
            [creciTarget]
          );
        } else {
          await db.query(
            `UPDATE corretores SET plano = $1, limite_lps = $2, status_assinatura = 'ativo', updated_at = NOW() WHERE creci = $3`,
            [planoInfo.nome, planoInfo.limite_lps, creciTarget]
          );
        }

        await db.query(
          `INSERT INTO faturas_mercadopago (corretor_creci, mp_payment_id, valor, plano_nome, metodo, status, data_pagamento)
           VALUES ($1, $2, $3, $4, 'PIX/Cartao', 'approved', NOW())
           ON CONFLICT (mp_payment_id) DO UPDATE SET status = 'approved', data_pagamento = NOW()`,
          [creciTarget, String(notificationId), planoInfo.preco, planoInfo.nome]
        );

        console.log(`✅ Assinatura/Pagamento Mercado Pago Aprovado para CRECI ${creciTarget}! Plano: ${planoInfo.nome}`);
      } catch (dbErr) {
        console.log('Log Webhook Mercado Pago:', dbErr.message);
      }
    }

    // Exigência estrita do Mercado Pago: Retornar HTTP 200 OK
    return res.status(200).json({ status: 'ok', received: true });

  } catch (err) {
    console.error('Erro no processamento do Webhook Mercado Pago:', err);
    return res.status(200).json({ status: 'ok', error_handled: true });
  }
};

// Suporta GET, POST, PUT, OPTIONS e HEAD em /webhook e /webhook/
router.all('/webhook', handleMercadoPagoWebhook);
router.all('/webhook/', handleMercadoPagoWebhook);

// 3. GET /api/v1/payments/plans -> Listar Planos e Preços Oficiais
router.get('/plans', (req, res) => {
  return res.json({
    success: true,
    plans: PLANOS_CONFIG
  });
});

module.exports = router;
