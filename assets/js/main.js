async function loadComponent(id, file) {
    const response = await fetch(file);
    const data = await response.text();
    document.getElementById(id).innerHTML = data;
}

// Call them
loadComponent("header", "components/header.html");
loadComponent("footer", "components/footer.html");
