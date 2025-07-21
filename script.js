const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateBtn = document.getElementById("generateRoutine");
const selectedList = document.getElementById("selectedProductsList");

let selectedProducts = [];
let chatHistory = [];

const WORKER_URL = "https://loral-woker.eathen618.workers.dev/";

async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

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
      updateSelectedProductsList();
      saveToLocalStorage();
    });
  }
  updateSelectedProductsList();
  saveToLocalStorage();
}

function toggleDescription(id) {
  const el = document.getElementById(`desc-${id}`);
  el.style.display = el.style.display === "none" ? "block" : "none";
}

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

function removeProduct(id) {
  selectedProducts = selectedProducts.filter((p) => p.id !== id);
  document
    .querySelector(`.product-card[data-id="${id}"]`)
    ?.classList.remove("selected");
  updateSelectedProductsList();
  saveToLocalStorage();
}

function saveToLocalStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

window.addEventListener("load", async () => {
  const saved = JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const products = await loadProducts();
  selectedProducts = saved.map((s) => products.find((p) => p.id === s.id));
  updateSelectedProductsList();
});

categoryFilter.addEventListener("change", async (e) => {
  const all = await loadProducts();
  const selectedCategory = e.target.value;
  const filtered = all.filter((p) => p.category === selectedCategory);
  displayProducts(filtered);
});

generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML += `<p class="chat-msg bot">Please select at least one product.</p>`;
    return;
  }

  const systemPrompt = {
    role: "system",
    content: "You are a professional skincare and beauty advisor. Based on the user's selected products, generate a personalized skincare/haircare/makeup routine with brief, helpful steps."
  };

  const userMessage = {
    role: "user",
    content: `Here are the selected products:\n\n${selectedProducts
      .map(
        (p) => `- ${p.name} (${p.brand}, category: ${p.category})\n  ${p.description}`
      )
      .join("\n\n")}\n\nPlease generate a routine using these products.`
  };

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [systemPrompt, userMessage] })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "Something went wrong.";
  chatWindow.innerHTML += `<p class="chat-msg bot">${reply}</p>`;
  chatHistory.push(systemPrompt, userMessage, { role: "assistant", content: reply });
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  chatWindow.innerHTML += `<p class="chat-msg user">${message}</p>`;
  chatHistory.push({ role: "user", content: message });

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chatHistory })
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I had trouble answering.";
  chatWindow.innerHTML += `<p class="chat-msg bot">${reply}</p>`;
  chatHistory.push({ role: "assistant", content: reply });
  input.value = "";
});
