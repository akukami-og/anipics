/******** CONFIG ********/
const SUPABASE_URL="https://uekehssbugjcdjopietz.supabase.co";
const SUPABASE_KEY="sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const BUCKET="images";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const delGallery=document.getElementById("delGallery");


/******** LOAD IMAGES ********/
async function loadDeletePanel(){
  const {data,error}=await db.from("images").select("*").order("id",{ascending:false});
  if(error) return console.log(error);

  data.forEach(img=>{
    const url=`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img.file}`;
    
    let card=document.createElement("div");
    card.className="card";

    let image=document.createElement("img");
    image.src=url;

    // DELETE BUTTON
    let del=document.createElement("button");
    del.innerText="🗑 Delete";
    del.className="delete-btn";
    del.onclick=()=> deleteImage(img.file,card);

    card.append(image,del);
    delGallery.append(card);
  });
}

loadDeletePanel();


/******** DELETE FUNCTION ********/
async function deleteImage(filename,card){
  if(!confirm("Delete this image permanently?")) return;

  // 1. Delete from storage
  await db.storage.from(BUCKET).remove([filename]);

  // 2. Delete from table
  await db.from("images").delete().eq("file",filename);

  card.remove(); // remove visually
  alert("Deleted ✔");
}
