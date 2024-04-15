document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const cpasswordInput = document.getElementById('cpassword');
    const passwordInput = document.getElementById('password');
    const statusDiv = document.getElementById('status');
    const loginContainer = document.getElementById('container');
    const kidsContent = document.getElementById('kidsContent');
    const logoutButton = document.getElementById('logoutBtn');
    const password2 = document.getElementById('password2');

    // Function to update popup content based on login status
    const updatePopupContent = async () => {
        // Check if user is logged in
        const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get('loggedIn', (data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data);
                }
            });
        });

        if (data.loggedIn) {
            // User is logged in
            loginContainer.style.display = 'none';
            kidsContent.style.display = 'block';
        } else {
            // User is not logged in
            loginContainer.style.display = 'block';
            kidsContent.style.display = 'none';
        }
    }

    // Update popup content when the popup is opened
    await updatePopupContent();

    // Event listener for login form submission
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const pass1 = cpasswordInput.value;
        const pass2 = passwordInput.value;

        statusDiv.textContent = '';

        try {
            // Send login request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'startKidsMode', cpassword: pass1, password: pass2 }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            if (response && response.success === true) {
                statusDiv.textContent = 'Kids mode started successfully!';
                await updatePopupContent();
            } else {
                statusDiv.textContent = 'Kids mode failed. Please try again.';
                cpasswordInput.value = '';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Error logging in:', error);
            statusDiv.textContent = 'An error occurred while logging in.';
        }
    });

    // Event listener for logout button
    logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const pass2 = password2.value;

        statusDiv.textContent = '';

        try {
            // Send logout request to background script
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'logout', password: pass2 }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            if (response && response.success === true) {
                statusDiv.textContent = 'Logged out successfully!';
                await updatePopupContent();
            } else {
                statusDiv.textContent = 'Failed to logout.';
                passwordInput.value = '';
            }
        } catch (error) {
            console.error('Error logging out:', error);
            statusDiv.textContent = 'An error occurred while logging out.';
        }
    });
});
