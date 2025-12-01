let products = []; 
let originalProducts = []; 

fetch('https://dummyjson.com/products')
    .then(res => res.json())        // konwertuje na json
    .then(data => {
        products = data.products.slice(0, 30); 
        originalProducts = [...products];
        renderTable(products);
    })
    .catch(err => console.error(err));

function renderTable(data) {
    const tbody = document.getElementById("productsTableBody");
    tbody.innerHTML = "";   // czysci tabele (brak dublowania)

    data.forEach(product => {
        const tr = document.createElement("tr");     // tworzy nowy wiersz

        const tdImg = document.createElement("td");
        const img = document.createElement("img");
        img.src = product.thumbnail; 
        tdImg.appendChild(img);

        const tdTitle = document.createElement("td");
        tdTitle.textContent = product.title;

        const tdDesc = document.createElement("td");
        tdDesc.textContent = product.description;

        tr.appendChild(tdImg);
        tr.appendChild(tdTitle);
        tr.appendChild(tdDesc);

        tbody.appendChild(tr);
    });
}

document.getElementById("filterInput").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
    renderTable(filtered);
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
    const value = e.target.value;

    let sorted = [...products]; 

    if (value === "asc") {
        sorted.sort((a,b) => a.title.localeCompare(b.title));
    } else if (value === "desc") {
        sorted.sort((a,b) => b.title.localeCompare(a.title));
    } else {
        sorted = [...originalProducts];
    }

    renderTable(sorted);
});
