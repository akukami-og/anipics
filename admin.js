const URL = "https://uekehssbugjcdjopietz.supabase.co";
const KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const PASS = "@kumaad";
const BUCKET = "images";

const db = supabase.createClient(URL, KEY);

document.addEventListener("DOMContentLoaded", () => {

    const log = (t)=> document.getElementById("debug").innerHTML += t+"<br>";

    log("JS Loaded OK");

    // LOGIN
    document.getElementById("loginBtn").onclick = ()=>{
        let p = document.getElementById("pass").value;
        log("Login Clicked");

        if(p===PASS){
            log("Password correct");
            document.getElementById("login").style.display = "none";
            document.getElementById("panel").style.display = "block";
        } else {
            document.getElementById("log").innerText="❌ Wrong Password";
            log("Wrong password");
        }
    };

    // UPLOAD
    document.getElementById("uploadBtn").onclick = async ()=>{
        log("Upload Clicked");

        const file = document.getElementById("fileInput").files[0];
        const name = document.getElementById("fileName").value.trim();
        const tags = document.getElementById("tagsInput").value.split(",").map(t=>t.trim());

        const status = document.getElementById("status");

        if(!file || !name){
            status.innerText="⚠ Enter name & choose file";
            return;
        }

        status.innerText="Uploading...";
        log("Uploading to bucket...");

        let up = await db.storage.from(BUCKET).upload(name,file,{upsert:true});
        if(up.error){
            status.innerText="❌ Upload Failed";
            log(up.error.message);
            return;
        }

        log("Saving DB...");
        let row = await db.from("images").insert([{file:name,tags}]);

        if(row.error){
            status.innerText="❌ DB Insert Failed";
            log(row.error.message);
            return;
        }

        status.innerText="✅ Upload Success!";
        log("Done!");
    };

});
