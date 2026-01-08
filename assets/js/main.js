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

            if (id === "header-placeholder") {
                // Եթե սա ենթապանակ է, շտկում ենք լոգոյի և հղումների ուղիները
                if (isSubFolder) {
                    fixHeaderPaths(el);
                }
                highlightActiveMenu();
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Շտկում է Header-ի ուղիները, երբ օգտատերը ենթապանակում է
 */
function fixHeaderPaths(headerElement) {
    // Շտկում ենք լոգոյի հղումը (index.html)
    const logoAnchor = headerElement.querySelector('.logo');
    if (logoAnchor) {
        logoAnchor.setAttribute('href', '../index.html');
    }

    // Շտկում ենք լոգոյի նկարի ուղին (img src)
    const logoImg = headerElement.querySelector('.logo img');
    if (logoImg) {
        const currentSrc = logoImg.getAttribute('src');
        if (!currentSrc.startsWith('../')) {
            logoImg.setAttribute('src', '../' + currentSrc);
        }
    }

    // Շտկում ենք մենյուի մնացած հղումները
    const navLinks = headerElement.querySelectorAll('.menu li a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('../')) {
            link.setAttribute('href', '../' + href);
        }
    });
}

/**
 * Ակտիվ մենյուի ընդգծում
 */
function highlightActiveMenu() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.menu li a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        link.classList.remove('active-about', 'active-services', 'active-projects', 'active-contact');

        if (path === "/" || path === "" || path.endsWith("index.html")) {
            return; 
        }

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
 * Services Tabs Logic
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

document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-placeholder", "components/header.html");
    loadComponent("footer-placeholder", "components/footer.html");
});

here is my main.js code. do changes if needed. only touch code part related to this issue. and provide updated code
