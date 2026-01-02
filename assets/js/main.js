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

            if (id === "header-placeholder") {
                console.log("Header loaded successfully");
                // Եթե ունեք մենյուի highlight ֆունկցիա, կանչեք այստեղ
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * Ծառայությունների տաբերի փոխման ֆունկցիա
 * Այս ֆունկցիան պետք է կանչվի HTML-ում onclick="showService('id', this)" միջոցով
 */
function showService(serviceId, element) {
    // 1. Գտնել բոլոր կոճակները և հեռացնել active դասը
    const allButtons = document.querySelectorAll('.side-nav-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));

    // 2. Գտնել բոլոր բովանդակային բլոկները և թաքցնել դրանք
    // Այստեղ օգտագործում ենք ավելի լայն սելեկտոր, որպեսզի բոլորը թաքնվեն
    const allContents = document.querySelectorAll('.service-content, [id$="-content"]');
    allContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; // Ապահովության համար
    });

    // 3. Ակտիվացնել սեղմված կոճակը
    element.classList.add('active');

    // 4. Ցույց տալ համապատասխան բովանդակությունը
    const activeContent = document.getElementById(serviceId);
    if (activeContent) {
        activeContent.classList.add('active');
        
        // Մոբայլում օգտագործում ենք flex կամ block՝ կախված դիզայնից
        const displayType = window.innerWidth <= 1024 ? 'flex' : 'block';
        activeContent.style.display = displayType;
    }
}

// Գործարկում
document.addEventListener("DOMContentLoaded", () => {
    loadComponent("header-placeholder", "components/header.html");
});
