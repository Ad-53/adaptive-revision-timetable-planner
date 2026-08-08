// Login handling for the static login page
document.addEventListener('DOMContentLoaded', () => {
	// If user is already logged in, allow requireAuth helper to redirect appropriately
	if (typeof redirectIfLoggedIn === 'function') {
		try { redirectIfLoggedIn(); } catch (e) { /* ignore */ }
	}

	const form = document.getElementById('login-form');
	let messageEl = document.getElementById('message');
	if (!form) return;
	if (!messageEl) {
		messageEl = document.createElement('div');
		messageEl.className = 'message hidden';
		form.parentNode.insertBefore(messageEl, form.nextSibling);
	}

	form.addEventListener('submit', async (ev) => {
		ev.preventDefault();
		const email = document.getElementById('email').value;
		const password = document.getElementById('password').value;

		messageEl.classList.add('hidden');
		try {
			const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
			if (error) {
				showMessage(messageEl, error.message || 'Login failed', 'error');
				return;
			}
			// Successful login -> go to main dashboard (root)
			window.location.href = '/';
		} catch (err) {
			console.error('Login error', err);
			showMessage(messageEl, 'Unable to login. Try again later.', 'error');
		}
	});
});