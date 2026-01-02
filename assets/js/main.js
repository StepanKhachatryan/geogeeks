// 1. Գլոբալ ֆունկցիաներ
window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
        pageLanguage: 'hy',
        includedLanguages: 'en',
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

    // Սպասել մինչև Google-ի combo-ն հայտնվի
    const checkReady = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            clearInterval(checkReady);
            syncLanguageButtons();
        }
    }, 200);
};

function syncLanguageButtons() {
    const isEn = document.cookie.includes('googtrans=/hy/en');
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const lang = btn.getAttribute('data-lang');
        btn.classList.toggle('active', (isEn && lang === 'en') || (!isEn && lang === 'hy'));
    });
}

// 2. Բաղադրիչների բեռնում
function loadComponent(id, file) {
    const isSubFolder = window.location.pathname.includes('/projects/');
    const adjustedFile = isSubFolder ? '../' + file : file;

    fetch(adjustedFile)
        .then(res => res.text())
        .then(data => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = data;

            if (id === "header-placeholder") {
                // Կարևոր. Վերաբեռնել Google Script-ը միայն Header-ը հայտնվելուց հետո
                const oldScript = document.getElementById('google-translate-script');
                if (oldScript) oldScript.remove();

                const script = document.createElement('script');
                script.id = 'google-translate-script';
                script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                document.body.appendChild(script);
                
                syncLanguageButtons();
            }
        });
}

// Գործարկում
loadComponent("header-placeholder", "components/header.html");
