document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('cpassword');
    const passwordInput = document.getElementById('password');
    const statusDiv = document.getElementById('status');
    const loginContainer = document.getElementById('container');
    const kidsContent = document.getElementById('kidsContent');
    const logoutButton = document.getElementById('logoutBtn'); 
    const password2 = document.getElementById('password2'); 


    // Function to update popup content based on login status
    function updatePopupContent() {
        // Check if user is logged in
        chrome.storage.local.get('loggedIn', function (data) {
            if (data.loggedIn) {
                // User is logged in
                loginContainer.style.display = 'none';
                kidsContent.style.display = 'block';
            } else {
                // User is not logged in
                loginContainer.style.display = 'block';
                kidsContent.style.display = 'none';
            }
        });
    }

    // Update popup content when the popup is opened
    updatePopupContent();

    // Event listener for login form submission
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const pass1 = usernameInput.value;
        const pass2 = passwordInput.value;

        statusDiv.textContent = '';

        // Send login request to background script
        chrome.runtime.sendMessage({ action: 'startKidsMode', username: pass1, password: pass2 }, function (response) {
            if (response && response.success == true) {
                statusDiv.textContent = 'Kids mode started successfully!';
                // console.log(username, "ssss")
                updatePopupContent();
            } else {
                statusDiv.textContent = 'Kids mode failed. Please try again.';
                usernameInput.value = '';
                passwordInput.value = '';
            }
        });
    });

    // Event listener for logout button
    logoutButton.addEventListener('click', function (event) {
        event.preventDefault();
        // const pass1 = username2.value;
        const pass2 = password2.value;

        statusDiv.textContent = '';

        // Send logout request to background script
        chrome.runtime.sendMessage({ action: 'logout', password: pass2 }, function (response) {
            if (response && response.success == true) {
                statusDiv.textContent = 'Logged out successfully!';
                updatePopupContent();
            } else {
                statusDiv.textContent = 'Failed to logout.';
                // usernameInput.value = '';
                passwordInput.value = '';
            }
        });
    });
});
