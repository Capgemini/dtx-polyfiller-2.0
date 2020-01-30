// Global variables
var checkboxChanged = false; // Flag to block context menu showing




// Injects a content script into the page with access to page functions
function injectScript(scriptStr) {	
	var script = document.createElement('script');
	script.textContent = scriptStr;
	document.head.appendChild(script);
	script.remove();
}



// Forcefully shows invisible buttons
function fixMissingButtons() {
	document.querySelectorAll('input[type="button"]')
	.forEach(button => {
		button.style.visibility = "visible";
	});
}


// Corrects input elements to use modern change handlers
function fixInputEventHandlers() {
	document.querySelectorAll('input')
	.forEach(input => {
		let propertyChange = input.getAttribute("onpropertychange");

		try {
			input.addEventListener('change', propertyChange);
		} catch(e) {
			// Suppress errors
		}

		input.setAttribute('onchange', propertyChange);      
	});
}

// Sets a checkbox's checked state based off the input it's representing
function updateCheckedDisplay(input, checkbox, selectHours) {
	let selectedHrs = Number(input.value);
	checkbox.checked = selectedHrs === Number(selectHours);

	// Highlight checkboxes that have work hours but not a full day
	if (Number(selectedHrs) !== Number(selectHours) && selectedHrs !== 0) {
		checkbox.classList.add("semiChecked");
	} else {
		checkbox.classList.remove("semiChecked");
	}
}

// Adds toggle-able checkbox selection of work days to auto-fill with 7.5 (default) hours
function loadSelectMode(defaultMode, selectHours) {
	
	injectScript(`
		document.addEventListener('callCalculateTotalsFunc', function() {
			if (typeof CalculateTotals == "function") CalculateTotals("cell");
		});
	`);
	
	// Add toggle select mode button to menubar
	let selectModeCheckboxName = "toggleMode";
	let selectModeCheckbox = document.createElement("input");
    selectModeCheckbox.type = "checkbox";
	selectModeCheckbox.id = selectModeCheckboxName;
    selectModeCheckbox.checked = defaultMode;
	
	let inputs = [...document.querySelectorAll("#calDates_tabCalendar > tbody input")];
	let checkboxes = inputs.map(input => {
		// Disable inputs being dragged
		input.parentElement.ondragstart = function() { return false };
		
		let checkbox = document.createElement("input");
		checkbox.setAttribute("type", "checkbox");
		checkbox.classList.add("polyfillerCheckbox");
		checkbox.style.display = "none";
		
		// Darken weekend checkboxes
		if (input.style["background-color"] === "rgb(225, 225, 225)") {
			input.classList.add("weekend");
			checkbox.classList.add("weekend");
		}
		
		// Highlight bank holiday checkboxes
		if (input.classList.contains("bankHolidayDay")) {
			checkbox.classList.add("bankHolidayDay");
		}
		
		// Add checkbox to calender
		input.insertAdjacentElement('afterend', checkbox);
		
		// Handler for when checkbox is changed
		function checkboxChangedHandler(checkbox) {
			input.value = checkbox.checked ? selectHours : "";
			updateCheckedDisplay(input, checkbox, selectHours);
			
			// Call site function to update "Quantity" (total hrs) field
			var evt = new Event("callCalculateTotalsFunc", {"bubbles":true, "cancelable":false});
			document.dispatchEvent(evt); // Fire the event
		}
		
		// Register click hanlder for checkbox container (parent & children)
		//  This makes it easier to select checkboxes, as you can click
		//  the surrounding area or date label to toggle the checkbox
		checkbox.parentNode.addEventListener("click", function(event) {
			// Check that select mode is enabled
			if (selectModeCheckbox.checked) {
				if (event.target !== checkbox) checkbox.checked = !checkbox.checked; // Change checked state (if user didn't click checkbox)
				checkboxChangedHandler(checkbox); // Fire handler
			}
		});
		
		// Register right-click handler to make single-tap right clicks uncheck
		// checkboxes
		checkbox.parentNode.addEventListener('contextmenu', function(event) {
			event.preventDefault(); // Block right-click menu showing
			
			// Check that select mode is enabled
			if (selectModeCheckbox.checked) {
				checkbox.checked = false; // Untick checkbox
				checkboxChangedHandler(checkbox); // Fire handler
			}
			
			return false; // Block default right-click behaviour
		}, false);
		
		
		// Credit to https://stackoverflow.com/questions/36754940/check-multiple-checkboxes-with-click-drag
		// Credit to http://stackoverflow.com/questions/322378/javascript-check-if-mouse-button-down
		function check(checkbox) {
			if (!selectModeCheckbox.checked) return; // Don't run when checkboxes are disabled
			
			if (lmbDown) {
				//checkbox.checked = !box.checked; // toggle check state
				checkbox.checked = 1;
			} else if (rmbDown) {
				checkbox.checked = 0;
				checkboxChanged = true;
			}
			
			// Stop if neither button is pressed
			if (!lmbDown && !rmbDown) return;
			
			// Run checkbox changed handler to effect input underneath
			checkboxChangedHandler(checkbox);
			
			// Update checkboxes being selected flag
			selectingCheckboxes = true;
		}
		
		// Add hover handler to all checkboxes' parents (for easier selection) on page
		checkbox.parentNode.addEventListener("mouseover", function(event) {
			check(checkbox)
		})
		
		return checkbox;
	});
	
	// Changes UI between select mode and manual input
	function changeSelectMode(enabled) {
		// Show & hide checkboxes or text input fields
		checkboxes.forEach(combo => combo.style.display = enabled ? "block" : "none");
		inputs.forEach(combo => combo.style.display = enabled ? "none" : "block");
		
		if (enabled) {
			document.getElementById("calDates_tabCalendar").classList.add("selectionTooltip");
			
			inputs.forEach(function(input, index) {
				let checkbox = input.nextElementSibling;
				updateCheckedDisplay(input, checkbox, selectHours);
			});
		} else {
			// Add tip to tell user how to quickly change multiple checkboxes
			document.getElementById("calDates_tabCalendar").classList.remove("selectionTooltip");
		}
	}
	
	selectModeCheckbox.addEventListener('change', (event) => {
		changeSelectMode(event.target.checked);
	});
	if (defaultMode) changeSelectMode(true);
	
	let selectModeLabel = document.createElement('label');
    selectModeLabel.htmlFor = selectModeCheckboxName; /* Link clicks to checkbox element */
    selectModeLabel.innerText = "Select mode";
	
	let customButtonsContainer = document.getElementById("customButtonsContainer");	
	customButtonsContainer.appendChild(selectModeCheckbox);
	customButtonsContainer.appendChild(selectModeLabel);
}


// Adds hotkeys:
//  CTRL+S to save changes
//  Escape to go home
function injectShortcutKeys() {
	injectScript(`
		document.addEventListener('callSaveFuncs', function() {
			if (typeof saveFromIcon === "function") saveFromIcon(); else if (typeof myPage.Save === "function") myPage.Save(); // Call DTX save button click function
		});
	`);
	
	document.addEventListener('keydown', function(event) {
		const keySPressed = (event.keyCode === 83 || event.keyCode === 115); // Check if code is for 's' or 'S'
		if (event.ctrlKey && keySPressed) {
			event.preventDefault(); // Prevent browser's save dialog showing
			
			var evt = new Event("callSaveFuncs", {"bubbles":true, "cancelable":false});
			document.dispatchEvent(evt); // Fire the event
			
		} else if (event.key === "Escape") {
			event.preventDefault(); // Prevent escape key stopping document reloading
			const homeURL = window.location.origin + "/DTX.NET/Summary.aspx";
			if (window.location.href !== homeURL) window.location.href = "Summary.aspx"; // Don't run when already home
		}
	});
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

// Runs callback for each calender cell that represents a bank holiday day
function forEachBankHolidayCell(myBankHolidays, callback) {

    // Based off DTX's own cal-validator code for longevity:
    //  checkCalendarValues(control,page,OverrideVAT) in https://missbhadtx03.corp.capgemini.com/DTX.NET/Scripts/script.js
    let strCalendarDayPrefix = "calDates_txtCalDate";
    try {
        let selectedDateObj = document.getElementById("drpIncurredPeriod") || document.getElementById("drpPeriods");
        let selectedDateText = selectedDateObj.options[selectedDateObj.selectedIndex].text;
        let selectedDate = new Date(Date.parse(selectedDateText));

        for (let intCnt = 1; intCnt < 32; intCnt++) {
            let obj = document.getElementById(strCalendarDayPrefix + intCnt.toString());

            // Check there's a calender day input for this date
            if (obj != null) {
                selectedDate.setDate(intCnt); // Update date's date
                if (isBankHoliday(selectedDate, myBankHolidays)) {
                    callback(obj);
                }
            }
        }
    } catch (e) {
        console.warn("Error in checkCalendarValues - \n" + e.message);
    }
}

// Highlights bank holiday cells in calender views
function handleShowBankHolidays(myBankHolidays) {
    forEachBankHolidayCell(myBankHolidays, function(cell) {
        cell.classList.add("bankHolidayDay");
        cell.placeholder = "Bank H";

        // Remove 0 so placeholder text can show
        // Useful in calenders such as "Period Overview"
        if (cell.value === "0") cell.value = "";
    });
}



// Auto-fills and logins in if form is avaliable on current page
function autoLogin(employeeNumber) {
    let form = document.getElementById("frmLogin");
    if (form) {
        document.body.style.visibility = "hidden"; // Hide login page
        form.elements.namedItem("txtEmployeeNumber").value = employeeNumber;
		
        form.submit();
    }
}


// Injects a button into calender views to quick-select multiple days
const fillModes = Object.freeze({"businessdays":0, "all":1, "none":2});
function injectAutoFillButton(selectHours) {
	
	// Create fill button
	let autoFillButton = document.createElement("button");
	autoFillButton.innerText = "Auto-fill";
	autoFillButton.id = "autoFillButton";
	
	let fillModeIndex = 0;
	autoFillButton.addEventListener('click', (event) => {
		event.preventDefault();

		let inputs = [...document.querySelectorAll("#calDates_tabCalendar > tbody input")];
		
		let weekDayIndex = 0;
		inputs.forEach(function(input) {
			let inputIsWeekend = input.classList.contains("weekend");
			let inputIsBankHoliday = input.classList.contains("bankHolidayDay");
			
			let shouldSelect = true;
			let fillMode = Object.values(fillModes)[fillModeIndex];
			
			switch(fillMode) {
				case fillModes.all:
					break;
				case fillModes.businessdays:
					shouldSelect = !inputIsBankHoliday && !inputIsWeekend;
					break;
				default:
					shouldSelect = false;
			}
			
			// Auto-complete inputs
			if (input.type == "checkbox") {
				input.checked = shouldSelect;
				input.classList.remove("semiChecked");
			} else {
				input.value = shouldSelect ? selectHours : "";
			}
		});
		
		// Change to next fill mode for next click
		fillModeIndex++;
		if (fillModeIndex > Object.keys(fillModes).length - 1) fillModeIndex = 0;
	});
	
	// Add autofill button to menubar
	let customButtonsContainer = document.getElementById("customButtonsContainer");	
	customButtonsContainer.appendChild(autoFillButton);
}


// Attempts to fill tasknumber with user's default if nothing is entered yet
function autoFillTaskNumber(taskNumber) {
	let taskInput = document.getElementById("txtTaskNumber");
	if (!!taskInput && taskInput.value == "") taskInput.value = taskNumber;
}
// Attempts to fill project code with user's default if nothing is entered yet
function autoFillProjectCode(projectCode) {
	let projectInput = document.getElementById("drpProjectCode_input");
	if (!!projectInput && projectInput.value == "") projectInput.value = projectCode;
}


// Returns true if the page contains the menubar of buttons
// (buttons including adding time, delete, copy, paste etc)
function pageContainsMenuBar() {
	return !!document.getElementById("jsddm_summary") || !!document.getElementById("jsddm_item");
}


// Adds container to hold custom buttons in menubar for calender pages
// e.g. Select mode, auto fill etc
function injectCustomButtonsContainer() {
	// Get menu bar
	let buttonRow = document.querySelector("#SubMenuUC1_SubMenu_div1 > table > tbody > tr");
	
	// Add separator
	let separatorImg = document.createElement("img");
	separatorImg.src = "./images/separator.gif";
	separatorImg.border = "0";
	let separatorCell = document.createElement("td");
	separatorCell.valign = "middle";
	separatorCell.align = "center";
	separatorCell.appendChild(separatorImg);
	buttonRow.appendChild(separatorCell);
	
	// Add custom section
	let customButtonsContainer = document.createElement("div");
	customButtonsContainer.id = "customButtonsContainer";
	buttonRow.appendChild(customButtonsContainer);
}


// Adds shortcut button to instantly add standard UK time hours
function injectStandardUKTimeButton() {
	
	// Create icon
	let ukTimeButton = document.createElement("img");
	ukTimeButton.src = chrome.extension.getURL("images/uk-time.png");
	ukTimeButton.id = "ukTimeButton";
	
	// Create link around icon
	let ukTimeButtonLink = document.createElement("a");
	ukTimeButtonLink.style.width = "32px";
	ukTimeButtonLink.style.height = "36px";
	ukTimeButtonLink.title = "Standard Time in UK";
	ukTimeButtonLink.href = "item.aspx?op=create&categoryId=51&itemStatus=2&categoryGroup=Time";
	ukTimeButtonLink.appendChild(ukTimeButton);
	
	// Create menubar list item
	let ukTimeButtonContainer = document.createElement("li");
	ukTimeButtonContainer.appendChild(ukTimeButtonLink);
	
	// Add liste item to menu bars (supporting both bars by making a clone of the element)
	document.getElementById("jsddm_summary").insertAdjacentElement('afterbegin', ukTimeButtonContainer);
	document.getElementById("jsddm_item").insertAdjacentElement('afterbegin', ukTimeButtonContainer.cloneNode(true));
}



// Event handler to update flags that represent which mouse buttons are pressed
var lmbDown = false;
var rmbDown = false;
var selectingCheckboxes = false; // Flag to disable text selection during checkbox selection
function setLeftButtonState(e) {
	lmbDown = e.buttons === undefined 
		? e.which === 1 
		: e.buttons === 1;
	
	rmbDown = e.buttons === undefined 
			? e.which === 3
			: e.buttons === 2;
	
	// If both buttons are released, checkboxes are no longer being selected
	if (!lmbDown && !rmbDown) selectingCheckboxes = false;
}


// Disable text selection while selecting checkboxes
function disableSelect(event) {
	if (selectingCheckboxes) {
		event.preventDefault();
	}
}

// Allows user to click and drag to select/deselect checkboxes using
// left and right mouse buttons
function injectDraggingCheckboxSelection() {
	// Setup mouse click events
	document.body.onmousedown = setLeftButtonState;
	document.body.onmousemove = setLeftButtonState;
	document.body.onmouseup = setLeftButtonState;
	
	window.addEventListener('selectstart', disableSelect);

	// Block right-click menu if deselecting checkboxes
	document.oncontextmenu = function(e){
		if (checkboxChanged) {
			checkboxChanged = false;
			event.preventDefault();
			return false;
		}
	}
}

// Corrects the warning that only IE is compatible
function correctLoginIEWarning() {
	if (!window.location.href.includes("/Login.aspx")) return;

	var warningElem = document.querySelector("#tabHolder > tbody > tr:nth-child(3) > td");
	warningElem.classList.add("polyfilerCorrectWarning");
}

chrome.storage.sync.get({
	shortcutKeys: true,
	selectMode: true,
	selectHours: "7.5",
	showBankHolidays: true,
	holidayRegion: 'england-and-wales',
	autoLogin: false,
	stopAutoLogin: false,
	employeeNumber: "",
	specialToken: "",
	autoFillFields: true,
	autoFillTaskNumber: "1",
	autoFillProjectCode: "",
	lastVersionUsed: null,
}, function(items) {
	
	
	// Set to true to simulate update from < 2.8.5
	if (false) {
		chrome.storage.sync.set({
			employeeNumber: "290937",
			autoLogin: true,
			stopAutoLogin: null,
			lastVersionUsed: null,
		});
		return
	}

	// Check if user has version that stores employeeNumber differently
	if (!items.lastVersionUsed || versionCompare(items.lastVersionUsed, "2.8.5") == -1) {
		alert("Polyfiller 2.0 updated!\nPlease review it on Chrome if you like it!");
		
		// If employeeNumber is set, repair it
		if (items.employeeNumber) {
			
			assignSpecialToken(function(newToken) {
				chrome.storage.sync.set({
					employeeNumber: savePrepEmployeeNumber(newToken, items.employeeNumber),
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
	
	// Update stored version number if changed
	/* ALL UPDATE FIXES BE APPLIED ABOVE THIS POINT */
	if (items.lastVersionUsed != getExtensionVersion()) {
		// Update cached variable immediatly
		items.lastVersionUsed = getExtensionVersion();
		
		updateExtensionVersion();
	}
	
	
	
	correctLoginIEWarning();
	
    if (items.autoLogin) {
		// Add handler to block auto-login if user explicitly clicks logout
		var logoutButton = document.querySelector("a[title='Logout']");
		if (logoutButton) {
			logoutButton.addEventListener("click", function() {
				chrome.storage.sync.set({ stopAutoLogin: true });
			});
		}
		
		if (!items.stopAutoLogin && items.specialToken && items.employeeNumber) {
			
			// Run auto-login ONLY if not previously ran
			// This prevents incorrect details causing endless login attempt spam
			if (!items.autoLoggingIn) {
				chrome.storage.sync.set({ stopAutoLogin: true }, function() {
					autoLogin(loadPrepEmployeeNumber(items.specialToken, items.employeeNumber));
				});
			}
		}
	}
	
	fixMissingButtons();
	fixInputEventHandlers();
	
	// Only inject if the page has a menubar of buttons
	if (pageContainsMenuBar()) {
		injectStandardUKTimeButton();
	}
	
	// Check if the user is logged in
	var loggedIn = pageContainsMenuBar(); // menubar is only found on logged-in pages
	if (loggedIn) {
		
		// Clear stopAutoLogin field if set
		if (items.stopAutoLogin) {
			chrome.storage.sync.set({ stopAutoLogin: false });
		}
	}



	if (items.shortcutKeys) injectShortcutKeys();


	// Check calender is on page before injecting calender features
	if (!!document.getElementById("calDates_tabCalendar")) {
		if (pageContainsMenuBar()) {
			injectCustomButtonsContainer();
			injectAutoFillButton(items.selectHours);
		}
		
		if (items.autoFillFields) {
			autoFillTaskNumber(items.autoFillTaskNumber);
			autoFillProjectCode(items.autoFillProjectCode);
		}
		
		// Inject bank holiday features
		fetchBankHolidaysJSON(function(holidaysJSON) {
			// Get bank holidays table based off user's settings
			let myBankHolidays = holidaysJSON[items.holidayRegion];
			try {
				if (!items.holidayRegion) throw "Your bank holiday region is unset!";
				if (!myBankHolidays) throw "Bank holidays JSON from gov.uk didn't contain your region!";
				myBankHolidays = holidaysJSON[items.holidayRegion].events;
			} catch(e) {
				console.warn("ERROR SHOWING BANK HOLIDAYS:\n" + e);
				return;
			}
			
			if (items.showBankHolidays) handleShowBankHolidays(myBankHolidays);
			
			if (pageContainsMenuBar()) {
				loadSelectMode(items.selectMode, items.selectHours); // Inject checkbox mode
				injectDraggingCheckboxSelection();
			}			
		});
	}
	
	polyfilerLog("Loaded!");
});