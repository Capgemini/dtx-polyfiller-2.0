injectScript(`
    togglePatternFillMenu = () => {
        document.querySelector(".patternfill-container").classList.toggle("open");
   }
`);
polyfilerLog("Pattern fill injected!");