
const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");

let allImages = [];
let activeTag = "all";

/* ================= LOAD IMAGES ================= */
fetch("images.json")
  .then(res => res.json())
  .then(data => {
    allImages = data;
    buildCategories();
    renderImages(allImages);
  });

/* ================= BUILD CATEGORIES ================= */
function buildCategories() {
  const tagSet = new Set();

  allImages.forEach(img => {
    img.tags.forEach(tag => tagSet.add(tag));
  });

  categoriesDiv.innerHTML = `<div class="category active" data-tag="all">All</div>`;

  tagSet.forEach(tag => {
    const btn = document.createElement("div");
    btn.className = "category";
    btn.dataset.tag = tag;
    btn.innerText = tag;
    categoriesDiv.appendChild(btn);
  });

  document.querySelectorAll(".category").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".category").forEach(b =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      activeTag = btn.dataset.tag;
      filterImages();
    };
  });
}

/* ================= RENDER IMAGES ================= */
function renderImages(images) {
  gallery.innerHTML = "";

  images.forEach(img => {
    const card = document.createElement("div");
    card.className = "card";

    const image = document.createElement("img");
    image.src = "images/" + img.file;

    // FULL SCREEN PREVIEW
    image.onclick = () => {
      preview.style.display = "flex";
      previewImg.src = image.src;
    };

    // LIKE SYSTEM (ONE TIME PER DEVICE)
    let liked = localStorage.getItem(img.file + "_liked") === "true";
    let count = localStorage.getItem(img.file + "_count") || 0;

    const likeBtn = document.createElement("button");
    likeBtn.innerHTML = liked
      ? `❤️ Liked (<span>${count}</span>)`
      : `🤍 Like (<span>${count}</span>)`;

    likeBtn.onclick = () => {
      if (liked) return;

      liked = true;
      count++;

      localStorage.setItem(img.file + "_liked", "true");
      localStorage.setItem(img.file + "_count", count);

      likeBtn.innerHTML = `❤️ Liked (<span>${count}</span>)`;
    };

    // DOWNLOAD
    const download = document.createElement("a");
    download.href = image.src;
    download.download = "";
    download.innerText = "⬇ Download";

    card.append(image, likeBtn, download);
    gallery.appendChild(card);
  });
}

/* ================= FILTER ================= */
function filterImages() {
  const text = searchInput.value.toLowerCase();

  const filtered = allImages.filter(img => {
    const tagMatch =
      activeTag === "all" || img.tags.includes(activeTag);

    const textMatch =
      img.file.toLowerCase().includes(text) ||
      img.tags.some(tag => tag.includes(text));

    return tagMatch && textMatch;
  });

  renderImages(filtered);
}

/* ================= SEARCH ================= */
searchInput.oninput = filterImages;

/* ================= CLOSE PREVIEW ================= */
closeBtn.onclick = () => {
  preview.style.display = "none";
};

preview.onclick = e => {
  if (e.target === preview) preview.style.display = "none";
};

/* ================= LOADER ================= */
window.onload = () => {
  document.getElementById("loader").style.display = "none";
};
