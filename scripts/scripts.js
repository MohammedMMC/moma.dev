// Links Hover
document.querySelectorAll("section#main .me .links a").forEach((link) => {
  link.addEventListener("mouseover", () => {
    link.style.width = (link.querySelector("span").offsetWidth + 7 + 39 + 5) + "px";
  });
  link.addEventListener("mouseout", () => {
    link.style.width = "39px";
  });
});