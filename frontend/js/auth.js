// ============================================
// Auth Module — Login page logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (API.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const alertBox = document.getElementById('loginAlert');
    const submitBtn = document.getElementById('loginBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showAlert('Please enter your email and password.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';

        try {
            await API.login(email, password);
            showAlert('Authentication successful. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 600);
        } catch (err) {
            showAlert(err.message || 'Invalid credentials. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });

    function showAlert(message, type) {
        alertBox.textContent = message;
        alertBox.className = `alert ${type} show`;
    }
});
