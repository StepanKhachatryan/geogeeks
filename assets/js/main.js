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

    const checkReady = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            clearInterval(checkReady);
            syncLanguageButtons();
            
            // Թարգմանությունը սկսվելուց հետո մաքրել Google-ի Banner-ը
            cleanGoogleUI();
        }
    }, 200);
};

/**
 * Հեռացնում է Google-ի վերևի տողը և ուղղում Header-ի դիրքը
 */
function cleanGoogleUI() {
    const checkGoogleUI = setInterval(() => {
        const googleFrame = document.querySelector('.goog-te-banner-frame');
        const googleBalloon = document.querySelector('.goog-te-balloon-frame');
        
        // Հեռացնել iframe-ները
        if (googleFrame) googleFrame.style.display = 'none';
        if (googleBalloon) googleBalloon.style.display = 'none';

        // Ուղղել body-ի դիրքը, որպեսզի Header-ը չփակվի
        document.body.style.top = '0px';
        document.documentElement.style.top = '0px';

        // Եթե Google-ը դեռ փորձում է փոխել դիրքը, շարունակել ստուգումը
        if (!googleFrame && !googleBalloon) {
            clearInterval(checkGoogleUI);
        }
    }, 500);
}

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
                const oldScript = document.getElementById('google-translate-script');
                if (oldScript) oldScript.remove();

                const script = document.createElement('script');
                script.id = 'google-translate-script';
                script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
                document.body.appendChild(script);
                
                syncLanguageButtons();
                
                // Եթե էջն արդեն թարգմանված է բեռնվում, մաքրել UI-ն
                if (document.cookie.includes('googtrans=/hy/en')) {
                    cleanGoogleUI();
                }
            }
        });
}

// Գործարկում
loadComponent("header-placeholder", "components/header.html");
