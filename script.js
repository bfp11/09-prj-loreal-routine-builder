const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateBtn = document.getElementById("generateRoutine");
const selectedList = document.getElementById("selectedProductsList");

let selectedProducts = [];
let chatHistory = [];

/* Load product data */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Display products */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="desc-btn" onclick="toggleDescription(${product.id})">Details</button>
        <div class="product-desc" id="desc-${product.id}" style="display: none;">
          <p>${product.description}</p>
        </div>
      </div>
    </div>`
    )
    .join("");

  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.classList.contains("desc-btn")) {
        toggleProductSelection(card);
      }
    });
  });
}

/* Toggle product selection */
function toggleProductSelection(card) {
  const id = parseInt(card.dataset.id);
  const exists = selectedProducts.find((p) => p.id === id);

  if (exists) {
    selectedProducts = selectedProducts.filter((p) => p.id !== id);
    card.classList.remove("selected");
  } else {
    loadProducts().then((products) => {
      const product = products.find((p) => p.id === id);
      selectedProducts.push(product);
      card.classList.add("selected");
    });
  }
  updateSelectedProductsList();
  saveToLocalStorage();
}

/* Toggle description */
function toggleDescription(id) {
  const el = document.getElementById(`desc-${id}`);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

/* Update selected products list */
function updateSelectedProductsList() {
  selectedList.innerHTML = selectedProducts
    .map(
      (p) => `
    <div class="selected-product">
      <span>${p.name}</span>
      <button onclick="removeProduct(${p.id})">&times;</button>
    </div>`
    )
    .join("");
}

/* Remove individual product */
function removeProduct(id) {
  selectedProducts = selectedProducts.filter((p) => p.id !== id);
  document
    .querySelector(`.product-card[data-id="${id}"]`)
    ?.classList.remove("selected");
  updateSelectedProductsList();
  saveToLocalStorage();
}

/* Save selections */
function saveToLocalStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Load selections */
window.addEventListener("load", async () => {
  const saved = JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const products = await loadProducts();
  selectedProducts = saved.map((s) => products.find((p) => p.id === s.id));
  updateSelectedProductsList();
});

/* Filter products */
categoryFilter.addEventListener("change", async (e) => {
  const all = await loadProducts();
  const selectedCategory = e.target.value;
  const filtered = all.filter((p) => p.category === selectedCategory);
  displayProducts(filtered);
});

/* Generate routine */
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<p class="chat-msg bot">Please select at least one product first.</p>`;
    return;
  }

  const res = await fetch("https://loral-woker.eathen618.workers.dev/", {
    method: "POST",
    body: JSON.stringify({ products: selectedProducts }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  chatWindow.innerHTML += `<p class="chat-msg bot">${data.routine}</p>`;
  chatHistory.push({ role: "assistant", content: data.routine });
});

/* Handle chat */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const msg = input.value.trim();
  if (!msg) return;

  chatWindow.innerHTML += `<p class="chat-msg user">${msg}</p>`;
  chatHistory.push({ role: "user", content: msg });

  const res = await fetch("https://loral-woker.eathen618.workers.dev/", {
    method: "POST",
    body: JSON.stringify({ messages: chatHistory }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  chatWindow.innerHTML += `<p class="chat-msg bot">${data.reply}</p>`;
  chatHistory.push({ role: "assistant", content: data.reply });
  input.value = "";
});
