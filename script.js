/***********************
 * 🔥 SUPABASE CONFIG
 ***********************/
const SUPABASE_URL = "https://uekehssbugjcdjopietz.supabase.co";
const SUPABASE_KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const BUCKET = "images";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/***********************
 * DOM ELEMENTS
 ***********************/
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const loader = document.getElementById("loader");
const pagination = document.getElementById("pagination");


/***********************
 * VARIABLES
 ***********************/
let allImages = [];
let likeMap = {};
let activeTag = "all";
let currentPage = 1;
const IMAGES_PER_PAGE = 30;


/***********************
 * START APP
 ***********************/
init();
async function init(){
    await loadImages();
    await loadLikes();

    buildCategories();
    renderImages();
    enableRealtimeLikes();

    hideLoader();
}


/***********************
 * LOAD IMAGES FROM DB
 ***********************/
async function loadImages(){
    const { data, error } = await db.from("images").select("*").order("id",{ascending:false});
    if(error) return console.log("Image Load Error:", error);

    allImages = data.map(i => ({
        file: i.file,
        tags: Array.isArray(i.tags) ? i.tags :
              typeof i.tags==="string" ? JSON.parse(i.tags) : []
    }));
}


/***********************
 * LOAD LIKES
 ***********************/
async function loadLikes(){
    const { data } = await db.from("likes").select("*");
    if(!data) return;

    data.forEach(e => likeMap[e.image]=e.count);
}


/***********************
 * REALTIME LIKE UPDATE
 ***********************/
function enableRealtimeLikes(){
    db.channel("like-channel")
      .on("postgres_changes",{event:"UPDATE",table:"likes"},({new:r})=>{
          likeMap[r.image]=r.count;
          const btn=document.querySelector(`button[data-img="${r.image}"]`);
          if(btn) btn.innerHTML=`❤️ Liked (${r.count})`;
      }).subscribe();
}


/***********************
 * CATEGORY BUTTONS
 ***********************/
function buildCategories(){
    const tags = new Set();
    allImages.forEach(img => img.tags.forEach(t=>tags.add(t)));

    categoriesDiv.innerHTML = `<div class="category active" data-tag="all">All</div>`;

    tags.forEach(tag=>{
        const c=document.createElement("div");
        c.className="category";
        c.innerText=tag;

        c.onclick=()=>{
            activeTag=tag;
            currentPage=1;
            document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));
            c.classList.add("active");
            renderImages();
        };

        categoriesDiv.appendChild(c);
    });
}


/***********************
 * RENDER IMAGES + PAGINATION
 ***********************/
function renderImages(){
    gallery.innerHTML="";

    const filtered = allImages.filter(img =>
        (activeTag==="all" || img.tags.includes(activeTag)) &&
        (searchInput.value=="" ||
         img.file.toLowerCase().includes(searchInput.value.toLowerCase()) ||
         img.tags.some(t => t.toLowerCase().includes(searchInput.value.toLowerCase())))
    );

    const start=(currentPage-1)*IMAGES_PER_PAGE;
    const pageImages=filtered.slice(start,start+IMAGES_PER_PAGE);


    pageImages.forEach((img,i)=>{
        const card=document.createElement("div");
        card.className="card"; card.style.setProperty("--i", i);

        const image=document.createElement("img");
        image.src=`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img.file}`;
        image.onclick=()=>{preview.style.display="flex";previewImg.src=image.src;}

        let liked = localStorage.getItem("liked_"+img.file)==="true";
        let count = likeMap[img.file]||0;

        const likeBtn=document.createElement("button");
        likeBtn.dataset.img=img.file;
        likeBtn.innerHTML = liked?`❤️ Liked (${count})`:`🤍 Like (${count})`;
        likeBtn.onclick=async()=>{
            if(liked) return;
            liked=true;count++;
            localStorage.setItem("liked_"+img.file,"true");
            await db.from("likes").upsert({image:img.file,count},{onConflict:"image"});
            likeBtn.innerHTML=`❤️ Liked (${count})`;
        };

        // 🔥 REAL one-click download
        const download=document.createElement("button");
        download.innerText="⬇ Download";
        download.onclick=()=>{
            const link=document.createElement("a");
            link.href=image.src;
            link.download=img.file;
            document.body.appendChild(link);
            link.click();
            link.remove();
        };

        card.append(image,likeBtn,download);
        gallery.append(card);
    });

    buildPagination(filtered.length);
}


/***********************
 * PAGINATION BUTTONS
 ***********************/
function buildPagination(total){
    pagination.innerHTML="";
    const totalPages = Math.ceil(total/IMAGES_PER_PAGE);
    if(totalPages<=1) return;

    for(let i=1;i<=totalPages;i++){
        const btn=document.createElement("button");
        btn.innerText=i;
        btn.className=(i===currentPage)?"activePage":"pageBtn";
        btn.onclick=()=>{currentPage=i;renderImages();};
        pagination.append(btn);
    }
}


/***********************
 * SEARCH LIVE FILTER
 ***********************/
searchInput.oninput = ()=>{currentPage=1;renderImages();};


/***********************
 * PREVIEW CLOSE
 ***********************/
closeBtn.onclick=()=>preview.style.display="none";
preview.onclick=e=>{if(e.target===preview)preview.style.display="none";};


/***********************
 * FOOTER + LOADER
 ***********************/
function hideLoader(){ loader.style.display="none"; }
document.getElementById("year").innerText=new Date().getFullYear();
