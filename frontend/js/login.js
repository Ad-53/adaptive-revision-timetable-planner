redirectIfLoggedIn();

const form = document.getElementById('login-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    // Covers wrong password, unknown email, unconfirmed email, etc.
    showMessage(messageEl, error.message, 'error');
    return;
  }

  window.location.href = 'profile.html';
});
