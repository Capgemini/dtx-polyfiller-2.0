
// Uses user's selectHours setting to highlight full days in period overview calendar in green
chrome.storage.sync.get({
	selectHours: 7.5,
}, function(items) {
	let dayFields = [...document.querySelectorAll("#calDates_tabCalendar > tbody input")];

	dayFields.map(dayField => {
		let intVal = parseFloat(dayField.value) || 0; // If field has no value use 0
		if (intVal == items.selectHours) dayField.style.background = "#0e68";
	});
});