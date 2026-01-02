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
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Գլխավոր տաբերի փոխարկում (GIS, Hydro, Education)
 */
function switchMainTab(sectionId) {
    // Հեռացնել active բոլոր գլխավոր կոճակներից
    document.querySelectorAll('.main-service-btn').forEach(btn => btn.classList.remove('active'));
    
    // Ավելացնել active սեղմվածին
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // Հեռացնել active բոլոր սեկցիաներից
    document.querySelectorAll('.service-body-container').forEach(sec => {
        sec.classList.remove('active');
    });

    // Ակտիվացնել ընտրված սեկցիան
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

/**
 * Ենթատաբերի փոխարկում (Side Nav)
 */
function switchSubTab(btnElement, contentId) {
    const parentSection = btnElement.closest('.service-body-container');
    
    // Հեռացնել active տվյալ սեկցիայի բոլոր կողային կոճակներից
    parentSection.querySelectorAll('.side-nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // Հեռացնել active տվյալ սեկցիայի բոլոր content-ներից
    parentSection.querySelectorAll('.content-display').forEach(content => {
        content.classList.remove('active');
    });

    // Ակտիվացնել ընտրված բովանդակությունը
    const targetContent = document.getElementById(contentId);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// Գործարկում
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-placeholder", "components/header.html");
});
