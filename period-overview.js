chrome.storage.sync.get({
	selectHours: "7.5",
}, function(items) {
	let dayFields = [...document.querySelectorAll("#calDates_tabCalendar > tbody input")];
	let selectHours = parseInt(items.selectHours) || 0;

	dayFields.map(dayField => {
		let intVal = parseInt(dayField.value) || 0;
		if (intVal == selectHours) dayField.style.background = "#0e68";
	});
});