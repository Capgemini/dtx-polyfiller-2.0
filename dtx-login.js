/*
    dtx-login.js
     This file handles extra features added to the DTX login page
*/


// Auto-fills and logins in if form is avaliable on current page
function autoLogin(employeeNumber) {
    let form = document.getElementById("frmLogin");
    if (form) {
        document.body.style.visibility = "hidden"; // Hide login page
        form.elements.namedItem("txtEmployeeNumber").value = employeeNumber;
		
        form.submit();
    }
}



// Runs auto-login ONLY if not previously ran
//  This prevents incorrect details causing endless login attempt spam
function LoginPageScripts(items) {
    // Abort auto-login if disabled or login details aren't configured
    if (!items.autoLogin || !items.specialToken || !items.employeeNumber) return;
    
    // Abort auto-login if the user explicitly logged themselves out OR if
    // auto-login was already ran (and therefore failed)
    // This flag is automatically reset after a successful login.
    // It prevents incorrect details causing endless auto-login attempts (page
    // reload spam)
    if (items.stopAutoLogin) return;

    // Record that a login attempt will be ran
    chrome.storage.sync.set({ stopAutoLogin: true }, () => {
        autoLogin(loadPrepEmployeeNumber(items.specialToken, items.employeeNumber));
    });
}

// Load settings from storage and run login scripts
LoadExtensionSettings((items) => LoginPageScripts(items));
