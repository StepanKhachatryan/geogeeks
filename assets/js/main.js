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
            if (!element) return;

            element.innerHTML = data;

            if (id === "header-placeholder") {
                highlightActiveMenu(element, isSubFolder);
                if (isSubFolder) {
                    adjustLinksForSubfolder(element);
                }
                
                // ԿԱՐԵՎՈՐ: Վերագործարկել թարգմանության սկրիպտը Header-ը բեռնելուց հետո
                initTranslationAfterLoad();
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Թարգմանության համակարգի ակտիվացում դինամիկ բեռնումից հետո
 */
function initTranslationAfterLoad() {
    // Եթե սկրիպտը արդեն կա էջում, ուղղակի կանչում ենք init-ը
    if (typeof googleTranslateElementInit === 'function') {
        googleTranslateElementInit();
    }
    
    // Ստուգում ենք cookie-ն, որպեսզի ակտիվ լեզվի կոճակը ճիշտ լուսավորվի
    const isEnglish = document.cookie.includes('googtrans=/hy/en');
    const langBtns = document.querySelectorAll('.lang-btn');
    
    langBtns.forEach(btn => {
        const lang = btn.getAttribute('data-lang');
        if (isEnglish && lang === 'en') btn.classList.add('active');
        else if (!isEnglish && lang === 'hy') btn.classList.add('active');
        else btn.classList.remove('active');
    });
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

    const links = headerElement.querySelectorAll(".menu a");

    links.forEach(link => {
        const linkHref = link.getAttribute("href");
        const isProjectPage = path.includes('projects.html') || isSubFolder;

        if (isProjectPage && linkHref.includes('projects.html')) {
            link.classList.add("active");
            link.classList.add("active-projects");
        } 
        else if (linkHref === currentPath || (currentPath === "index.html" && linkHref === "index.html")) {
            link.classList.add("active");
            const pageName = currentPath.split(".")[0];
            link.classList.add("active-" + (pageName === "index" ? "home" : pageName));
        }
    });
}

/**
 * Ենթաթղթապանակների համար հղումների ուղղում
 */
function adjustLinksForSubfolder(headerElement) {
    const allLinks = headerElement.querySelectorAll('a');
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('../') && !href.startsWith('javascript')) {
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

// Բեռնում ենք Header-ը
loadComponent("header-placeholder", "components/header.html");
