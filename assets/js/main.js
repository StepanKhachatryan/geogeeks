/**
 * Բաղադրիչների բեռնման ֆունկցիա
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

            // Header-ը բեռնելուց հետո ակտիվացնում ենք մենյուի գույնը
            if (id === "header-placeholder") {
                highlightActiveMenu();
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Ակտիվ մենյուի ընդգծում (about.html տարբերակի համար)
 */
function highlightActiveMenu() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.menu li a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Հեռացնում ենք բոլոր հնարավոր active դասերը
        link.classList.remove('active-about', 'active-services', 'active-projects', 'active-contact');

        // 1. Մեր մասին (about.html)
        if (path.includes("about.html") || path.endsWith("/") || path.endsWith("index.html")) {
            if (href.includes("about.html")) {
                link.classList.add('active-about');
            }
        } 
        // 2. Ծառայություններ
        else if (path.includes("services.html")) {
            if (href.includes("services.html")) link.classList.add('active-services');
        } 
        // 3. Նախագծեր
        else if (path.includes("projects.html") || path.includes("/projects/")) {
            if (href.includes("projects.html")) link.classList.add('active-projects');
        } 
        // 4. Կապ
        else if (path.includes("contact.html")) {
            if (href.includes("contact.html")) link.classList.add('active-contact');
        }
    });
}

/**
 * Ծառայությունների տաբերի փոխարկում (Services Page)
 */
function switchMainTab(sectionId) {
    document.querySelectorAll('.main-service-btn').forEach(btn => btn.classList.remove('active'));
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }
    document.querySelectorAll('.service-body-container').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
}

function switchSubTab(btnElement, contentId) {
    const parentSection = btnElement.closest('.service-body-container');
    if (!parentSection) return;
    parentSection.querySelectorAll('.side-nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    parentSection.querySelectorAll('.content-display').forEach(content => content.classList.remove('active'));
    const targetContent = document.getElementById(contentId);
    if (targetContent) targetContent.classList.add('active');
}

// Գործարկում
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-placeholder", "components/header.html");
});
