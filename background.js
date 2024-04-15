// Event listener for tab creation
chrome.tabs.onCreated.addListener((tab) => {
    // Check if kids mode is on
    chrome.storage.local.get(['loggedIn', 'sessionTimeout'], (data) => {
        if (data.loggedIn && data.sessionTimeout) {
            // Kids mode is on and session has timed out, get the URL of the newly created tab
            const tabUrl = tab.url;
            // console.log("New tab URL:", tabUrl);
            if (tabUrl !== "chrome://extensions/") {
                chrome.tabs.update(tab.id, { url: '/sessionTimeout.html' });
            }
            blockHttpsSearch();
        }
    });
});

//session timeout timer
let timeoutId;

const startSessionTimeout = () => {
    const timeoutDuration = 0.15 * 60 * 1000; // 30 minutes
    clearTimeout(timeoutId);
    timeoutId = setTimeout(sessionTimeout, timeoutDuration);
}

// Hash password function
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

// Function to block Google search URLs
const blockHttpsSearch = () => {
    const blockRule = {
        id: 4,
        priority: 1,
        action: {
            type: 'block'
        },
        condition: {
            urlFilter: 'https://*/*',
            resourceTypes: ['main_frame']
        }
    };

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules: [blockRule]
    });
}

// Function to allow Google search URLs
const allowHttpsSearchAsync = async () => {
    return new Promise((resolve, reject) => {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [4],
            addRules: []
        }, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

// Function to start kids mode
const startKidsMode = async (cpassword, password, sendResponse) => {
    if (cpassword === password) {
        try{
        const hash = await hashPassword(password)
            chrome.storage.local.set({ loggedIn: true, password: hash }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error storing data:', chrome.runtime.lastError);
                    sendResponse({ success: false });
                } else if (cpassword && password) {
                    console.log('Kids mode started successfully:', cpassword);
                    sendResponse({ success: true });
                    // Start session timeout
                    startSessionTimeout();

                    // Create a new window
                    chrome.windows.create({
                        url: '/home.html',
                        type: 'normal'
                    },
                        chrome.windows.getAll({ populate: true }, (windows) => {
                            windows.forEach((window) => {
                                chrome.windows.remove(window.id);
                            });
                        })
                    );
                }
            });
        }
        catch(error) {
            console.error('Error hashing password:', error);
        }
    }
}

// Function to handle user logout
const logoutUser = async (password, sendResponse) => {
    try {
        // Set sessionTimeout to false
        chrome.storage.local.set({ sessionTimeout: false });

        // Retrieve stored data
        const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(['loggedIn', 'password'], (data) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(data);
                }
            });
        });

        const storedPassword = data.password;

        // Hash the provided password
        const hash = await hashPassword(password);

        // Check if the provided password matches the stored password
        if (storedPassword === hash) {
            // Remove user data from storage
            await new Promise((resolve, reject) => {
                chrome.storage.local.remove(['loggedIn', 'username'], () => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });

            console.log('User logged out successfully');
            sendResponse({ success: true });
            clearTimeout(timeoutId);

            await allowHttpsSearchAsync();

            // Close current windows
            chrome.windows.getAll({ populate: true }, (windows) => {
                windows.forEach((window) => {
                    chrome.windows.remove(window.id);
                });
            });

            // Create a new window with Google
            chrome.windows.create({
                url: 'https://google.com',
                type: 'normal'
            });
        } else {
            sendResponse({ success: false, error: 'Incorrect password' });
        }
    } catch (error) {
        console.error('Error logging out:', error);
        sendResponse({ success: false, error: 'An error occurred while logging out' });
    }
}

//Function to handle session timeout
const sessionTimeout = () => {
    chrome.storage.local.set({ sessionTimeout: true }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error setting sessionTimeout flag:', chrome.runtime.lastError);
        }
    });

    chrome.windows.create({
        url: '/sessionTimeout.html',
        type: 'normal'
    },
        chrome.windows.getAll({ populate: true }, (windows) => {
            windows.forEach((window) => {
                chrome.windows.remove(window.id);
            });
        })
    )
}

// Listener for messages from content scripts or UI components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startKidsMode') {
        startKidsMode(request.cpassword, request.password, sendResponse);
        return true;

    } else if (request.action === 'logout') {
        logoutUser(request.password, sendResponse);
        return true;
    }
});
