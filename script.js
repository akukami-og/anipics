/***********************
 * SUPABASE SETUP
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
let likeMap = {};
let activeTag = "all";

/***********************
 * INIT
 ***********************/
init();

async function init() {
  await loadImages();         // from Supabase DB
  await loadLikes();          // like counts
  buildCategories();
  renderImages(allImages);
  hideLoader();
  enableRealtimeLikes();      // live update like count
}

/***********************
 * LOAD IMAGES FROM SUPABASE
 ***********************/
async function loadImages() {
  const { data, error } = await supabaseClient
    .from("images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return console.error(error);

  // convert DB format → JS format
  allImages = data.map(x => ({
    file: x.file,
    tags: x.tags ? x.tags : []
  }));
}

/***********************
 * LOAD LIKE DATA
 ***********************/
async function loadLikes() {
  const { data } = await supabaseClient.from("likes").select("*");
  if (!data) return;
  data.forEach(row => likeMap[row.image] = row.count);
}

/*********************** 
 * REALTIME LIKE UPDATES
 ***********************/
function enableRealtimeLikes() {
  supabaseClient
    .channel("likes-live")
    .on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "likes" },
      payload => {
        likeMap[payload.new.image] = payload.new.count;
        const btn = document.querySelector(`button[data-img="${payload.new.image}"]`);
        if (btn) btn.innerHTML = `❤️ Liked (${payload.new.count})`;
      })
    .subscribe();
}

/***********************
 * BUILD CATEGORY FILTER
 ***********************/
function buildCategories() {
  const tags = new Set();
  allImages.forEach(img => img.tags.forEach(t => tags.add(t)));

  categoriesDiv.innerHTML = `<div class="category active" data-tag="all">All</div>`;
  tags.forEach(t => {
    let el = document.createElement("div");
    el.className = "category";
    el.dataset.tag = t;
    el.innerText = t;
    el.onclick = () => {
      activeTag = t;
      document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));
      el.classList.add("active");
      filterImages();
    };
    categoriesDiv.appendChild(el);
  });
}

/***********************
 * RENDER IMAGES UI
 ***********************/
function renderImages(images) {
  gallery.innerHTML = "";

  images.forEach((img,i) =>{
    const card = document.createElement("div");
    card.className="card";
    card.style.setProperty("--i",i);

    const image = document.createElement("img");
    image.src=`${supabaseUrl}/storage/v1/object/public/anipics/${img.file}`;
    image.onclick=()=>{
      preview.style.display="flex";
      previewImg.src=image.src;
    };

    let liked = localStorage.getItem("liked_"+img.file)==="true";
    let count = likeMap[img.file]||0;

    const likeBtn=document.createElement("button");
    likeBtn.dataset.img=img.file;
    likeBtn.innerHTML = liked?`❤️ Liked (${count})`:`🤍 Like (${count})`;

    likeBtn.onclick = async ()=>{
      if(liked) return;
      liked=true; count++;
      likeMap[img.file]=count;
      localStorage.setItem("liked_"+img.file,"true");

      await supabaseClient.from("likes").upsert(
        {image:img.file,count},
        {onConflict:"image"}
      );
      likeBtn.innerHTML=`❤️ Liked (${count})`;
    };

    const download=document.createElement("a");
    download.href=image.src;
    download.download="";
    download.textContent="⬇ Download";

    card.append(image,likeBtn,download);
    gallery.appendChild(card);
  });
}

/***********************
 * FILTER + SEARCH
 ***********************/
function filterImages(){
  const q=searchInput.value.toLowerCase();
  renderImages(allImages.filter(img =>
    (activeTag==="all"||img.tags.includes(activeTag)) &&
    (img.file.toLowerCase().includes(q)||img.tags.some(t=>t.includes(q)))
  ));
}
searchInput.oninput=filterImages;

/***********************/
function hideLoader(){loader.style.display="none";}
closeBtn.onclick=()=>preview.style.display="none";
preview.onclick=e=>{if(e.target===preview)preview.style.display="none";}
document.getElementById("year").textContent=new Date().getFullYear();
