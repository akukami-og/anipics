/*********** CONFIG ***********/
const SUPABASE_URL = "https://uekehssbugjcdjopietz.supabase.co";
const SUPABASE_KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const BUCKET = "images";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const list = document.getElementById("list");

/*********** LOAD IMAGES ***********/
loadData();
async function loadData(){
    const {data,error} = await db.from("images").select("*").order("id",{ascending:false});
    if(error) return alert("Error loading");

    list.innerHTML="";
    data.forEach(img=>{
        const url=`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${img.file}`;

        const row=document.createElement("div");
        row.className="item";
        row.innerHTML=`
            <img src="${url}">
            <div class="file">
                <b>${img.file}</b><br>
                <span class="tag">${(Array.isArray(img.tags)?img.tags.join(", "):"")}</span>
            </div>
            <button onclick="del('${img.file}')">Delete</button>
        `;
        list.append(row);
    });
}

/*********** DELETE ***********/
async function del(filename){
    await db.storage.from(BUCKET).remove([filename]); // remove file
    await db.from("images").delete().eq("file",filename); // remove row
    alert("Deleted: "+filename);
    loadData(); // refresh
}
