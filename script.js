/*********************** CONFIG ***********************/
const SUPABASE_URL = "https://uekehssbugjcdjopietz.supabase.co";
const SUPABASE_KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const BUCKET = "images";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/*********************** DOM ***********************/
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const loader = document.getElementById("loader");
const pagination = document.getElementById("pagination");

/*********************** STATE ***********************/
let allImages = [];
let likeMap = {};
let activeTag = "all";
let currentPage = 1;
const IMAGES_PER_PAGE = 30;

/*********************** INIT ***********************/
init();
async function init(){
    await loadImages();
    await loadLikes();
    buildCategories();
    renderImages();
    enableRealtimeLikes();
    loader.style.display = "none";
}

/*********************** LOAD IMAGES ***********************/
async function loadImages(){
    const {data,error} = await db.from("images").select("*").order("id",{ascending:false});
    if(error) return console.error(error);

    allImages = data.map(img => ({
        file: img.file,
        tags: Array.isArray(img.tags) ? img.tags :
             typeof img.tags==="string" ? JSON.parse(img.tags) : []
    }));
}

/*********************** LOAD LIKES ***********************/
async function loadLikes(){
    const {data} = await db.from("likes").select("*");
    if(!data) return;
    data.forEach(r => likeMap[r.image] = r.count);
}

/*********************** LIVE LIKE UPDATES ***********************/
function enableRealtimeLikes(){
    db.channel("likes-sync")
    .on("postgres_changes",{event:"UPDATE",table:"likes",schema:"public"},payload=>{
        likeMap[payload.new.image] = payload.new.count;
        let btn = document.querySelector(`button[data-img="${payload.new.image}"]`);
        if(btn) btn.innerHTML = `❤️ ${payload.new.count}`;
    }).subscribe();
}

/*********************** CATEGORY BUILD ***********************/
function buildCategories(){
    const tags = new Set();
    allImages.forEach(img => img.tags.forEach(t => tags.add(t)));

    categoriesDiv.innerHTML = `<div class="category active">All</div>`;
    document.querySelector(".category").onclick = ()=>setCategory("all");

    tags.forEach(tag=>{
        const div = document.createElement("div");
        div.className="category";
        div.innerText=tag;
        div.onclick=()=>setCategory(tag);
        categoriesDiv.appendChild(div);
    });
}

function setCategory(tag){
    activeTag = tag;
    searchInput.value = "";
    currentPage = 1;

    document.querySelectorAll(".category").forEach(c=>c.classList.remove("active"));
    [...categoriesDiv.children].find(c=>c.innerText.toLowerCase()==tag.toLowerCase())
        .classList.add("active");

    renderImages();
}

/*********************** GALLERY RENDER ***********************/
function renderImages(){
    gallery.innerHTML = "";
    const search = searchInput.value.toLowerCase().trim();

    const filtered = allImages.filter(img=>{
        const tagsLower = img.tags.map(t=>t.toLowerCase());
        const matchTag = activeTag==="all" || tagsLower.includes(activeTag.toLowerCase());
        const matchSearch = !search ||
            img.file.toLowerCase().includes(search) ||
            tagsLower.some(t=>t.includes(search));

        return matchTag && matchSearch;
    });

    const start = (currentPage-1)*IMAGES_PER_PAGE;
    filtered.slice(start,start+IMAGES_PER_PAGE).forEach(img=>{
        const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img.file}`;
        
        const card = document.createElement("div");
        card.className="card";

        const image = document.createElement("img");
        image.src=url;
        image.onclick=()=>showPreview(url);

        card.append(
            image,
            createLikeBtn(img.file),
            createDownloadBtn(url,img.file)
        );

        gallery.append(card);
    });

    buildPagination(filtered.length);
}

/*********************** LIKE BUTTON ***********************/
function createLikeBtn(file){
    let liked = localStorage.getItem("liked_"+file) === "true";
    let count = likeMap[file] || 0;

    const btn=document.createElement("button");
    btn.dataset.img=file;
    btn.innerHTML = liked ? `❤️ ${count}` : `🤍 ${count}`;

    btn.onclick=async()=>{
        if(liked) return;
        liked=true; count++;
        localStorage.setItem("liked_"+file,"true");

        await db.from("likes").upsert({image:file,count},{onConflict:"image"});
        btn.innerHTML = `❤️ ${count}`;
    };
    return btn;
}

/*********************** DOWNLOAD (1-CLICK) ***********************/
function createDownloadBtn(url,name){
    const btn=document.createElement("button");
    btn.innerHTML="⬇ Download";  // keeps text + symbol
    btn.onclick=()=>downloadImage(url,name);
    return btn;
}

async function downloadImage(url,name){
    const blob = await (await fetch(url)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;      // ONE CLICK DOWNLOAD WORKS HERE
    a.click();
    URL.revokeObjectURL(a.href);
}

/*********************** PAGINATION ***********************/
function buildPagination(total){
    pagination.innerHTML="";
    const pages = Math.ceil(total/IMAGES_PER_PAGE);
    if(pages<=1) return;

    pagination.append(createPageBtn("◀",currentPage-1,currentPage>1));
    for(let i=1;i<=pages;i++){
        let b=createPageBtn(i,i,true);
        if(i===currentPage) b.classList.add("activePage");
        pagination.append(b);
    }
    pagination.append(createPageBtn("▶",currentPage+1,currentPage<pages));
}

function createPageBtn(text,page,ok){
    const btn=document.createElement("button");
    btn.innerText=text;
    btn.disabled=!ok;
    if(ok) btn.onclick=()=>{ currentPage=page; renderImages(); window.scrollTo({top:0,behavior:"smooth"}); };
    return btn;
}

/*********************** PREVIEW ***********************/
function showPreview(url){
    previewImg.src=url;
    preview.style.display="flex";
}
closeBtn.onclick = ()=>preview.style.display="none";
preview.onclick = e=>{ if(e.target===preview) preview.style.display="none"; };

document.getElementById("year").innerText=new Date().getFullYear();

/*********************** SEARCH LIVE ***********************/
searchInput.oninput = ()=>{
    activeTag="all";
    document.querySelectorAll(".category").forEach(c=>c.classList.remove("active"));
    document.querySelector(".category").classList.add("active");
    currentPage=1;
    renderImages();
};
