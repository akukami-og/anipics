const gallery = document.getElementById("gallery");

fetch("images.json")
  .then(res => res.json())
  .then(images => {
    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "card";

      const image = document.createElement("img");
      image.src = "images/" + img;

      // LIKE DATA
      let liked = localStorage.getItem(img + "_liked") === "true";
      let count = localStorage.getItem(img + "_count") || 0;

      const likeBtn = document.createElement("button");
      likeBtn.innerHTML = liked
        ? `❤️ Liked (<span>${count}</span>)`
        : `🤍 Like (<span>${count}</span>)`;

      likeBtn.onclick = () => {
        if (liked) return; // stop multiple likes

        liked = true;
        count++;

        localStorage.setItem(img + "_liked", "true");
        localStorage.setItem(img + "_count", count);

        likeBtn.innerHTML = `❤️ Liked (<span>${count}</span>)`;
      };

      const download = document.createElement("a");
      download.href = image.src;
      download.download = "";
      download.innerText = "⬇ Download";

      card.append(image, likeBtn, download);
      gallery.appendChild(card);
    });
  });

// HIDE LOADER
window.onload = () => {
  document.getElementById("loader").style.display = "none";
};
