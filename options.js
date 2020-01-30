
// Saves options to chrome.storage
function save_options() {
	var shortcutKeys = document.getElementById('shortcutKeys').checked;
	var selectMode = document.getElementById('selectMode').checked;
	var selectHours = document.getElementById('selectHours').value;
	
	var showBankHolidays = document.getElementById('showBankHolidays').checked;
	var holidayRegion = document.getElementById('holidayRegion').value;
	
	var autoLogin = document.getElementById('autoLogin').checked;
	var employeeNumber = document.getElementById('employeeNumber').value;
	
	var autoFillFields = document.getElementById('autoFillFields').value;
	var autoFillTaskNumber = document.getElementById('autoFillTaskNumber').value;
	var autoFillProjectCode = document.getElementById('autoFillProjectCode').value;
	
	chrome.storage.sync.get({
		specialToken: ""
	}, function(items) {
		
		chrome.storage.sync.set({
			shortcutKeys: shortcutKeys,
			selectMode: selectMode,
			selectHours: selectHours,
			showBankHolidays: showBankHolidays,
			holidayRegion: holidayRegion,
			autoLogin: autoLogin,
			employeeNumber: savePrepEmployeeNumber(items.specialToken, employeeNumber),
			autoFillFields: autoFillFields,
			autoFillTaskNumber: autoFillTaskNumber,
			autoFillProjectCode: autoFillProjectCode,
		}, function() {
			// Update status to let user know options were saved.
			var status = document.getElementById('status');
			status.textContent = 'Options saved!';
			setTimeout(function() {
				status.textContent = '';
			}, 2000);
		});
		
	});
}

// Toggles visibility of bank holiday sub-settings
function toggleBankHolidayContainer(shouldShow) {
	document.getElementById('bankHolidaySettingsContainer').style.display = shouldShow ? "block" : "none";
}
// Toggles visibility of auto login sub-settings
function toggleAutoLoginContainer(shouldShow) {
	document.getElementById('autoLoginSettingsContainer').style.display = shouldShow ? "block" : "none";
}
// Toggles visibility of auto fill fields sub-settings
function toggleAutoFillFieldsContainer(shouldShow) {
	document.getElementById('autoFillFieldsSettingsContainer').style.display = shouldShow ? "block" : "none";
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	chrome.storage.sync.get({
		shortcutKeys: true,
		selectMode: true,
		selectHours: "",
		showBankHolidays: true,
		holidayRegion: 'england-and-wales',
		autoLogin: false,
		employeeNumber: "",
		specialToken: null,
		autoFillFields: true,
		autoFillTaskNumber: "1",
		autoFillProjectCode: "",
	}, function(items) {
		if (!items.specialToken) assignSpecialToken();
		
		document.getElementById('shortcutKeys').checked = items.shortcutKeys;
		document.getElementById('selectMode').checked = items.selectMode;
		document.getElementById('selectHours').value = items.selectHours;
		
		document.getElementById('showBankHolidays').checked = items.showBankHolidays;
		document.getElementById('holidayRegion').value = items.holidayRegion;
		toggleBankHolidayContainer(items.showBankHolidays);
		
		document.getElementById('autoLogin').checked = items.autoLogin;
		document.getElementById('employeeNumber').value = loadPrepEmployeeNumber(items.specialToken, items.employeeNumber);
		toggleAutoLoginContainer(items.autoLogin);
		
		document.getElementById('autoFillFields').checked = items.autoFillFields;
		document.getElementById('autoFillTaskNumber').value = items.autoFillTaskNumber;
		document.getElementById('autoFillProjectCode').value = items.autoFillProjectCode;
		toggleAutoFillFieldsContainer(items.autoFillFields);
	});
}


// Fetches bank holidays from UK gov and fills out the settings list
function fill_region_options() {
	fetchBankHolidaysJSON(function(holidaysJSON) {
		let optionsList = document.getElementById("holidayRegion");
		
		let regions = Object.keys(holidaysJSON)
		
		for (var i = 0; i < regions.length; i++){
			let region = regions[i];
			
			let option = document.createElement("option");
			option.text = region;
			option.value = region;
			
			optionsList.add(option);
		}
		
		// Only try to restore options once all options are avaliable
		restore_options();
	});
}

document.addEventListener('DOMContentLoaded', fill_region_options);
document.getElementById('save').addEventListener('click', save_options);

// Add support for maxLength field to number inputs
document.querySelectorAll('input[type="number"]').forEach(function(input) {
	input.addEventListener('input', function(event) {
		this.value = this.value.slice(0, this.maxLength);
	});
});

document.getElementById("showBankHolidays").addEventListener("change", function(event) {
	toggleBankHolidayContainer(event.target.checked);
});
document.getElementById("autoLogin").addEventListener("change", function(event) {
	toggleAutoLoginContainer(event.target.checked);
});
document.getElementById("autoFillFields").addEventListener("change", function(event) {
	toggleAutoFillFieldsContainer(event.target.checked);
});