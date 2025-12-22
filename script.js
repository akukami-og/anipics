const gallery = document.getElementById("gallery");

fetch("images.json")
  .then(res => res.json())
  .then(images => {
    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "card";

      const image = document.createElement("img");
      image.src = "images/" + img;

      let count = localStorage.getItem(img) || 0;
      const likeBtn = document.createElement("button");
      likeBtn.innerHTML = `❤️ <span>${count}</span>`;

      likeBtn.onclick = () => {
        count++;
        localStorage.setItem(img, count);
        likeBtn.querySelector("span").innerText = count;
      };

      const download = document.createElement("a");
      download.href = image.src;
      download.download = "";
      download.innerText = "⬇ Download";

      card.append(image, likeBtn, download);
      gallery.appendChild(card);
    });
  });

window.onload = () => {
  document.getElementById("loader").style.display = "none";
};
