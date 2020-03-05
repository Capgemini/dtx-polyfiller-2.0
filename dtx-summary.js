
// Corrects summary table column widths on Chrome
function fixColumnWidths() {

	// Assemble array of correct widths for each column
	// These are declared in the page but ignored by modern browsers
    let tableColumnWidths = [];
    const tableWidthElems = document.querySelectorAll("#G_uwgItems colgroup col");
    tableWidthElems.forEach(elem => {
        tableColumnWidths.push(elem.width);
    });

    // Remove bugged colgroups width setter
    // document.querySelector("#G_uwgItems colgroup").remove();

    // Correct header cell widths
    let tableHeaderCells = document.querySelectorAll("#uwgItems_hdiv table thead tr th");
    let headerCellIndex = 0;
    tableHeaderCells.forEach(th => {
        if (th.style.display == "none") return;
        th.style.minWidth = tableColumnWidths[headerCellIndex];
        th.style.maxWidth = tableColumnWidths[headerCellIndex];
        th.removeAttribute("width");
        headerCellIndex++;
    })

    // Correct body cell widths for each row
    let tableRows = Array.from(document.querySelectorAll(".dtxMainData tr"));
    tableRows.forEach(row => {
        let cells = row.querySelectorAll("td")

        let cellIndex = 0;
        cells.forEach(cell => {
            if (cell.style.display == "none") return;

            if (cell.classList.contains("aiHdr")) {
                cell.style.display = "none";
                return;
            }

            cell.style.minWidth = tableColumnWidths[cellIndex];
            cell.style.maxWidth = tableColumnWidths[cellIndex];
            cell.removeAttribute("width");
            cellIndex++;
        });

        // Hide unknown cells (possibly for developers, invisible in IE)
        for (let i=1; i < 4; i++) {
            cells[cells.length - i].style.display = "none";
        }
    });
}


// Starts extension
function LoadPolyfiller(items) {
    if (items.fixSummaryTable) fixColumnWidths();
    polyfilerLog("Loaded summary tweaks!");
}


// Load settings from storage (with defaults) and run starter func
LoadExtensionSettings((items) => LoadPolyfiller(items));