// Event listener for tab creation
chrome.tabs.onCreated.addListener(function (tab) {
    // Check if kids mode is on
    chrome.storage.local.get(['loggedIn', 'sessionTimeout'], function (data) {
        if (data.loggedIn && data.sessionTimeout) {
            // Kids mode is on and session has timed out, get the URL of the newly created tab
            const tabUrl = tab.url;
            console.log("New tab URL:", tabUrl);
            if (tabUrl !== "chrome://extensions/") {
                chrome.tabs.update(tab.id, { url: '/sessionTimeout.html' });
            }
        }
    });
});

//session timeout timer
let timeoutId;

function startSessionTimeout() {
    const timeoutDuration = 0.1 * 60 * 1000; // 30 minutes
    clearTimeout(timeoutId);
    timeoutId = setTimeout(sessionTimeout, timeoutDuration);
}


async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

// Example usage


function startKidsMode(username, password, sendResponse) {
    console.log(username, password);


    // Set the user as logged in
hashPassword(password).then(hash => {
    console.log('Hashed password:', hash);
    
    chrome.storage.local.set({ loggedIn: true, username: username, password: hash }, function () {
        if (chrome.runtime.lastError) {
            console.error('Error storing data:', chrome.runtime.lastError);
            sendResponse({ success: false });
        } else if (username && password) {
            console.log('Kids mode started successfully:', username);
            sendResponse({ success: true });
            // Start session timeout
            startSessionTimeout();

            // Create a new window
            chrome.windows.create({
                url: '/home.html',
                type: 'normal'
            },
                chrome.windows.getAll({ populate: true }, function (windows) {
                    windows.forEach(function (window) {
                        chrome.windows.remove(window.id);
                    });
                })
            );
        }
    }).catch(error => {
        console.error('Error hashing password:', error);
    });
    });
}


// Function to handle user logout
function logoutUser(username, password, sendResponse) {
    // Close all existing windows
    chrome.storage.local.set({ sessionTimeout: false }, function () {
        if (chrome.runtime.lastError) {
            console.error('Error setting sessionTimeout flag:', chrome.runtime.lastError);
        }
    });

    chrome.storage.local.get(['loggedIn', 'username', 'password'], function (data) {
        const storedUsername = data.username;
        const storedPassword = data.password;
        console.log(username, password)
        console.log(storedUsername, storedPassword)
        hashPassword(password).then(hash => {
            console.log('Hashed password:', hash);
        
        if (storedPassword === hash && storedUsername === username) {
            chrome.storage.local.remove(['loggedIn', 'username'], function () {
                if (chrome.runtime.lastError) {
                    console.error('Error clearing data:', chrome.runtime.lastError);
                } else {
                    console.log('User logged out successfully');
                    sendResponse({ success: true });
                    clearTimeout(timeoutId);
                }
        });
            // Define the URL based on the type of logout
            // let url = timeoutId ? 'sessionTimeout.html' : 'https://google.com';
            chrome.windows.create({
                url: 'https://google.com',
                type: 'normal'
            },
                chrome.windows.getAll({ populate: true }, function (windows) {
                    windows.forEach(function (window) {
                        chrome.windows.remove(window.id);
                    });
                })
                // chrome.windows.getCurrent(function (currentWindow) {
                //     chrome.windows.remove(currentWindow.id);
                // }),
            )
        }
    }).catch(error => {
        console.error('Error hashing password:', error);
    });
    })
}

//Function to handle session timeout
function sessionTimeout() {
    chrome.storage.local.set({ sessionTimeout: true }, function () {
        if (chrome.runtime.lastError) {
            console.error('Error setting sessionTimeout flag:', chrome.runtime.lastError);
        }
    });

    chrome.windows.create({
        url: '/sessionTimeout.html',
        type: 'normal'
    },
        chrome.windows.getAll({ populate: true }, function (windows) {
            windows.forEach(function (window) {
                chrome.windows.remove(window.id);
            });
        }))
    // handleNewWindowCreation();
}

// Listener for messages from content scripts or UI components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startKidsMode') {
        startKidsMode(request.username, request.password, sendResponse);
        return true;

    } else if (request.action === 'logout') {
        logoutUser(request.username, request.password, sendResponse);
        return true;
    }
});

// chrome.windows.onCreated.addListener(handleNewWindowCreation);