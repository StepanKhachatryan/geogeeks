function loadComponent(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load component");
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      element.innerHTML = data;

      if (id === "header-placeholder") {
        let currentPath = window.location.pathname.split("/").pop() || "index.html";
        const links = element.querySelectorAll(".menu a");

        links.forEach(link => {
          if (link.getAttribute("href") === currentPath) {
            // We add a general 'active' class AND a specific page class
            link.classList.add("active");
            
            // This creates classes like 'active-index', 'active-about', etc.
            const pageName = currentPath.split(".")[0];
            link.classList.add("active-" + pageName);
          }
        });
      }
    })
    .catch(error => console.error("Error:", error));
}

loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");
