const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");

/* ================= DATA ================= */
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

  categoriesDiv.innerHTML =
    `<div class="category active" data-tag="all">All</div>`;

  tagSet.forEach(tag => {
    const btn = document.createElement("div");
    btn.className = "category";
    btn.dataset.tag = tag;
    btn.textContent = tag;
    categoriesDiv.appendChild(btn);
  });

  categoriesDiv.querySelectorAll(".category").forEach(btn => {
    btn.onclick = () => {
      categoriesDiv
        .querySelectorAll(".category")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      activeTag = btn.dataset.tag;
      filterImages();
    };
  });
}

/* ================= RENDER IMAGES ================= */
function renderImages(images) {
  gallery.innerHTML = "";

  images.forEach((img, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.setProperty("--i", index); // for stagger animation

    /* IMAGE */
    const image = document.createElement("img");
    image.src = "images/" + img.file;
    image.alt = img.file;

    image.onclick = () => {
      preview.style.display = "flex";
      previewImg.src = image.src;
    };

    /* LIKE (LOCAL – ONE TIME PER DEVICE) */
    let liked = localStorage.getItem(img.file + "_liked") === "true";
    let count = Number(localStorage.getItem(img.file + "_count")) || 0;

    const likeBtn = document.createElement("button");
    updateLikeBtn();

    likeBtn.onclick = () => {
      if (liked) return;

      liked = true;
      count++;

      localStorage.setItem(img.file + "_liked", "true");
      localStorage.setItem(img.file + "_count", count);

      updateLikeBtn();
    };

    function updateLikeBtn() {
      likeBtn.innerHTML = liked
        ? `❤️ Liked (<span>${count}</span>)`
        : `🤍 Like (<span>${count}</span>)`;
    }

    /* DOWNLOAD */
    const download = document.createElement("a");
    download.href = image.src;
    download.download = "";
    download.textContent = "⬇ Download";

    card.append(image, likeBtn, download);
    gallery.appendChild(card);
  });
}

/* ================= FILTER ================= */
function filterImages() {
  const text = searchInput.value.toLowerCase().trim();

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
searchInput.addEventListener("input", filterImages);

/* ================= PREVIEW CLOSE (SMOOTH) ================= */
function closePreview() {
  preview.classList.add("hide");

  setTimeout(() => {
    preview.style.display = "none";
    preview.classList.remove("hide");
  }, 250);
}

closeBtn.onclick = closePreview;

preview.onclick = e => {
  if (e.target === preview) closePreview();
};

/* ================= LOADER ================= */
window.onload = () => {
  document.getElementById("loader").style.display = "none";
};

/* ================= FOOTER YEAR ================= */
document.getElementById("year").textContent =
  new Date().getFullYear();
