// Profile page handler
const messageEl = document.getElementById('message');
const emailInput = document.getElementById('email');
const displayNameInput = document.getElementById('displayName');
const nameForm = document.getElementById('name-form');
const passwordForm = document.getElementById('password-form');
const newPasswordInput = document.getElementById('newPassword');
const logoutBtn = document.getElementById('logout-btn');

// Show message helper
function showMessage(element, message, type) {
  element.classList.remove('hidden');
  element.textContent = message;
  element.style.color = type === 'error' ? '#d32f2f' : '#388e3c';
}

// Load user data on page load
async function loadUserProfile() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (emailInput) emailInput.value = user.email;
    if (displayNameInput) displayNameInput.value = user.user_metadata?.display_name || '';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Handle name update
nameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newName = displayNameInput.value.trim();
  
  if (!newName) {
    showMessage(messageEl, 'Display name cannot be empty', 'error');
    return;
  }
  
  const { error } = await supabaseClient.auth.updateUser({
    data: { display_name: newName }
  });
  
  if (error) {
    showMessage(messageEl, error.message, 'error');
  } else {
    showMessage(messageEl, 'Display name updated successfully!', 'success');
    if (displayNameInput) displayNameInput.value = newName;
  }
});

// Handle password change
passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const newPassword = newPasswordInput.value;
  
  if (!newPassword) {
    // Keep current password - do nothing
    showMessage(messageEl, 'Password unchanged', 'success');
    return;
  }
  
  const { error } = await supabaseClient.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    showMessage(messageEl, error.message, 'error');
  } else {
    showMessage(messageEl, 'Password updated successfully!', 'success');
    newPasswordInput.value = '';
  }
});

// Handle logout
logoutBtn.addEventListener('click', async () => {
  try {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Load profile on page load
loadUserProfile();