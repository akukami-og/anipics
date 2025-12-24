/***********************
 * SUPABASE SETUP
 ***********************/
const supabaseUrl = "https://uekehssbugjcdjopietz.supabase.co";
const supabaseKey =
  "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";

const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

/***********************
 * ELEMENTS
 ***********************/
const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");

/***********************
 * DATA
 ***********************/
let allImages = [];
let activeTag = "all";
let likeMap = {}; // image -> count

/***********************
 * INIT
 ***********************/
init();

async function init() {
  const imagesRes = await fetch("images.json");
  allImages = await imagesRes.json();

  await loadLikes();
  buildCategories();
  renderImages(allImages);

  hideLoader();
}

/***********************
 * LOAD LIKES (ONE CALL)
 ***********************/
async function loadLikes() {
  const { data, error } = await supabase
    .from("likes")
    .select("image, count");

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(row => {
    likeMap[row.image] = row.count;
  });
}

/***********************
 * BUILD CATEGORIES
 ***********************/
function buildCategories() {
  const tags = new Set();

  allImages.forEach(img =>
    img.tags.forEach(tag => tags.add(tag))
  );

  categoriesDiv.innerHTML =
    `<div class="category active" data-tag="all">All</div>`;

  tags.forEach(tag => {
    const btn = document.createElement("div");
    btn.className = "category";
    btn.dataset.tag = tag;
    btn.textContent = tag;
    categoriesDiv.appendChild(btn);
  });

  categoriesDiv.querySelectorAll(".category").forEach(btn => {
    btn.onclick = () => {
      document
        .querySelectorAll(".category")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      activeTag = btn.dataset.tag;
      filterImages();
    };
  });
}

/***********************
 * RENDER IMAGES
 ***********************/
function renderImages(images) {
  gallery.innerHTML = "";

  images.forEach((img, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.setProperty("--i", i);

    const image = document.createElement("img");
    image.src = "images/" + img.file;

    image.onclick = () => {
      preview.style.display = "flex";
      previewImg.src = image.src;
    };

    let liked =
      localStorage.getItem("liked_" + img.file) === "true";

    let count = likeMap[img.file] || 0;

    const likeBtn = document.createElement("button");
    updateLikeUI();

    likeBtn.onclick = async () => {
      if (liked) return;

      liked = true;
      count++;
      likeMap[img.file] = count;

      localStorage.setItem("liked_" + img.file, "true");

      await supabase
        .from("likes")
        .upsert(
          { image: img.file, count },
          { onConflict: "image" }
        );

      updateLikeUI();
    };

    function updateLikeUI() {
      likeBtn.innerHTML = liked
        ? `❤️ Liked (<span>${count}</span>)`
        : `🤍 Like (<span>${count}</span>)`;
    }

    const download = document.createElement("a");
    download.href = image.src;
    download.download = "";
    download.textContent = "⬇ Download";

    card.append(image, likeBtn, download);
    gallery.appendChild(card);
  });
}

/***********************
 * FILTER
 ***********************/
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

searchInput.addEventListener("input", filterImages);

/***********************
 * PREVIEW
 ***********************/
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

/***********************
 * LOADER
 ***********************/
function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

/***********************
 * FOOTER YEAR
 ***********************/
document.getElementById("year").textContent =
  new Date().getFullYear();
