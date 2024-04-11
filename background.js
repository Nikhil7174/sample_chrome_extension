//session timeout timer
let timeoutId;

function startSessionTimeout() {
    const timeoutDuration = 0.1 * 60 * 1000; // 30 minutes
    clearTimeout(timeoutId);
    timeoutId = setTimeout(sessionTimeout, timeoutDuration);
}

// Function to handle new window creation attempts
// function handleNewWindowCreation(windowInfo) {
//     // If the user is logged out (session timed out), prevent new window creation

//         // Close the newly created window
//         chrome.windows.remove(windowInfo.id, function() {
//             console.log('New window creation prevented due to session timeout.');
//         });
    
// }

function startKidsMode(username, password, sendResponse) {
    console.log(username, password);

    chrome.storage.local.set({ loggedIn: true, username: username, password: password }, function () {
        if (chrome.runtime.lastError) {
            console.error('Error storing data:', chrome.runtime.lastError);
            sendResponse({ success: false });
        } else if (username && password) {
            console.log('kids mode started successfully:', username);
            sendResponse({ success: true });

            startSessionTimeout();

            chrome.windows.create({
                url: '/home.html',
                type: 'normal' 
            }, chrome.windows.getCurrent(function (currentWindow) {
                chrome.windows.remove(currentWindow.id);
            }),
            );
        }
    });
}

// Function to handle user logout
function logoutUser(username, password, sendResponse) {
    // chrome.storage.local.get(['loggedIn', 'username', 'password'], function(data) {
    //     const storedUsername = data.username;
    //     const storedPassword = data.password;
    //     console.log(username, password)
    //     console.log(storedUsername, storedPassword)
    // if(true){
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
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.windows.remove(currentWindow.id);
    }),
    );
}
// })
// }

//Function to handle session timeout
function sessionTimeout(){
    chrome.windows.create({
        url: '/sessionTimeout.html',
        type: 'normal' 
    },
    chrome.windows.getCurrent(function (currentWindow) {
        chrome.windows.remove(currentWindow.id);
    }),
    )
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