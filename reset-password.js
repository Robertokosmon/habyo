// HABYO - PASSWORD RESET CLIENT SIDE HANDLER

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const creci = urlParams.get('creci');

  const form = document.getElementById('resetPasswordForm');
  const alertBox = document.getElementById('resetAlertBox');
  const newPassInput = document.getElementById('newPass');
  const confirmPassInput = document.getElementById('confirmNewPass');

  if (!token) {
    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.style.background = 'rgba(239, 68, 68, 0.2)';
      alertBox.style.color = '#F87171';
      alertBox.style.border = '1px solid #EF4444';
      alertBox.textContent = '🔒 Link de redefinição inválido ou ausente. Solicite uma nova recuperação na tela de login.';
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newPassword = newPassInput ? newPassInput.value.trim() : '';
      const confirmPassword = confirmPassInput ? confirmPassInput.value.trim() : '';

      if (!newPassword || newPassword.length < 6) {
        showAlert('A nova senha deve ter no mínimo 6 caracteres.', true);
        return;
      }

      if (newPassword !== confirmPassword) {
        showAlert('As senhas digitadas não coincidem. Digite novamente.', true);
        return;
      }

      showAlert('🔄 Redefinindo sua senha...', false);

      try {
        const response = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
        const data = await response.json();

        if (data.success) {
          showAlert(data.message, false, '#34D399', 'rgba(16, 185, 129, 0.2)');
          setTimeout(() => {
            alert('🎉 Senha alterada com sucesso! Redirecionando para a tela de login...');
            window.location.href = '/login';
          }, 1500);
        } else {
          showAlert(data.error || 'Erro ao redefinir senha.', true);
        }
      } catch (err) {
        showAlert('❌ Erro de conexão com o servidor.', true);
      }
    });
  }

  function showAlert(msg, isError = true, customColor = null, customBg = null) {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    if (isError) {
      alertBox.style.background = 'rgba(239, 68, 68, 0.2)';
      alertBox.style.color = '#F87171';
      alertBox.style.border = '1px solid #EF4444';
    } else {
      alertBox.style.background = customBg || 'rgba(37, 99, 235, 0.2)';
      alertBox.style.color = customColor || '#60A5FA';
      alertBox.style.border = '1px solid #2563EB';
    }
    alertBox.textContent = msg;
  }
});
