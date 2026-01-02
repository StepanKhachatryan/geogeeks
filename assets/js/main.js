/**
 * Բաղադրիչների (Header) բեռնման ֆունկցիա
 */
function loadComponent(id, file) {
    const isSubFolder = window.location.pathname.includes('/projects/');
    const adjustedFile = isSubFolder ? '../' + file : file;

    fetch(adjustedFile)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load component");
            return response.text();
        })
        .then(data => {
            const element = document.getElementById(id);
            if (!element) return; // Եթե տարրը գոյություն չունի էջում

            element.innerHTML = data;

            if (id === "header-placeholder") {
                highlightActiveMenu(element, isSubFolder);
                if (isSubFolder) {
                    adjustLinksForSubfolder(element);
                }
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Ակտիվ մենյուի կոճակի լուսավորում
 */
function highlightActiveMenu(headerElement, isSubFolder) {
    let path = window.location.pathname;
    let currentPath = path.split("/").pop();
    
    if (currentPath === "" || currentPath === "/") {
        currentPath = "index.html";
    }

    if (currentPath === "index.html") return;

    const links = headerElement.querySelectorAll(".menu a");

    links.forEach(link => {
        const linkHref = link.getAttribute("href");
        const isProjectPage = path.includes('projects.html') || isSubFolder;

        if (isProjectPage && linkHref.includes('projects.html')) {
            link.classList.add("active");
            link.classList.add("active-projects");
        } 
        else if (linkHref === currentPath) {
            link.classList.add("active");
            const pageName = currentPath.split(".")[0];
            link.classList.add("active-" + pageName);
        }
    });
}

/**
 * Ենթաթղթապանակների (projects) համար հղումների ուղղում
 */
function adjustLinksForSubfolder(headerElement) {
    const allLinks = headerElement.querySelectorAll('a');
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('../')) {
            link.setAttribute('href', '../' + href);
        }
    });

    const allImages = headerElement.querySelectorAll('img');
    allImages.forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('../')) {
            img.setAttribute('src', '../' + src);
        }
    });
}

// Բեռնում ենք միայն Header-ը
loadComponent("header-placeholder", "components/header.html");

// Footer-ի բեռնումը հեռացված է, քանի որ այն այլևս չի օգտագործվում
// loadComponent("footer-placeholder", "components/footer.html");
