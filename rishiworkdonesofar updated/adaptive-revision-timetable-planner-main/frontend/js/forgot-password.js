const form = document.getElementById('forgot-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${window.location.pathname.replace('forgot-password.html', 'reset-password.html')}`,
  });

  if (error) {
    showMessage(messageEl, error.message, 'error');
    return;
  }

  // Deliberately vague so we don't leak which emails have accounts
  showMessage(messageEl, 'If that email exists, a reset link has been sent.', 'success');
});
