/***********************
 * SUPABASE SETUP
 ***********************/
const supabaseUrl = "https://uekehssbugjcdjopietz.supabase.co";
const supabaseKey = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";

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

/***********************
 * LOAD IMAGES
 ***********************/
fetch("images.json")
  .then(res => res.json())
  .then(data => {
    allImages = data;
    buildCategories();
    renderImages(allImages);
  });

/***********************
 * BUILD CATEGORIES
 ***********************/
function buildCategories() {
  const tagSet = new Set();

  allImages.forEach(img =>
    img.tags.forEach(tag => tagSet.add(tag))
  );

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
async function renderImages(images) {
  gallery.innerHTML = "";

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    /* GET LIKE COUNT FROM SUPABASE */
    let { data, error } = await supabase
      .from("likes")
      .select("count")
      .eq("image", img.file)
      .single();

    if (!data) {
      // create row if not exists
      await supabase.from("likes").insert({
        image: img.file,
        count: 0
      });
      data = { count: 0 };
    }

    let liked =
      localStorage.getItem("liked_" + img.file) === "true";

    let count = data.count;

    /* CARD */
    const card = document.createElement("div");
    card.className = "card";
    card.style.setProperty("--i", i);

    /* IMAGE */
    const image = document.createElement("img");
    image.src = "images/" + img.file;

    image.onclick = () => {
      preview.style.display = "flex";
      previewImg.src = image.src;
    };

    /* LIKE BUTTON */
    const likeBtn = document.createElement("button");

    function updateLikeUI() {
      likeBtn.innerHTML = liked
        ? `❤️ Liked (<span>${count}</span>)`
        : `🤍 Like (<span>${count}</span>)`;
    }

    updateLikeUI();

    likeBtn.onclick = async () => {
      if (liked) return;

      liked = true;
      count++;

      localStorage.setItem("liked_" + img.file, "true");

      await supabase
        .from("likes")
        .update({ count })
        .eq("image", img.file);

      updateLikeUI();
    };

    /* DOWNLOAD */
    const download = document.createElement("a");
    download.href = image.src;
    download.download = "";
    download.textContent = "⬇ Download";

    card.append(image, likeBtn, download);
    gallery.appendChild(card);
  }
}

/***********************
 * FILTER
 ***********************/
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
preview.onclick = e => {
  if (e.target === preview) closePreview();
};

/***********************
 * LOADER
 ***********************/
window.onload = () => {
  document.getElementById("loader").style.display = "none";
};

/***********************
 * FOOTER YEAR
 ***********************/
document.getElementById("year").textContent =
  new Date().getFullYear();
