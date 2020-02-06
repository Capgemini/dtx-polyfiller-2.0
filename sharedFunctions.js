const setting_apiURL = "https://www.gov.uk/bank-holidays.json"; // URL to fetch up to date bank holidays




// Injects a content script into the page with access to page functions
function injectScript(scriptStr) {	
	var script = document.createElement('script');
	script.textContent = scriptStr;
	document.head.appendChild(script);
	script.remove();
}

// Returns true if number is odd
function isOdd(num) {
    return (num % 2) == 1;
}

// Checks if an element (child) is inside another element (parent)
function isDescendant(parent, child) {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}


// Pulls bank holidays from UK gov site and sends them to handler
function fetchBankHolidaysJSON(callback) {
    const endpoint = setting_apiURL;
    fetch(endpoint)
        .then((response) => response.json())
        .then((data) => callback(data));
}





// Prints a themed and formatted message to the developer's console
function polyfilerLog(message) {
	console.log("%c[DTX Polyfiller v" + getExtensionVersion() + "]%c: " + message,
			"font-size: 14px; color: #88f", "font-size: 14px; color: #fff");
}




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







// Returns which version is newest
//  1 if v1 is newer
//  0 if the same
//  -1 if older
//  -1 if either are null
function versionCompare(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}


function assembleToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    return hex;
}


function assignSpecialToken(callback) {
	var newToken = assembleToken();
	chrome.storage.sync.set({specialToken: newToken}, function() {
		if (callback) callback(newToken);
	});
}

function loadPrepEmployeeNumber(specialToken, storageItem) {
	var data = CryptoJS.AES.decrypt(storageItem, specialToken+'\'');
	return data.toString(CryptoJS.enc.Utf8);
}

function savePrepEmployeeNumber(specialToken, employeeNumber) {
	var data = CryptoJS.AES.encrypt(employeeNumber, specialToken+'\'');
	return data.toString();
}