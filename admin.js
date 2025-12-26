// ADMIN.JS

const URL = "https://uekehssbugjcdjopietz.supabase.co";
const KEY = "sb_publishable_DhiBec9_K-jgfAuaXLOIJw_7TKC7BBU";
const PASS = "@kumaad";
const BUCKET = "images";

const db = supabase.createClient(URL, KEY);

function log(text) {
  const d = document.getElementById("debug");
  if (d) d.innerText += text + "\n";
}

document.addEventListener("DOMContentLoaded", () => {
  log("DOM Loaded");

  const loginBtn = document.getElementById("loginBtn");
  const uploadBtn = document.getElementById("uploadBtn");

  if (!loginBtn || !uploadBtn) {
    log("Buttons not found!");
    return;
  }

  loginBtn.onclick = () => {
    log("Login pressed");
    const pass = document.getElementById("pass").value;
    if (pass === PASS) {
      document.getElementById("login").style.display = "none";
      document.getElementById("panel").style.display = "block";
      log("Login success");
    } else {
      document.getElementById("log").innerText = "❌ Wrong Password";
      log("Wrong password");
    }
  };

  uploadBtn.onclick = async () => {
    log("Upload pressed");

    const file = document.getElementById("fileInput").files[0];
    const name = document.getElementById("fileName").value.trim();
    const tags = document
      .getElementById("tagsInput")
      .value.split(",")
      .map((x) => x.trim())
      .filter((v) => v);

    const status = document.getElementById("status");

    if (!file || !name) {
      status.innerText = "⚠ Enter filename & choose image";
      return;
    }

    status.innerText = "Uploading...";
    log("Uploading to Supabase Storage");

    const up = await db.storage.from(BUCKET).upload(name, file, {
      upsert: true,
    });

    if (up.error) {
      status.innerText = "❌ Upload failed";
      log("Upload Error: " + up.error.message);
      return;
    }

    status.innerText = "Saving to DB...";
    log("Uploading to DB");

    const insert = await db.from("images").insert([{ file: name, tags }]);
    if (insert.error) {
      status.innerText = "❌ DB insert failed";
      log("DB Error: " + insert.error.message);
      return;
    }

    status.innerText = "✅ Upload complete!";
    log("Upload complete!");
  };
});
