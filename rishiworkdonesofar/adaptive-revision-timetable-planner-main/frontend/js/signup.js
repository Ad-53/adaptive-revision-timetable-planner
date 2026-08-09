redirectIfLoggedIn();

const form = document.getElementById('signup-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const displayName = document.getElementById('displayName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showMessage(messageEl, 'Passwords do not match.', 'error');
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    // Covers duplicate email, weak password, etc. — Supabase returns a readable message
    showMessage(messageEl, error.message, 'error');
    return;
  }

  if (data.session) {
    window.location.href = 'profile.html';
  } else {
    showMessage(messageEl, 'Account created. Check your email to confirm before logging in.', 'success');
  }
});
