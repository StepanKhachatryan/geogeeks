function loadComponent(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load component");
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      element.innerHTML = data;

      // Մենյուի ակտիվ էջի նշման տրամաբանությունը
      if (id === "header-placeholder") {
        // 1. Ստանում ենք ընթացիկ ֆայլի անունը (օրինակ՝ 'about.html')
        let path = window.location.pathname;
        let currentPath = path.split("/").pop();
        
        // 2. Եթե հասցեն դատարկ է կամ '/', համարում ենք 'index.html'
        if (currentPath === "" || currentPath === "/") {
          currentPath = "index.html";
        }

        // 3. Քանի որ 'Գլխավոր'-ը (index.html) այլևս մենյուում չէ,
        // եթե մենք գլխավոր էջում ենք, ոչինչ չենք նշում
        if (currentPath === "index.html") {
          return; 
        }

        // 4. Գտնում ենք բոլոր հղումները բեռնված մենյուի մեջ
        const links = element.querySelectorAll(".menu a");

        links.forEach(link => {
          const linkHref = link.getAttribute("href");

          if (linkHref === currentPath) {
            // Ավելացնում ենք ընդհանուր 'active' դասը
            link.classList.add("active");
            
            // Ավելացնում ենք էջին հատուկ դասը (օրինակ՝ 'active-about')
            const pageName = currentPath.split(".")[0];
            link.classList.add("active-" + pageName);
          }
        });
      }
    })
    .catch(error => console.error("Error loading component:", error));
}

// Բաղադրիչների բեռնում
// Համոզվեք, որ ֆայլերի ուղիները (path) ճիշտ են ձեր պապկայի կառուցվածքի համեմատ
loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");
