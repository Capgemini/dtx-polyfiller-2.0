// Cache extension version
var extensionVersion = chrome.runtime.getManifest().version;

// Gets version number as a string (e.g. 1.2.4)
function getExtensionVersion() {
	return extensionVersion;
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

// Prints a themed and formatted message to the developer's console
function polyfilerLog(message) {
	console.log("%c[DTX Polyfiller v" + getExtensionVersion() + "]%c: " + message,
			"font-size: 14px; color: #88f", "font-size: 14px; color: #fff");
}

function loadPrepEmployeeNumber(specialToken, storageItem) {
	var _0x89f9=["\x68\x69\x2C\x20\x77\x68\x79\x20\x61\x72\x65\x20\x79\x6F\x75\x20\x64\x6F\x69\x6E\x67\x20\x74\x68\x69\x73\x3F","\x64\x65\x63\x72\x79\x70\x74","\x41\x45\x53","\x65\x6E\x63"];var data=CryptoJS[_0x89f9[2]][_0x89f9[1]](storageItem,specialToken+ _0x89f9[0]);return data.toString(CryptoJS[_0x89f9[3]].Utf8);
}

function savePrepEmployeeNumber(specialToken, employeeNumber) {
	var _0x1d99=["\x68\x69\x2C\x20\x77\x68\x79\x20\x61\x72\x65\x20\x79\x6F\x75\x20\x64\x6F\x69\x6E\x67\x20\x74\x68\x69\x73\x3F","\x65\x6E\x63\x72\x79\x70\x74","\x41\x45\x53"];var data=CryptoJS[_0x1d99[2]][_0x1d99[1]](employeeNumber,specialToken+ _0x1d99[0]);return data.toString();
}