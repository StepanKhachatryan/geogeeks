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
            
            // Գործարկել մաքրումը առանց էջը ծանրաբեռնելու
            startSafeClean();
        }
    }, 200);
};

/**
 * Անվտանգ մաքրում՝ առանց անվերջ ցիկլերի
 */
function startSafeClean() {
    const fixStyles = () => {
        // Ուղղում ենք body-ն միայն եթե այն զրոյից տարբեր է
        if (document.body.style.top !== '0px' && document.body.style.top !== '') {
            document.body.style.setProperty('top', '0px', 'important');
        }
        if (document.documentElement.style.marginTop !== '0px' && document.documentElement.style.marginTop !== '') {
            document.documentElement.style.setProperty('margin-top', '0px', 'important');
        }
        
        // Թաքցնել բաները
        const banner = document.querySelector('.goog-te-banner-frame');
        if (banner && banner.style.display !== 'none') {
            banner.style.setProperty('display', 'none', 'important');
        }
    };

    // Կիրառել անմիջապես
    fixStyles();

    // Օգտագործում ենք պարբերական ստուգում MutationObserver-ի փոխարեն՝ freeze-ից խուսափելու համար
    const cleanInterval = setInterval(fixStyles, 500);
    
    // Դադարեցնել ստուգումը 10 վայրկյան անց (երբ թարգմանությունն ավարտված կլինի)
    setTimeout(() => clearInterval(cleanInterval), 10000);
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
                
                if (document.cookie.includes('googtrans=/hy/en')) {
                    startSafeClean();
                }
            }
        });
}

loadComponent("header-placeholder", "components/header.html");
