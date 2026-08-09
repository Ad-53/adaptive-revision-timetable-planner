// Check if already logged in and redirect
async function redirectIfLoggedIn() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = '/design';
  }
}

// Show message helper
function showMessage(element, message, type) {
  element.classList.remove('hidden');
  element.textContent = message;
  element.style.color = type === 'error' ? '#d32f2f' : '#388e3c';
}

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

  window.location.href = '/design';
});

// Redirect on page load if already logged in
document.addEventListener('DOMContentLoaded', redirectIfLoggedIn);
