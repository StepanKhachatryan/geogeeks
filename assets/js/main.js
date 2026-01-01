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

// --- ԱՎԵԼԱՑՎԱԾ Է․ Intersection Observer անիմացիաների համար ---
/**
 * Այս ֆունկցիան հետևում է էջի բաժիններին և ավելացնում է 'active-fade' դասը,
 * երբ բաժինը հայտնվում է օգտատիրոջ տեսադաշտում։
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.2 // Անիմացիան կսկսվի, երբ բաժնի 20%-ը երևա
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active-fade');
                // Եթե ցանկանում եք, որ անիմացիան միայն մեկ անգամ լինի, 
                // կարող եք դադարեցնել հետևելը․
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Հետևում ենք բոլոր .about-section բաժիններին
    const animatedElements = document.querySelectorAll('.about-section');
    animatedElements.forEach(el => observer.observe(el));
}

// Բաղադրիչների բեռնում
loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");

// Ակտիվացնում ենք անիմացիաները էջի բեռնումից հետո
document.addEventListener("DOMContentLoaded", () => {
    initScrollAnimations();
});
