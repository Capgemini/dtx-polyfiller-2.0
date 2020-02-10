// Clears all settings
function reset_options() {
	chrome.storage.sync.clear(() => {
		location.reload(); // Reload menu after reset
	})
}

// Saves options to chrome.storage
function save_options() {
	var shortcutKeys = document.getElementById('shortcutKeys').checked;
	var selectMode = document.getElementById('selectMode').checked;
	var selectHours = parseFloat(document.getElementById('selectHours').value) || 7.5;
	
	var showBankHolidays = document.getElementById('showBankHolidays').checked;
	var holidayRegion = document.getElementById('holidayRegion').value;
	
	var autoLogin = document.getElementById('autoLogin').checked;
	var employeeNumber = document.getElementById('employeeNumber').value;
	
	var autoFillFields = document.getElementById('autoFillFields').value;
	var autoFillTaskNumber = document.getElementById('autoFillTaskNumber').value;
	var autoFillProjectCode = document.getElementById('autoFillProjectCode').value;
	
	chrome.storage.sync.get({
		specialToken: ""
	}, (items) => {
		
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
		}, () => {
			// Update status to let user know options were saved.
			var status = document.getElementById('status');
			status.textContent = 'Options saved!';
			setTimeout(() => {
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

// Loads settings into UI from settings stored in chrome.storage
function load_options() {
	LoadExtensionSettings((items) => {

		// Fetches bank holidays from UK gov and fills out the settings list
		getBankHolidaysJSON(items, (holidayRegions, holidayEvents) => {
			let optionsList = document.getElementById("holidayRegion");
			
			holidayRegions.forEach((region) => {
				let option = document.createElement("option");
				option.text = region;
				option.value = region;
				
				optionsList.add(option);
			})
		});


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


document.getElementById('save').addEventListener('click', save_options);
document.getElementById('reset').addEventListener('click', reset_options);

// Add support for maxLength field to number inputs
document.querySelectorAll('input[type="number"]').forEach(function(input) {
	input.addEventListener('input', (event) => {
		this.value = this.value.slice(0, this.maxLength);
	});
});

document.getElementById("showBankHolidays").addEventListener("change", (event) => {
	toggleBankHolidayContainer(event.target.checked);
});
document.getElementById("autoLogin").addEventListener("change", (event) => {
	toggleAutoLoginContainer(event.target.checked);
});
document.getElementById("autoFillFields").addEventListener("change", (event) => {
	toggleAutoFillFieldsContainer(event.target.checked);
});


// Load options on startup
load_options();