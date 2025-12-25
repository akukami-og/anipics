
/***********************
 * SUPABASE SETUP (v2)
 ***********************/
const supabaseUrl = "https://uekehssbugjcdjopietz.supabase.co";
const supabaseKey = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";

const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

/***********************
 * ELEMENTS
 ***********************/
const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");
const loader = document.getElementById("loader");

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
  try {
    const res = await fetch("images.json");
    allImages = await res.json();

    // 🔥 newest first
    allImages.reverse();

    buildCategories();
    renderImages(allImages);

    hideLoader();

    // Load likes from Supabase in background
    loadLikes().then(() => renderImages(allImages));

  } catch (err) {
    console.error(err);
    hideLoader();
  }
}

/***********************
 * LOAD LIKES
 ***********************/
async function loadLikes() {
  const { data, error } = await supabaseClient
    .from("likes")
    .select("image, count");

  if (error) return console.error(error);

  data.forEach(row => likeMap[row.image] = row.count);
}

/***********************
 * BUILD CATEGORIES
 ***********************/
function buildCategories() {
  const tags = new Set();

  allImages.forEach(img => img.tags.forEach(t => tags.add(t)));

  categoriesDiv.innerHTML =
    `<div class="category active" data-tag="all">All</div>`;

  tags.forEach(tag => {
    const btn = document.createElement("div");
    btn.className = "category";
    btn.dataset.tag = tag;
    btn.textContent = tag;
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

/***********************
 * RENDER IMAGES (FAST)
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

    let liked = localStorage.getItem("liked_" + img.file) === "true";
    let count = likeMap[img.file] || 0;

    const likeBtn = document.createElement("button");
    updateLikeUI();

    likeBtn.onclick = async () => {
      if (liked) return;
      liked = true;
      count++;
      likeMap[img.file] = count;

      localStorage.setItem("liked_" + img.file, "true");

      await supabaseClient.from("likes").upsert(
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
 * SEARCH + FILTER
 ***********************/
function filterImages() {
  const text = searchInput.value.toLowerCase().trim();
  const filtered = allImages.filter(img =>
    (activeTag === "all" || img.tags.includes(activeTag)) &&
    (img.file.toLowerCase().includes(text) ||
     img.tags.some(t => t.includes(text)))
  );
  renderImages(filtered);
}

searchInput.addEventListener("input", filterImages);

/***********************
 * PREVIEW CLOSE
 ***********************/
function closePreview() {
  preview.classList.add("hide");
  setTimeout(() => {
    preview.style.display = "none";
    preview.classList.remove("hide");
  }, 250);
}

closeBtn.onclick = closePreview;
preview.onclick = e => { if (e.target === preview) closePreview(); };

/***********************
 * LOADER
 ***********************/
function hideLoader() {
  loader.style.display = "none";
}

/***********************
 * YEAR
 ***********************/
document.getElementById("year").textContent = new Date().getFullYear();
