// Links Hover
document.querySelectorAll("section#main .me .links a").forEach((link) => {
  link.addEventListener("mouseover", () => {
    link.style.width = (link.querySelector("span").offsetWidth + 7 + 39 + 5) + "px";
  });
  link.addEventListener("focus", () => {
    link.style.width = (link.querySelector("span").offsetWidth + 7 + 39 + 5) + "px";
  });
  link.addEventListener("mouseout", () => {
    link.style.width = "39px";
  });
  link.addEventListener("blur", () => {
    link.style.width = "39px";
  });
});

const secButtonsPage = document.getElementById("sec-buttons");
const footer = document.querySelector("footer");

secButtonsPage.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    const pageToShow = button.id;

    changePage(secButtonsPage, false);
    setTimeout(() => {
      footer.style.display = "flex";
    }, 500);

    document.querySelectorAll(".page").forEach((page) => {
      if (page.getAttribute("--data-ps") == pageToShow) {
        page.classList.add("active");
        changePage(page, true, { w: true });
      } else {
        page.classList.remove("active");
        changePage(page, false);
      }
    });
  });
});

document.querySelectorAll(".page-back").forEach((backBtn) => {
  backBtn.addEventListener("click", () => {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
      changePage(page, false);
    });

    changePage(secButtonsPage, true, { d: "grid", w: true });
    footer.style.display = "none";
  });
});

/**
 * @param {HTMLElement} page 
 * @param {boolean} status 
 * @param {w} status 
 */
function changePage(page, status, dataBE) {
  let data = { d: dataBE?.d, w: dataBE?.w || false };

  if (status) {
    setTimeout(() => {
      page.style.display = data.d ? data.d : "block";
      page.style.transform = "scale(0.3)";
      page.style.opacity = "0";
      page.style.transition = "all 0.5s ease-in";

      setTimeout(() => {
        page.style.transform = "scale(1)";
        page.style.opacity = "1";
      }, 1);
    }, data.w ? 500 : 0);

  } else {
    setTimeout(() => {
      page.style.transition = "all 0.5s ease-out";

      setTimeout(() => {
        page.style.transform = "scale(0)";
        page.style.opacity = "0";
      }, 1);

      setTimeout(() => {
        page.style.display = data.d ? data.d : "none";
      }, 490);
    }, data.w ? 500 : 0);

  }
}