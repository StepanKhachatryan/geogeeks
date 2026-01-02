/**
 * Բաղադրիչների բեռնման ֆունկցիա (Header)
 */
function loadComponent(id, file) {
    const isSubFolder = window.location.pathname.includes('/projects/');
    const adjustedFile = isSubFolder ? '../' + file : file;

    fetch(adjustedFile)
        .then(res => {
            if (!res.ok) throw new Error("Failed to load component");
            return res.text();
        })
        .then(data => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = data;

            if (id === "header-placeholder") {
                // Այստեղ կարող եք ավելացնել մենյուի highlight ֆունկցիան, եթե այն ունեք
                // highlightActiveMenu(el, isSubFolder);
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

// Գործարկում - Բեռնում ենք միայն Header-ը
loadComponent("header-placeholder", "components/header.html");
