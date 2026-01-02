/**
 * Բաղադրիչների բեռնում
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
                // Ակտիվացնել լեզվի կոճակների գույնը բեռնվելուց հետո
                syncLanguageButtons();
            }
        })
        .catch(error => console.error("Error loading component:", error));
}

/**
 * GOOGLE TRANSLATE AI LOGIC (Global Scope)
 */
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'hy',
        includedLanguages: 'en',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

function translatePage(lang, element) {
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
}

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

// Մենյուի լուսավորման և հղումների ուղղման ֆունկցիաները մնում են նույնը...
// (highlightActiveMenu և adjustLinksForSubfolder)

// Բեռնել Header-ը
loadComponent("header-placeholder", "components/header.html");

// Ավելացնել Google Translate սկրիպտը դինամիկ կերպով
const gtScript = document.createElement('script');
gtScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
document.body.appendChild(gtScript);
