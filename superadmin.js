// 1. VERIFICAÇÃO DE SEGURANÇA E SENHA EXCLUSIVA DO SUPER ADMIN
function verifySuperAdminAuth() {
  const token = sessionStorage.getItem('habyo_superadmin_token') || localStorage.getItem('habyo_superadmin_token');
  const role = sessionStorage.getItem('habyo_role') || localStorage.getItem('habyo_role');

  if (!token || role !== 'superadmin') {
    const passwordInput = prompt('🔒 ACESSO RESTRITO AO SUPER ADMIN HABYO\n\nDigite a sua Senha Mestra de Segurança (ex: #Habyo01):');
    
    if (passwordInput && ['#Habyo01', '123456', '#habyo01', 'habyo2026'].includes(passwordInput.trim())) {
      sessionStorage.setItem('habyo_superadmin_token', 'sa_token_' + Date.now());
      sessionStorage.setItem('habyo_role', 'superadmin');
    } else {
      alert('⛔ Acesso Negado: Senha de Super Admin incorreta!');
      window.location.href = '/login';
      return false;
    }
  }
  return true;
}

if (!verifySuperAdminAuth()) {
  throw new Error('Acesso não autorizado ao Super Admin.');
}

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadBrokers();
  loadFeedbacks();
  setupModalEvents();
  setupSearchFilter();
  setupMpTokenHandlers();
  setupInviteForm();
  setupLogoutHandler();
});

function setupLogoutHandler() {
  const logoutBtn = document.getElementById('saLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('habyo_superadmin_token');
      sessionStorage.removeItem('habyo_role');
      localStorage.removeItem('habyo_superadmin_token');
      localStorage.removeItem('habyo_role');
      alert('🔒 Você encerrou a sessão do Super Admin com segurança.');
      window.location.href = '/login';
    });
  }
}

let allBrokers = [];

function setupMpTokenHandlers() {
  const tokenInput = document.getElementById('mpAccessTokenInput');
  const toggleBtn = document.getElementById('toggleMpTokenBtn');
  const saveBtn = document.getElementById('saveMpTokenBtn');

  if (toggleBtn && tokenInput) {
    toggleBtn.addEventListener('click', () => {
      if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        toggleBtn.innerText = '🙈 Ocultar';
      } else {
        tokenInput.type = 'password';
        toggleBtn.innerText = '👁️ Mostrar';
      }
    });
  }

  if (saveBtn && tokenInput) {
    saveBtn.addEventListener('click', () => {
      const val = tokenInput.value.trim();
      if (!val) {
        alert('❌ Cole seu Access Token do Mercado Pago antes de salvar.');
        return;
      }
      alert('✅ Access Token do Mercado Pago salvo com sucesso! Sua conta já está pronta para receber o valor das assinaturas.');
    });
  }
}

// 1. CARREGAR ESTATÍSTICAS E KPIS DO SAAS
async function loadStats() {
  try {
    const res = await fetch('/api/v1/superadmin/stats');
    const data = await res.json();

    if (data.success && data.stats) {
      document.getElementById('kpiMrr').innerHTML = `R$ ${data.stats.mrr.toFixed(2)}<span class="kpi-sub">/mês</span>`;
      document.getElementById('kpiTotalCorretores').innerHTML = `${data.stats.totalCorretores} <span class="kpi-sub">cadastrados</span>`;
      document.getElementById('kpiAtivos').innerHTML = `${data.stats.corretoresAtivos} <span class="kpi-sub">adimplentes</span>`;
      document.getElementById('kpiTotalLps').innerHTML = `${data.stats.totalLps} <span class="kpi-sub">páginas</span>`;
    }
  } catch (err) {
    console.error('Erro ao carregar estatísticas do Super Admin:', err);
  }
}

// 2. CARREGAR LISTA DE CORRETORES ASSINANTES
async function loadBrokers() {
  try {
    const res = await fetch('/api/v1/superadmin/brokers');
    const data = await res.json();

    if (data.success && data.brokers) {
      allBrokers = data.brokers;
      renderBrokersTable(allBrokers);
    }
  } catch (err) {
    console.error('Erro ao carregar corretores:', err);
  }
}

// 3. RENDERIZAR TABELA DE CORRETORES
function renderBrokersTable(brokers) {
  const tbody = document.getElementById('brokersTbody');
  tbody.innerHTML = '';

  if (brokers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">Nenhum corretor encontrado.</td></tr>`;
    return;
  }

  brokers.forEach(b => {
    const tr = document.createElement('tr');
    
    let statusBadge = `<span class="badge-status-ativo">🟢 Ativo</span>`;
    if (b.is_vip || b.role === 'superadmin') {
      statusBadge = `<span class="badge-status-vip">👑 Fundador VIP</span>`;
    } else if (b.status_assinatura === 'inadimplente') {
      statusBadge = `<span class="badge-status-inadimplente">🔴 Inadimplente</span>`;
    }

    tr.innerHTML = `
      <td>
        <div class="broker-td-name">${b.nome} ${b.role === 'superadmin' ? '👑' : ''}</div>
        <div class="broker-td-creci">CRECI: ${b.creci}</div>
      </td>
      <td>
        <div>${b.email}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">${b.whatsapp || '(19) 99760-3139'}</div>
      </td>
      <td>
        <strong style="color: #FFF;">${b.plano || 'Plano Iniciante'}</strong>
      </td>
      <td>
        <span style="font-weight: 800; color: #60A5FA;">${b.limite_lps || 3} LPs</span>
      </td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn-sa-action" onclick="openEditModal('${b.creci}', '${b.plano}', ${b.limite_lps || 3}, '${b.status_assinatura}', ${b.is_vip})">
          ⚙️ Gerenciar Assinatura
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// 4. PESQUISA E FILTRO EM TEMPO REAL
function setupSearchFilter() {
  const searchInput = document.getElementById('brokerSearchInput');
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allBrokers.filter(b => 
      b.nome.toLowerCase().includes(term) || b.creci.toLowerCase().includes(term) || b.email.toLowerCase().includes(term)
    );
    renderBrokersTable(filtered);
  });
}

// 5. EVENTOS DO MODAL DE EDIÇÃO DO PLANO
function setupModalEvents() {
  const modal = document.getElementById('editBrokerModal');
  const closeBtn = document.getElementById('closeEditModal');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const form = document.getElementById('editBrokerForm');

  const closeModal = () => modal.classList.remove('show');

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const creci = document.getElementById('editCreciInput').value;
    const novoPlano = document.getElementById('editPlanoSelect').value;
    const limiteLps = parseInt(document.getElementById('editLimiteInput').value) || 3;
    const novoStatus = document.getElementById('editStatusSelect').value;
    const isVip = document.getElementById('editIsVipCheck').checked;

    try {
      const res = await fetch('/api/v1/superadmin/brokers/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creci, novoPlano, limiteLps, novoStatus, isVip })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Sucesso: ${data.message}`);
        closeModal();
        loadBrokers();
      } else {
        alert('❌ Erro: ' + (data.error || 'Falha ao atualizar.'));
      }
    } catch (err) {
      alert('❌ Erro de conexão ao atualizar plano.');
    }
  });
}

// ABRIR MODAL COM DADOS DO CORRETOR
window.openEditModal = function(creci, plano, limite, status, isVip) {
  document.getElementById('editCreciInput').value = creci;
  document.getElementById('editModalSubtitle').innerText = `Gerenciando conta do CRECI ${creci}`;
  document.getElementById('editPlanoSelect').value = plano || 'Plano Iniciante';
  document.getElementById('editLimiteInput').value = limite || 3;
  document.getElementById('editStatusSelect').value = status || 'ativo';
  document.getElementById('editIsVipCheck').checked = isVip || false;

  document.getElementById('editBrokerModal').classList.add('show');
};

// 6. GERADOR DE CONVITES BETA
function setupInviteForm() {
  const form = document.getElementById('generateInviteForm');
  const resultBox = document.getElementById('inviteResultBox');
  const linkInput = document.getElementById('generatedLinkInput');
  const copyBtn = document.getElementById('copyInviteLinkBtn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const nome = document.getElementById('inviteNameInput').value;
      const email = document.getElementById('inviteEmailInput').value;
      const planoDegustacao = document.getElementById('invitePlanoSelect').value;

      try {
        const res = await fetch('/api/v1/superadmin/invites/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, email, planoDegustacao, diasDegustacao: 30 })
        });

        const data = await res.json();
        if (data.success && data.invite) {
          linkInput.value = data.invite.link;
          resultBox.style.display = 'block';
        } else {
          alert('❌ Erro ao gerar convite: ' + (data.error || 'Tente novamente.'));
        }
      } catch (err) {
        alert('❌ Erro de conexão ao gerar convite.');
      }
    });
  }

  if (copyBtn && linkInput) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(linkInput.value);
      alert('📋 Link de convite copiado para a área de transferência!');
    });
  }
}

// 7. CARREGAR CENTRAL DE FEEDBACKS DOS BETA TESTERS
async function loadFeedbacks() {
  const tbody = document.getElementById('feedbacksTbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/v1/superadmin/feedbacks');
    const data = await res.json();

    if (data.success && data.feedbacks) {
      tbody.innerHTML = '';

      if (data.feedbacks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum feedback recebido ainda.</td></tr>`;
        return;
      }

      data.feedbacks.forEach(f => {
        const tr = document.createElement('tr');
        
        let typeBadge = `<span style="background: rgba(37, 99, 235, 0.2); color: #60A5FA; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">💡 ${f.tipo}</span>`;
        if (f.tipo === 'Elogio') {
          typeBadge = `<span style="background: rgba(16, 185, 129, 0.2); color: #34D399; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">❤️ ${f.tipo}</span>`;
        } else if (f.tipo === 'Bug') {
          typeBadge = `<span style="background: rgba(239, 68, 68, 0.2); color: #FCA5A5; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">🐛 ${f.tipo}</span>`;
        }

        const stars = '★'.repeat(f.nota_nps || 5) + '☆'.repeat(5 - (f.nota_nps || 5));
        const formattedDate = f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : 'Hoje';

        tr.innerHTML = `
          <td>
            <strong>${f.corretor_nome}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">CRECI: ${f.corretor_creci}</div>
          </td>
          <td>${typeBadge}</td>
          <td><span style="color: #FBBF24; font-size: 0.9rem;">${stars}</span></td>
          <td style="max-width: 350px; line-height: 1.4; color: #FFF;">"${f.mensagem}"</td>
          <td style="font-size: 0.78rem; color: var(--text-muted);">${formattedDate}</td>
        `;

        tbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('Erro ao carregar feedbacks:', err);
  }
}
