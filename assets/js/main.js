/**
 * Services Tabs Logic
 */
function switchMainTab(sectionId) {
    // 1. Հեռացնում ենք active կլասը բոլոր գլխավոր կոճակներից
    document.querySelectorAll('.main-service-btn').forEach(btn => btn.classList.remove('active'));
    
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    }

    // 2. Թաքցնում ենք բոլոր հիմնական բաժինները
    document.querySelectorAll('.service-body-container').forEach(sec => {
        sec.classList.remove('active');
        
        // ԼՐԱՑՈՒՄ: Թաքցնում ենք նաև բոլոր ենթաբաժինները այս բաժնի ներսում, 
        // որպեսզի հաջորդ անգամ բացելիս ամեն ինչ խառը չլինի
        sec.querySelectorAll('.content-display').forEach(content => content.classList.remove('active'));
        sec.querySelectorAll('.side-nav-btn').forEach(btn => btn.classList.remove('active'));
    });

    // 3. Ակտիվացնում ենք ընտրված բաժինը
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // ԼՐԱՑՈՒՄ: Ավտոմատ ակտիվացնում ենք տվյալ բաժնի առաջին ենթատաբը,
        // որպեսզի մոբայլում դատարկ տարածք չլինի
        const firstSubBtn = targetSection.querySelector('.side-nav-btn');
        const firstContent = targetSection.querySelector('.content-display');
        if (firstSubBtn) firstSubBtn.classList.add('active');
        if (firstContent) firstContent.classList.add('active');
    }
}

function switchSubTab(btnElement, contentId) {
    const parentSection = btnElement.closest('.service-body-container');
    if (!parentSection) return;

    // Հեռացնում ենք active կլասը տվյալ բաժնի բոլոր ենթատաբերից
    parentSection.querySelectorAll('.side-nav-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // Հեռացնում ենք active կլասը տվյալ բաժնի բոլոր բովանդակության բլոկներից
    parentSection.querySelectorAll('.content-display').forEach(content => content.classList.remove('active'));
    
    // Ակտիվացնում ենք միայն ընտրված բովանդակությունը
    const targetContent = document.getElementById(contentId);
    if (targetContent) targetContent.classList.add('active');
}
