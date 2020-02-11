/*
	dtx.js
     This file handles features added across the entire site.
     For example: Browser fixes, highlighting bank holidays in calendar views, handling logouts etc.
*/


// Forcefully shows invisible buttons
// This fixes some browser compatibility issues 
function fixMissingButtons() {
	document.querySelectorAll('input[type="button"]')
	.forEach(button => {
		button.style.visibility = "visible";
	});
}


// Corrects input elements to use supported modern onchange handlers
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


// Adds hotkeys:
//  CTRL+S to save changes
//  Escape to go home
function injectShortcutKeys() {
	injectScript(`
		document.addEventListener('callSaveFuncs', () => {
			if (typeof saveFromIcon === "function") saveFromIcon(); else if (typeof myPage.Save === "function") myPage.Save(); // Call DTX save button click function
		});
	`);
	
	document.addEventListener('keydown', (event) => {
		const keySPressed = (event.keyCode === 83 || event.keyCode === 115); // Check if code is for 's' or 'S'
		if (event.ctrlKey && keySPressed) {
			event.preventDefault(); // Prevent browser's save dialog showing
			
			let evt = new Event("callSaveFuncs", {"bubbles":true, "cancelable":false});
			document.dispatchEvent(evt); // Fire the event
			
		} else if (event.key === "Escape") {
			event.preventDefault(); // Prevent escape key stopping document reloading
			const homeURL = window.location.origin + "/DTX.NET/Summary.aspx";
			if (window.location.href !== homeURL) window.location.href = "Summary.aspx"; // Don't run when already home
		}
	});
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
    forEachBankHolidayCell(myBankHolidays, (cell) => {
        cell.classList.add("bankHolidayDay");
        cell.placeholder = "Bank H";

        // Remove 0 so placeholder text can show
        // Useful in calenders such as "Period Overview"
        if (cell.value === "0") cell.value = "";
    });
}



// Returns true if the page contains the menubar of buttons
// (buttons including adding time, delete, copy, paste etc)
function pageContainsMenuBar() {
	return !!document.getElementById("jsddm_summary") || !!document.getElementById("jsddm_item");
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



// Add handler to save flag to prevent future auto-logins if user explicitly clicks logout
function injectLogoutHandler() {
	let logoutButton = document.querySelector("a[title='Logout']");
	if (logoutButton) {
		logoutButton.addEventListener("click", (event) => {
			chrome.storage.sync.set({ stopAutoLogin: true }, () => {
				const logoutURL = event.target.getAttribute('href');
				location.href = logoutURL; // Redirect to logout URL
			});

			// Prevent default logout redirect to ensure chrome storage is full updated
			event.preventDefault();
			return false;
		});
	}
}


// Starts extension
function LoadPolyfiller(items) {

	// Handle any requirements to apply updates
	items = processExtensionUpdates(items);
	
	fixMissingButtons();
	fixInputEventHandlers();
	
	// Only inject if the page has a menubar of buttons
	if (pageContainsMenuBar()) {
		injectStandardUKTimeButton();
	}
	
	// Check if the user is logged in
	const loggedIn = pageContainsMenuBar(); // menubar is only found on logged-in pages
	if (loggedIn) {
		injectLogoutHandler();
		
		// Clear stopAutoLogin field if set
		if (items.stopAutoLogin) {
			chrome.storage.sync.set({ stopAutoLogin: false });
		}
	}


	if (items.shortcutKeys) injectShortcutKeys();


	// Check calender is on page before injecting calender features
	if (!!document.getElementById("calDates_tabCalendar")) {

		// Inject bank holiday features
		getBankHolidaysJSON(items, (holidayRegions, holidayEvents) => {
			if (items.showBankHolidays) handleShowBankHolidays(holidayEvents);
		});
	}
	
	polyfilerLog("Loaded!");
}


// Load settings from storage (with defaults) and run starter func
LoadExtensionSettings((items) => LoadPolyfiller(items));