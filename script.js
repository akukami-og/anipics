/***********************
 *  SUPABASE CONFIG
 ***********************/
const supabaseUrl = "https://uekehssbugjcdjopietz.supabase.co";
const supabaseKey = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
const bucket = "images"; // bucket name


/***********************
 *  HTML ELEMENTS
 ***********************/
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const loader = document.getElementById("loader");


/***********************/
let allImages = [];
let likeMap = {};
let activeTag = "all";


/***********************
 * INIT
 ***********************/
init();

async function init() {
  await loadImages();    
  await loadLikes();     
  buildCategories();
  renderImages(allImages);
  enableRealtimeLikes();
  hideLoader();
}


/***********************
 * LOAD IMAGES
 ***********************/
async function loadImages() {
  const { data, error } = await supabaseClient
    .from("images")
    .select("*")
    .order("id", { ascending:false });

  if (error) return console.error(error);

  allImages = data.map(x => ({
    file: x.file,
    tags: Array.isArray(x.tags) ? x.tags : []
  }));
}


/***********************
 * LOAD LIKE COUNTS
 ***********************/
async function loadLikes() {
  const { data } = await supabaseClient.from("likes").select("*");
  if (!data) return;

  data.forEach(row => likeMap[row.image] = row.count);
}


/***********************
 * LIVE LIKE UPDATE
 ***********************/
function enableRealtimeLikes() {
  supabaseClient.channel("likes-live")
    .on("postgres_changes",
      { event:"UPDATE", table:"likes", schema:"public"},
      (payload)=>{
        likeMap[payload.new.image] = payload.new.count;

        const btn = document.querySelector(`button[data-img="${payload.new.image}"]`);
        if(btn) btn.innerHTML = `❤️ Liked (${payload.new.count})`;
      }
    ).subscribe();
}


/***********************
 * CATEGORY BUILDER
 ***********************/
function buildCategories(){
  const tagSet = new Set();
  allImages.forEach(img => img.tags.forEach(t=> tagSet.add(t)));

  categoriesDiv.innerHTML = `<div class="category active" data-tag="all">All</div>`;

  tagSet.forEach(t=>{
    const button = document.createElement("div");
    button.className="category";
    button.dataset.tag=t;
    button.innerText=t;

    button.onclick=()=>{
      activeTag = t;
      document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));
      button.classList.add("active");
      filterImages();
    };

    categoriesDiv.appendChild(button);
  });
}


/***********************
 * RENDER UI
 ***********************/
function renderImages(list){
  gallery.innerHTML="";

  list.forEach((img,i)=>{

    const card=document.createElement("div");
    card.className="card";

    const image=document.createElement("img");
    image.src=`${supabaseUrl}/storage/v1/object/public/${bucket}/${img.file}`;
    image.onclick=()=>{ preview.style.display="flex"; previewImg.src=image.src; }

    let liked = localStorage.getItem(`like_${img.file}`)==="true";
    let count = likeMap[img.file] || 0;

    const likeBtn=document.createElement("button");
    likeBtn.dataset.img=img.file;
    likeBtn.innerHTML = liked ? `❤️ Liked (${count})` : `🤍 Like (${count})`;

    likeBtn.onclick=async()=>{
      if(liked) return;

      liked=true; count++;
      localStorage.setItem(`like_${img.file}`, "true");

      await supabaseClient.from("likes").upsert(
        {image:img.file,count},
        {onConflict:"image"}
      );

      likeBtn.innerHTML=`❤️ Liked (${count})`;
    };

    const download=document.createElement("a");
    download.href=image.src;
    download.download="";
    download.innerText="⬇ Download";

    card.append(image,likeBtn,download);
    gallery.append(card);
  });
}


/***********************
 * SEARCH / FILTER
 ***********************/
function filterImages(){
  const q=searchInput.value.toLowerCase();

  renderImages(allImages.filter(img =>
    (activeTag==="all" || img.tags.includes(activeTag)) &&
    (img.file.toLowerCase().includes(q) || img.tags.some(t=>t.includes(q)))
  ));
}
searchInput.oninput=filterImages;


/***********************/
closeBtn.onclick=()=>preview.style.display="none";
preview.onclick=e=>{ if(e.target===preview) preview.style.display="none";}
function hideLoader(){ loader.style.display="none"; }
document.getElementById("year").textContent=new Date().getFullYear();
