function loadComponent(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load component");
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(id);
      element.innerHTML = data;

      // Logic to highlight the active menu item based on current page
      if (id === "header-placeholder") {
        // 1. Get the current filename (e.g., 'about.html')
        let path = window.location.pathname;
        let currentPath = path.split("/").pop();
        
        // 2. Default to 'index.html' if the path is empty (root level)
        if (currentPath === "" || currentPath === "/") {
          currentPath = "index.html";
        }

        // 3. Find all links in the newly loaded menu
        const links = element.querySelectorAll(".menu a");

        links.forEach(link => {
          // Get the href attribute of the link (e.g., 'about.html')
          const linkHref = link.getAttribute("href");

          if (linkHref === currentPath) {
            // Add a general 'active' class
            link.classList.add("active");
            
            // 4. Create a specific page class (e.g., 'active-about')
            // This splits 'about.html' into ['about', 'html'] and takes 'about'
            const pageName = currentPath.split(".")[0];
            link.classList.add("active-" + pageName);
          }
        });
      }
    })
    .catch(error => console.error("Error loading component:", error));
}

// Initialize components
loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");
