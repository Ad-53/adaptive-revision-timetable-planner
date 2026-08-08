// Shared auth helpers used across pages

// Redirects to login.html if there is no active session. Call at the top of protected pages.
async function requireAuth() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = '/login';
      return null;
    }

    // Validate session with backend before allowing protected access
    const token = session.access_token || session.provider_token || session.refresh_token;
    if (token) {
      try {
        const resp = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (resp.ok) return session;
      } catch (e) {
        // backend not reachable, fall through to sign out
      }
    }

    // If validation failed, sign out and redirect to login
    try { await supabaseClient.auth.signOut(); } catch (e) {}
    window.location.href = '/login';
    return null;
  } catch (e) {
    // On any error, redirect to login for safety
    try { await supabaseClient.auth.signOut(); } catch (err) {}
    window.location.href = '/login';
    return null;
  }
}

// If already logged in, validate with backend then redirect to dashboard.
async function redirectIfLoggedIn() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const token = session.access_token || session.provider_token || session.refresh_token;
    if (!token) return;

    // Validate session with backend before redirecting
    const resp = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if (resp.ok) {
      // Redirect to dashboard route (server serves combined dashboard at /)
      window.location.href = '/';
    } else {
      // Invalid session - sign out silently
      try { await supabaseClient.auth.signOut(); } catch (e) {}
    }
  } catch (e) {
    // ignore errors and do not redirect
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
  el.classList.remove('hidden');
}
