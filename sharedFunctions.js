// Cache extension version
var extensionVersion = chrome.runtime.getManifest().version;

// Prints a themed and formatted message to the developer's console
function polyfilerLog(message) {
	console.log("%c[DTX Polyfiller v" + extensionVersion + "]%c: " + message,
			"font-size: 14px; color: #88f", "font-size: 14px; color: #fff");
}