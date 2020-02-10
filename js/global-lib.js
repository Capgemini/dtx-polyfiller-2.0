/*
    global-lib.js
     This file contains a collection of functions and variables used across the entire extension.
     As such, this script should be injected on all DTX pages before other scripts
*/


// Variables
const bankHolidays_apiURL = "https://www.gov.uk/bank-holidays.json"; // URL to fetch up to date bank holidays





// Prints a themed and formatted message to the developer's console
function polyfilerLog(message) {
	console.log("%c[DTX Polyfiller v" + getExtensionVersion() + "]%c: " + message,
			"font-size: 14px; color: #88f", "font-size: 14px; color: #fff");
}

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


// Returns true if a date falls on a bank holiday inside JSON events
function isBankHoliday(selectedDate, holidaysJSON) {
    for (let i = 0; i < holidaysJSON.length; i++) {
        let dateObj = new Date(holidaysJSON[i].date);
		dateObj.setHours(0); // Eliminate British Summer Time

        // Compare milliseconds since the Unix Epoch (JS safe way to compare dates)
        if (dateObj.getTime() == selectedDate.getTime()) {
            return true;
        }
    }
    return false;
}

// Pulls bank holidays from UK gov site and sends them to handler
function fetchBankHolidaysJSON(callback) {
    fetch(bankHolidays_apiURL)
        .then((response) => response.json())
        .then((data) => callback(data));
}


// Loads bank holidays JSON from cache or downloads it if cache is unset or old
// Runs callback with parameters:
//  callback(holidayRegions, holidayEvents)
function getBankHolidaysJSON(items, callback) {
    const currentDate = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const cacheAvaliable = items.cacheDateBankHolidays && currentDate - thirtyDays < items.cacheDateBankHolidays;
    
    if (cacheAvaliable) {
        polyfilerLog("Loaded bank holidays from cache");
        callback(items.cacheBankHolidayRegions, items.cacheBankHolidaysEvents);

    } else {
        polyfilerLog("Pulling bank holidays from " + bankHolidays_apiURL);
        fetchBankHolidaysJSON((holidaysJSON) => {
            const bankHolidayRegions = Object.keys(holidaysJSON);

            // Get bank holidays table based off user's settings
			let bankHolidayEvents = holidaysJSON[items.holidayRegion];
			try {
				if (!items.holidayRegion) throw "Your bank holiday region is unset!";
				if (!bankHolidayEvents) throw "Bank holidays JSON from gov.uk didn't contain your region!";
				bankHolidayEvents = holidaysJSON[items.holidayRegion].events;
			} catch(e) {
				throw new Error("ERROR SHOWING BANK HOLIDAYS:\n" + e);
            }
            
            chrome.storage.sync.set({
                cacheBankHolidayRegions: bankHolidayRegions,
                cacheBankHolidaysEvents: bankHolidayEvents,
                cacheDateBankHolidays: currentDate
            },
            function() {
                callback(bankHolidayRegions, bankHolidayEvents)
            });
        });
    }
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
	chrome.storage.sync.set({specialToken: newToken}, () => {
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



// Load settings from storage (with defaults) and run a given function
function LoadExtensionSettings(callback) {
    chrome.storage.sync.get({
        lastVersionUsed: null,

        shortcutKeys: true,
        selectMode: true,
        selectHours: 7.5,

        showBankHolidays: true,
        holidayRegion: "england-and-wales",
        cacheBankHolidaysEvents: null,
        cacheBankHolidayRegions: null,
        cacheDateBankHolidays: null,

        autoLogin: false,
        employeeNumber: "",
        stopAutoLogin: false,
        specialToken: null,

        autoFillFields: true,
        autoFillTaskNumber: "1", // Task number is sometimes a string
        autoFillProjectCode: "",
        
        patternFill_startDay: 1,
        patternFill_daysOn: 4,
        patternFill_daysOff: 4,
        patternFill_includeBankHolidays: true,

    }, (items) => {
        if (!items.holidayRegion || items.holidayRegion.trim() == "") items.holidayRegion = "england-and-wales";
        callback(items);
    });
}