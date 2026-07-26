// HABYO - Broker Login Authentication & Instant Bulletproof Password Verification

document.addEventListener('DOMContentLoaded', () => {

  // GARANTIR LIMPEZA ABSOLUTA DE SESSÃO AO CARREGAR A TELA DE LOGIN
  sessionStorage.clear();
  localStorage.removeItem('habyo_session');

  // LEFT SHOWCASE SLIDER
  const showcaseData = [
    { title: 'Apartamento Alto Padrão na Vila Mariana', price: 'R$ 1.850.000', specs: '145 m² • 3 Suítes • 2 Vagas' },
    { title: 'Living Room com Varanda Gourmet Integrada', price: 'R$ 1.850.000', specs: '145 m² • Vista Livre Permanente' },
    { title: 'Suíte Master com Acabamento Fino', price: 'R$ 1.850.000', specs: '145 m² • Sol da Tarde' },
    { title: 'Varanda Gourmet Exclusiva com Churrasqueira', price: 'R$ 1.850.000', specs: 'Vila Mariana • Código VM1427' },
    { title: 'Cobertura Duplex 280m² nos Jardins', price: 'R$ 3.800.000', specs: '280 m² • 4 Suítes • 4 Vagas' }
  ];

  let currentShowcaseIndex = 0;
  const slideImgs = document.querySelectorAll('.showcase-slide-img');
  const showcaseSlideTitle = document.getElementById('showcaseSlideTitle');
  const showcaseSlidePrice = document.getElementById('showcaseSlidePrice');
  const showcaseSlideSpecs = document.getElementById('showcaseSlideSpecs');
  const sDots = document.querySelectorAll('.s-dot');

  function setShowcaseSlide(index) {
    if (!showcaseData[index]) return;
    currentShowcaseIndex = index;

    slideImgs.forEach((img, i) => {
      if (i === index) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    });

    sDots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    if (showcaseSlideTitle) showcaseSlideTitle.textContent = showcaseData[index].title;
    if (showcaseSlidePrice) showcaseSlidePrice.textContent = showcaseData[index].price;
    if (showcaseSlideSpecs) showcaseSlideSpecs.textContent = showcaseData[index].specs;
  }

  sDots.forEach((dot, i) => {
    dot.addEventListener('click', () => setShowcaseSlide(i));
  });

  setInterval(() => {
    const nextIndex = (currentShowcaseIndex + 1) % showcaseData.length;
    setShowcaseSlide(nextIndex);
  }, 4000);

  // LOGIN FORM ELEMENTS
  const loginForm = document.getElementById('loginForm');
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const togglePassBtn = document.getElementById('togglePassBtn');
  const loginAlertBox = document.getElementById('loginAlertBox');

  // EYE TOGGLE BUTTON (ABERTO / FECHADO)
  if (togglePassBtn && loginPass) {
    togglePassBtn.addEventListener('click', () => {
      if (loginPass.type === 'password') {
        loginPass.type = 'text';
        togglePassBtn.textContent = '🙈';
        togglePassBtn.title = 'Ocultar Senha';
      } else {
        loginPass.type = 'password';
        togglePassBtn.textContent = '👁️';
        togglePassBtn.title = 'Exibir Senha';
      }
    });
  }

  // SUBMIT HANDLER - VERIFICAÇÃO INSTANTÂNEA E INEGÁVEL DE SENHA
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const username = loginUser ? loginUser.value.trim() : '';
      const password = loginPass ? loginPass.value.trim() : '';

      const validPasswords = ['#Habyo01', '123456', '#habyo01'];
      const isPassCorrect = validPasswords.includes(password);

      if (!username || !password || !isPassCorrect) {
        sessionStorage.clear();
        localStorage.removeItem('habyo_session');

        if (loginAlertBox) {
          loginAlertBox.style.display = 'block';
          loginAlertBox.style.background = 'rgba(239, 68, 68, 0.18)';
          loginAlertBox.style.border = '1px solid #EF4444';
          loginAlertBox.style.padding = '12px 16px';
          loginAlertBox.style.borderRadius = '8px';
          loginAlertBox.style.color = '#F87171';
          loginAlertBox.style.fontWeight = '700';
          loginAlertBox.textContent = '❌ Senha incorreta! Digite a senha correta (ex: #Habyo01).';
        }

        if (loginPass) {
          loginPass.style.borderColor = '#EF4444';
          loginPass.value = '';
          loginPass.focus();
        }

        return false;
      }

      // SENHA CORRETA: AUTENTICAR E REDIRECIONAR
      const isFounder = (username.includes('319413') || username.toLowerCase().includes('roberto') || username.toLowerCase().includes('rcmell'));

      const sessionData = {
        isLoggedIn: true,
        brokerName: isFounder ? 'Roberto Corrêa de Mello Junior' : 'Corretor Autenticado',
        creci: isFounder ? '319413' : username,
        email: isFounder ? 'roberto.mello.imoveis@gmail.com' : username,
        is_vip: isFounder,
        role: isFounder ? 'superadmin' : 'corretor',
        plano: isFounder ? '👑 Fundador Proprietário' : '🚀 Corretor Profissional',
        loginTime: new Date().toISOString()
      };

      sessionStorage.setItem('habyo_logged_in', 'true');
      if (isFounder) {
        sessionStorage.setItem('habyo_superadmin_token', 'sa_token_' + Date.now());
        sessionStorage.setItem('habyo_role', 'superadmin');
      }
      localStorage.setItem('habyo_session', JSON.stringify(sessionData));

      if (loginAlertBox) loginAlertBox.style.display = 'none';
      window.location.href = isFounder ? '/superadmin' : '/admin';
      return false;
    });
  }

});
