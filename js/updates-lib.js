
// Set to true to simulate update from < 2.8.5
/*
    chrome.storage.sync.set({
        employeeNumber: "290937",
        autoLogin: true,
        stopAutoLogin: null,
        lastVersionUsed: null,
    });
*/


// Cache extension version
var extensionVersion = chrome.runtime.getManifest().version;

// Gets version number as a string (e.g. 1.2.4)
function getExtensionVersion() {
	return extensionVersion;
}

// Asynchronously updates version number in Chrome storage
function updateExtensionVersion(callback) {
	chrome.storage.sync.set({
		lastVersionUsed: getExtensionVersion(),
	}, function() {
		if (callback) callback();
	});
}

// Applies fixes to any stored data/settings when moving from one
// version to another
function applyUpdateFixes(items) {
    // Check if user has version that stores employeeNumber differently
    if (!items.lastVersionUsed || versionCompare(items.lastVersionUsed, "2.8.5") == -1) {
        alert("Polyfiller 2.0 updated!\nPlease review it on Chrome if you like it!");
        
        // If employeeNumber is set, repair it
        if (items.employeeNumber) {
            
            assignSpecialToken(function(newToken) {
                chrome.storage.sync.set({
                    employeeNumber: savePrepEmployeeNumber(newToken, items.employeeNumber)
                }, function() {
                    // Update version number before reloading to prevent
                    // Fix being re-ran on reload
                    updateExtensionVersion(function() {
                        location.reload(); // Reload page to apply auto-login						
                    });
                });
            })

            items.autoLogin = null; // Block auto-login cached setting this session
        }
    }
    return items;
}

// Updates the stored last version used setting, used to show update notifications
// or run update fixes
function updateLastUsedVersion(items) {
    // Update stored version number if changed
    /* ALL UPDATE FIXES BE APPLIED ABOVE THIS POINT */
    if (items.lastVersionUsed != getExtensionVersion()) {
        // Update cached variable immediatly
        items.lastVersionUsed = getExtensionVersion();
        
        updateExtensionVersion();
    }
    return items;
}


function processExtensionUpdates(items) {
    let itemsNew = applyUpdateFixes(items);
    return updateLastUsedVersion(itemsNew);
}