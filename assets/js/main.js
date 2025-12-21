function loadComponent(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load component");
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      element.innerHTML = data;

      // Logic to highlight the active menu item
      if (id === "header-placeholder") {
        // Get current filename (e.g., 'about.html'). Default to 'index.html' if empty.
        let currentPath = window.location.pathname.split("/").pop() || "index.html";
        
        const links = element.querySelectorAll(".menu a");
        links.forEach(link => {
          if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
          }
        });
      }
    })
    .catch(error => console.error("Error:", error));
}

loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");
