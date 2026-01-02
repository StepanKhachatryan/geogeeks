/**
 * GOOGLE TRANSLATE AI LOGIC
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
    // 1. Վիզուալ ակտիվացում
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    // 2. Հայերենի վերականգնում
    if (lang === 'hy') {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + document.domain;
        location.reload();
        return;
    }

    // 3. Թարգմանության գործարկում
    const checkExist = setInterval(function() {
       const selectField = document.querySelector(".goog-te-combo");
       if (selectField) {
          selectField.value = lang;
          selectField.dispatchEvent(new Event('change'));
          clearInterval(checkExist);
       }
    }, 100);
}

/**
 * Լեզվի կոճակների վիճակի ստուգում էջը բեռնելիս կամ Header-ը փոխելիս
 */
function syncLanguageButtons() {
    const isEnglish = document.cookie.includes('googtrans=/hy/en');
    const btns = document.querySelectorAll('.lang-btn');
    
    btns.forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if ((isEnglish && btnLang === 'en') || (!isEnglish && btnLang === 'hy')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Լրացրեք ձեր գոյություն ունեցող loadComponent ֆունկցիան.
// fetch-ի հաջող ավարտից հետո (element.innerHTML = data) կանչեք syncLanguageButtons();
