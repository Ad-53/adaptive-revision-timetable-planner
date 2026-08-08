const form = document.getElementById('reset-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showMessage(messageEl, 'Passwords do not match.', 'error');
    return;
  }

  // Supabase automatically picks up the recovery session from the URL fragment
  // that the reset-link redirect adds, so no token handling needed here.
  const { error } = await supabaseClient.auth.updateUser({ password });

  if (error) {
    showMessage(messageEl, error.message, 'error');
    return;
  }

  showMessage(messageEl, 'Password updated. Redirecting to login...', 'success');
  setTimeout(() => (window.location.href = 'login.html'), 1500);
});
