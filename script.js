const gallery = document.getElementById("gallery");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");
const closeBtn = document.getElementById("close");

fetch("images.json")
  .then(res => res.json())
  .then(images => {
    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "card";

      const image = document.createElement("img");
      image.src = "images/" + img;

      // 🔍 FULL SCREEN PREVIEW
      image.onclick = () => {
        preview.style.display = "flex";
        previewImg.src = image.src;
      };

      // ❤️ LIKE DATA (ONE TIME PER DEVICE)
      let liked = localStorage.getItem(img + "_liked") === "true";
      let count = localStorage.getItem(img + "_count") || 0;

      const likeBtn = document.createElement("button");
      likeBtn.innerHTML = liked
        ? `❤️ Liked (<span>${count}</span>)`
        : `🤍 Like (<span>${count}</span>)`;

      likeBtn.onclick = () => {
        if (liked) return;

        liked = true;
        count++;

        localStorage.setItem(img + "_liked", "true");
        localStorage.setItem(img + "_count", count);

        likeBtn.innerHTML = `❤️ Liked (<span>${count}</span>)`;
      };

      // ⬇ DOWNLOAD
      const download = document.createElement("a");
      download.href = image.src;
      download.download = "";
      download.innerText = "⬇ Download";

      card.append(image, likeBtn, download);
      gallery.appendChild(card);
    });
  });

// ❌ CLOSE FULL SCREEN
closeBtn.onclick = () => {
  preview.style.display = "none";
};

preview.onclick = e => {
  if (e.target === preview) {
    preview.style.display = "none";
  }
};

// 🌀 HIDE LOADER
window.onload = () => {
  document.getElementById("loader").style.display = "none";
};
