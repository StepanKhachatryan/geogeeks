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
 * Ակտիվ մենյուի ընդգծում (Background Color)
 */
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll('.menu li a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split("/").pop();
        
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Ծառայությունների տաբերի փոխարկում
 */
function switchMainTab(sectionId) {
    document.querySelectorAll('.main-service-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    document.querySelectorAll('.service-body-container').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
}

function switchSubTab(btnElement, contentId) {
    const parentSection = btnElement.closest('.service-body-container');
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
