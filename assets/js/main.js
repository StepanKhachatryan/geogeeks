function loadComponent(id, file) {
    // 1. Ստուգում ենք, թե արդյոք ընթացիկ էջը գտնվում է projects/ ենթաթղթապանակում
    const isSubFolder = window.location.pathname.includes('/projects/');
    
    // Եթե ենթաթղթապանակում ենք, ֆայլի ուղին պետք է սկսվի ../-ով
    const adjustedFile = isSubFolder ? '../' + file : file;

    fetch(adjustedFile)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load component");
            return response.text();
        })
        .then(data => {
            const element = document.getElementById(id);
            element.innerHTML = data;

            if (id === "header-placeholder") {
                highlightActiveMenu(element, isSubFolder);
                
                // Եթե ենթաթղթապանակում ենք, ուղղում ենք հղումները (Logo և այլն)
                if (isSubFolder) {
                    adjustLinksForSubfolder(element);
                }
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

function highlightActiveMenu(headerElement, isSubFolder) {
    let path = window.location.pathname;
    let currentPath = path.split("/").pop();
    
    if (currentPath === "" || currentPath === "/") {
        currentPath = "index.html";
    }

    // Եթե գլխավոր էջում ենք, active չենք դնում
    if (currentPath === "index.html") return;

    const links = headerElement.querySelectorAll(".menu a");

    links.forEach(link => {
        const linkHref = link.getAttribute("href");

        // Տրամաբանություն Նախագծեր բաժնի համար (GIS, Water և այլ ենթաէջերի դեպքում)
        const isProjectPage = path.includes('projects.html') || isSubFolder;

        if (isProjectPage && linkHref.includes('projects.html')) {
            link.classList.add("active");
            link.classList.add("active-projects");
        } 
        // Մյուս բոլոր սովորական էջերի համար
        else if (linkHref === currentPath) {
            link.classList.add("active");
            const pageName = currentPath.split(".")[0];
            link.classList.add("active-" + pageName);
        }
    });
}

// Ֆունկցիա, որը ուղղում է հեդերի հղումները ենթաթղթապանակում գտնվելիս
function adjustLinksForSubfolder(headerElement) {
    const allLinks = headerElement.querySelectorAll('a');
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Եթե հղումը արտաքին չէ և չի սկսվում http-ով, ավելացնում ենք ../
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('../')) {
            link.setAttribute('href', '../' + href);
        }
    });
}

// Բաղադրիչների բեռնում
loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");
