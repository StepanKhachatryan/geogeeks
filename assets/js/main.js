function loadComponent(id, file) {
  fetch(file)
    .then(response => {
      if (!response.ok) throw new Error("Failed to load component");
      return response.text();
    })
    .then(data => {
      const container = document.getElementById(id);
      container.innerHTML = data;

      // New Logic: Highlight the active link
      if (id === "header-placeholder") {
        const currentPath = window.location.pathname.split("/").pop() || "index.html";
        const links = container.querySelectorAll(".menu a");

        links.forEach(link => {
          // If the link's href matches the current filename, add the 'active' class
          if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
          }
        });
      }
    })
    .catch(error => console.error(error));
}

loadComponent("header-placeholder", "components/header.html");
loadComponent("footer-placeholder", "components/footer.html");
