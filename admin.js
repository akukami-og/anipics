/* Debug logger */
function log(x){ document.getElementById("debug").textContent += x+"\n"; }

/* Supabase */
const URL="https://uekehssbugjcdjopietz.supabase.co";
const KEY="sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const PASS="@kumaad";
const BUCKET="images";

const db=supabase.createClient(URL,KEY);
log("Supabase client loaded");

/* LOGIN */
document.getElementById("loginBtn").onclick=()=>{
    log("Login clicked");
    const p=document.getElementById("pass").value;
    if(p===PASS){
        log("Login success");
        document.getElementById("login").style.display="none";
        document.getElementById("panel").style.display="block";
    } else {
        document.getElementById("log").innerText="❌ Wrong Password";
        log("Wrong password");
    }
};

/* UPLOAD */
document.getElementById("uploadBtn").onclick=async()=>{
    log("Upload clicked");

    const file=document.getElementById("fileInput").files[0];
    const name=document.getElementById("fileName").value.trim();
    const tags=document.getElementById("tagsInput").value.split(",").map(t=>t.trim());

    const status=document.getElementById("status");

    if(!file || !name){
        status.textContent="⚠ Select image & filename";
        log("Upload failed - no input");
        return;
    }

    status.textContent="Uploading...";
    log("Uploading to storage...");

    const up=await db.storage.from(BUCKET).upload(name,file,{upsert:true});
    if(up.error){ status.textContent="❌ Upload Failed"; log(JSON.stringify(up.error)); return; }

    log("Storage OK, saving DB...");

    const row=await db.from("images").insert([{file:name,tags:tags}]);
    if(row.error){ status.textContent="❌ DB Insert Error"; log(JSON.stringify(row.error)); return; }

    status.textContent="✅ Upload Success!";
    log("Upload complete");
};
