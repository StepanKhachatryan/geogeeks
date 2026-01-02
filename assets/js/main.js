/**
 * Բաղադրիչների բեռնման ֆունկցիա (Header, Footer)
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

            // Եթե Header-ն է բեռնվել, ակտիվացնում ենք մենյուի գույները
            if (id === "header-placeholder") {
                highlightActiveMenu();
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Ակտիվ մենյուի ընդգծում ըստ էջերի
 * Գլխավոր էջում (root) ոչ մի մենյու չի ընդգծվում
 */
function highlightActiveMenu() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.menu li a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Նախ հեռացնում ենք բոլոր հնարավոր active դասերը
        link.classList.remove('active-about', 'active-services', 'active-projects', 'active-contact');

        // Եթե մենք գլխավոր էջում ենք (root / կամ index.html), ապա ոչ մի կոճակ չի ներկվում
        if (path === "/" || path === "" || path.endsWith("index.html")) {
            return; 
        }

        // Յուրաքանչյուր էջի համար ստուգում ենք համընկնումը
        if (path.includes("about.html") && href.includes("about.html")) {
            link.classList.add('active-about');
        } 
        else if (path.includes("services.html") && href.includes("services.html")) {
            link.classList.add('active-services');
        } 
        else if ((path.includes("projects.html") || path.includes("/projects/")) && href.includes("projects.html")) {
            link.classList.add('active-projects');
        } 
        else if (path.includes("contact.html") && href.includes("contact.html")) {
            link.classList.add('active-contact');
        }
    });
}

/**
 * Ծառայությունների էջ - Գլխավոր տաբերի փոխարկում (GIS, Hydro, Education)
 */
function switchMainTab(sectionId) {
    // Հեռացնել active դասը բոլոր գլխավոր կոճակներից
    document.querySelectorAll('.main-service-btn').forEach(btn => btn.classList.remove('active'));
    
    // Ավելացնել active սեղմվածին
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // Թաքցնել բոլոր սեկցիաները և ցույց տալ միայն ակտիվը
    document.querySelectorAll('.service-body-container').forEach(sec => {
        sec.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

/**
 * Ծառայությունների էջ - Ենթատաբերի փոխարկում (Side Nav)
 */
function switchSubTab(btnElement, contentId) {
    const parentSection = btnElement.closest('.service-body-container');
    if (!parentSection) return;

    // Ակտիվացնել կողային կոճակը
    parentSection.querySelectorAll('.side-nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // Ցույց տալ համապատասխան բովանդակությունը
    parentSection.querySelectorAll('.content-display').forEach(content => {
        content.classList.remove('active');
    });

    const targetContent = document.getElementById(contentId);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

/**
 * Ֆայլի գործարկում DOM-ը բեռնելուց հետո
 */
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-placeholder", "components/header.html");
    loadComponent("footer-placeholder", "components/footer.html");
});
