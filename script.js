/***********************
 * SUPABASE CONFIG
 ***********************/
const SUPABASE_URL = "https://uekehssbugjcdjopietz.supabase.co";
const SUPABASE_KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const BUCKET = "images";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/*********************** ELEMENTS ***********************/
const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");
const searchInput = document.getElementById("search");
const categoriesDiv = document.getElementById("categories");
const loader = document.getElementById("loader");

let allImages = [];
let likeMap = {};
let activeTag = "all";


/*********************** INIT ***********************/
init();
async function init(){
    await loadImages();
    await loadLikes();
    buildCategories();
    renderImages(allImages);
    enableRealtimeLikes();
    hideLoader();
}


/*********************** LOAD IMAGES ***********************/
async function loadImages(){
    const { data, error } = await supabaseClient
        .from("images")
        .select("*")
        .order("id",{ascending:false});

    if(error) return console.log("LoadImages Error:",error);

    allImages = data.map(i => ({
        file: i.file,
        tags: Array.isArray(i.tags)
              ? i.tags
              : typeof i.tags === "string"
                ? JSON.parse(i.tags)
                : []
    }));
}


/*********************** LIKE DATA ***********************/
async function loadLikes(){
    const { data,error } = await supabaseClient.from("likes").select("*");
    if(error) return console.log(error);

    data.forEach(r => likeMap[r.image] = r.count);
}


/*********************** REALTIME LIKE UPDATE ***********************/
function enableRealtimeLikes(){
    supabaseClient.channel("live-likes")
    .on("postgres_changes",
       {event:"UPDATE",schema:"public",table:"likes"},
       ({new: row})=>{
          likeMap[row.image] = row.count;
          const btn=document.querySelector(`button[data-img="${row.image}"]`);
          if(btn) btn.innerHTML=`❤️ Liked (${row.count})`;
       }
    ).subscribe();
}


/*********************** BUILD CATEGORY ***********************/
function buildCategories(){
    const tags=new Set();
    allImages.forEach(img=>img.tags.forEach(t=>tags.add(t)));

    categoriesDiv.innerHTML=`<div class="category active" data-tag="all">All</div>`;

    tags.forEach(tag=>{
      const c=document.createElement("div");
      c.className="category";
      c.innerText=tag;

      c.onclick=()=>{
        activeTag = tag;
        document.querySelectorAll(".category").forEach(b=>b.classList.remove("active"));
        c.classList.add("active");
        filterImages();
      }

      categoriesDiv.appendChild(c);
    });
}


/*********************** RENDER IMAGES ***********************/
function renderImages(list){
    gallery.innerHTML="";

    list.forEach(img=>{
        const card=document.createElement("div");
        card.className="card";

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
            likeMap[img.file]=count;

            await supabaseClient.from("likes").upsert(
                {image:img.file,count},
                {onConflict:"image"}
            );

            likeBtn.innerHTML=`❤️ Liked (${count})`;
        }


        /* ------ FIXED DOWNLOAD (FORCE DOWNLOAD) ------ */
        const download=document.createElement("button");
        download.innerText="⬇ Download";

        download.onclick = async ()=>{
            const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img.file}`;
            try{
                const res = await fetch(url);
                const blob = await res.blob();
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = img.file;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }catch(e){
                alert("Download failed ❌");
                console.log(e);
            }
        };

        card.append(image,likeBtn,download);
        gallery.append(card);
    });
}


/*********************** FILTER SEARCH ***********************/
function filterImages(){
    const q=searchInput.value.toLowerCase();
    renderImages(allImages.filter(img =>
        (activeTag==="all" || img.tags.includes(activeTag)) &&
        (img.file.toLowerCase().includes(q) || img.tags.some(t=>t.toLowerCase().includes(q)))
    ));
}
searchInput.oninput=filterImages;


/*********************** PREVIEW ***********************/
closeBtn.onclick=()=>preview.style.display="none";
preview.onclick=e=>{if(e.target===preview)preview.style.display="none";}
function hideLoader(){loader.style.display="none";}
document.getElementById("year").textContent=new Date().getFullYear();
