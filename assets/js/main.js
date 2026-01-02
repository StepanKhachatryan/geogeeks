// 1. Գլոբալ ֆունկցիաներ թարգմանության համար (պետք է լինեն window օբյեկտի վրա)
window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
        pageLanguage: 'hy',
        includedLanguages: 'en',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
};

window.translatePage = function(lang, element) {
    if (lang === 'hy') {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + document.domain;
        location.reload();
        return;
    }

    const checkExist = setInterval(function() {
        const selectField = document.querySelector(".goog-te-combo");
        if (selectField) {
            selectField.value = lang;
            selectField.dispatchEvent(new Event('change'));
            clearInterval(checkExist);
            syncLanguageButtons();
        }
    }, 100);
};

function syncLanguageButtons() {
    const isEnglish = document.cookie.includes('googtrans=/hy/en');
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if ((isEnglish && btnLang === 'en') || (!isEnglish && btnLang === 'hy')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 2. Header-ի բեռնման ֆունկցիա
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
                if (isSubFolder) adjustLinksForSubfolder(element);
                syncLanguageButtons(); // Սինխրոնացնել կոճակները բեռնումից հետո
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

// Մենյուի լուսավորման մնացած ֆունկցիաները (highlightActiveMenu, adjustLinksForSubfolder) պահեք այստեղ...

// 3. Գործարկում
loadComponent("header-placeholder", "components/header.html");

// 4. Ավելացնել Google Translate սկրիպտը
const script = document.createElement('script');
script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
document.body.appendChild(script);
