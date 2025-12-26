/*********************** CONFIG ***********************/
const SUPABASE_URL = "https://uekehssbugjcdjopietz.supabase.co";
const SUPABASE_KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const BUCKET = "images";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/*********************** ELEMENTS ***********************/
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const loader = document.getElementById("loader");
const pagination = document.getElementById("pagination");

/*********************** VARIABLES ***********************/
let allImages = [];
let likeMap = {};
let activeTag = "all";
let currentPage = 1;
const IMAGES_PER_PAGE = 30;

/*********************** INIT ***********************/
init();
async function init() {
    await loadImages();
    await loadLikes();
    buildCategories();
    renderImages();
    enableRealtimeLikes();

    loader.style.display = "none"; // hide loader after load
}

/*********************** LOAD IMAGES ***********************/
async function loadImages() {
    const { data, error } = await db.from("images").select("*").order("id", { ascending: false });
    if (error) return console.log("Image Load Error:", error);

    allImages = data.map(i => ({
        file: i.file,
        tags: Array.isArray(i.tags) ? i.tags :
              typeof i.tags === "string" ? JSON.parse(i.tags) : []
    }));
}

/*********************** LOAD LIKES ***********************/
async function loadLikes() {
    const { data } = await db.from("likes").select("*");
    if (!data) return;
    data.forEach(e => likeMap[e.image] = e.count);
}

/*********************** REALTIME LIKE UPDATE ***********************/
function enableRealtimeLikes() {
    db.channel("likes-live")
      .on("postgres_changes", { event: "UPDATE", table: "likes" }, ({ new: r }) => {
          likeMap[r.image] = r.count;
          const btn = document.querySelector(`button[data-img="${r.image}"]`);
          if (btn) btn.innerHTML = `❤️ Liked (${r.count})`;
      }).subscribe();
}

/*********************** CATEGORY BUILDER ***********************/
function buildCategories() {
    const tags = new Set();
    allImages.forEach(img => img.tags.forEach(t => tags.add(t)));

    categoriesDiv.innerHTML = `<div class="category active">All</div>`;
    document.querySelector(".category").onclick = () => setCategory("all");

    tags.forEach(tag => {
        const c = document.createElement("div");
        c.className = "category";
        c.innerText = tag;
        c.onclick = () => setCategory(tag);
        categoriesDiv.appendChild(c);
    });
}

function setCategory(tag) {
    activeTag = tag;
    currentPage = 1;
    document.querySelectorAll(".category").forEach(x => x.classList.remove("active"));
    [...categoriesDiv.children].find(c => c.innerText === tag).classList.add("active");
    renderImages();
}

/*********************** RENDER IMAGES ***********************/
function renderImages() {
    gallery.innerHTML = "";

    const filtered = allImages.filter(img =>
        (activeTag === "all" || img.tags.includes(activeTag)) &&
        (searchInput.value === "" ||
         img.file.toLowerCase().includes(searchInput.value.toLowerCase()) ||
         img.tags.some(t => t.toLowerCase().includes(searchInput.value.toLowerCase())))
    );

    const start = (currentPage - 1) * IMAGES_PER_PAGE;
    const pageImages = filtered.slice(start, start + IMAGES_PER_PAGE);

    pageImages.forEach((img, i) => {
        const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img.file}`;
        const card = document.createElement("div");
        card.className = "card";
        card.style.setProperty("--i", i);

        const image = document.createElement("img");
        image.src = url;
        image.onclick = () => showPreview(url);

        const likeBtn = createLikeBtn(img.file);
        const downloadBtn = createDownloadBtn(url, img.file);

        card.append(image, likeBtn, downloadBtn);
        gallery.append(card);
    });

    buildPagination(filtered.length);
}

/*********************** LIKE FUNCTION ***********************/
function createLikeBtn(file) {
    let liked = localStorage.getItem("liked_" + file) === "true";
    let count = likeMap[file] || 0;

    const btn = document.createElement("button");
    btn.dataset.img = file;
    btn.innerHTML = liked ? `❤️ Liked (${count})` : `🤍 Like (${count})`;

    btn.onclick = async () => {
        if (liked) return;
        liked = true;
        count++;
        localStorage.setItem("liked_" + file, "true");

        await db.from("likes").upsert({ image: file, count }, { onConflict: "image" });
        btn.innerHTML = `❤️ Liked (${count})`;
    };

    return btn;
}

/*********************** DOWNLOAD FUNCTION ***********************/
async function downloadImage(url, name) {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
}

function createDownloadBtn(url, name) {
    const btn = document.createElement("button");
    btn.innerText = "⬇ Download";
    btn.onclick = () => downloadImage(url, name);
    return btn;
}

/*********************** PAGINATION ***********************/
function buildPagination(total) {
    pagination.innerHTML = "";
    const totalPages = Math.ceil(total / IMAGES_PER_PAGE);
    if (totalPages <= 1) return;

    pagination.append(createPageBtn("◀ Prev", currentPage - 1, currentPage > 1));

    for (let i = 1; i <= totalPages; i++) {
        const btn = createPageBtn(i, i, true);
        if (i === currentPage) btn.classList.add("activePage");
        pagination.append(btn);
    }

    pagination.append(createPageBtn("Next ▶", currentPage + 1, currentPage < totalPages));
}

function createPageBtn(text, page, enabled) {
    const btn = document.createElement("button");
    btn.innerText = text;
    btn.disabled = !enabled;
    if (enabled) btn.onclick = () => {
        currentPage = page;
        renderImages();
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    return btn;
}

/*********************** PREVIEW ***********************/
function showPreview(url) {
    previewImg.src = url;
    preview.style.display = "flex";
}

closeBtn.onclick = () => preview.style.display = "none";
preview.onclick = e => { if (e.target === preview) preview.style.display = "none"; };

document.getElementById("year").innerText = new Date().getFullYear();
