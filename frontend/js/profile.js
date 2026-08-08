const messageEl = document.getElementById('message');

(async () => {
  const session = await requireAuth();
  if (!session) return;

  const user = session.user;
  document.getElementById('email').value = user.email;
  document.getElementById('nav-name').textContent = user.user_metadata?.display_name || user.email;
  document.getElementById('displayName').value = user.user_metadata?.display_name || '';

  // Read from the profiles table too, in case it's more up to date than the JWT metadata
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  if (profile?.display_name) {
    document.getElementById('displayName').value = profile.display_name;
  }
})();

document.getElementById('logout-btn').addEventListener('click', logout);

document.getElementById('name-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const displayName = document.getElementById('displayName').value.trim();

  const { data: { user } } = await supabaseClient.auth.getUser();

  const { error: authError } = await supabaseClient.auth.updateUser({
    data: { display_name: displayName },
  });

  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id);

  if (authError || profileError) {
    showMessage(messageEl, (authError || profileError).message, 'error');
    return;
  }

  document.getElementById('nav-name').textContent = displayName;
  showMessage(messageEl, 'Display name updated.', 'success');
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;

  if (!newPassword) {
    showMessage(messageEl, 'Enter a new password first.', 'error');
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

  if (error) {
    showMessage(messageEl, error.message, 'error');
    return;
  }

  document.getElementById('newPassword').value = '';
  showMessage(messageEl, 'Password changed.', 'success');
});
