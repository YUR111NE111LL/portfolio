const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  const closeMenu = () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
  });
}

if (navLinks) {
  const navPageLinks = [...navLinks.querySelectorAll("a")];

  const setActiveNavLink = () => {
    navPageLinks.forEach((link) => {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    });

    const pageName = window.location.pathname.split("/").pop().toLowerCase() || "index.html";
    let activeLink;

    if (pageName === "projects.html") {
      activeLink = navPageLinks.find((link) => link.getAttribute("href").includes("projects.html"));
    } else if (pageName === "skills.html") {
      activeLink = navPageLinks.find((link) => link.getAttribute("href").includes("skills.html"));
    } else {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#contact") {
        activeLink = navPageLinks.find((link) => link.getAttribute("href").endsWith("#contact"));
      } else {
        activeLink = navPageLinks.find((link) => link.getAttribute("href").endsWith("#about"));
      }
    }

    if (activeLink) {
      activeLink.classList.add("active");
      activeLink.setAttribute("aria-current", "page");
    }
  };

  navPageLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const href = link.getAttribute("href");
      if (href.includes("projects.html")) {
        return;
      }
      if (href.includes("skills.html")) {
        return;
      }
      window.setTimeout(setActiveNavLink, 0);
    });
  });

  window.addEventListener("hashchange", setActiveNavLink);
  setActiveNavLink();
}

const heroTypewriter = document.querySelector(".hero-typewriter");

if (heroTypewriter) {
  const heroTitle = heroTypewriter.getAttribute("aria-label");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    heroTypewriter.textContent = heroTitle;
  } else {
    let characterIndex = 0;
    let isDeleting = false;

    const typeHeroTitle = () => {
      if (!isDeleting && characterIndex <= heroTitle.length) {
        heroTypewriter.textContent = heroTitle.slice(0, characterIndex);
        characterIndex += 1;

        if (characterIndex > heroTitle.length) {
          isDeleting = true;
          window.setTimeout(typeHeroTitle, 2200);
          return;
        }

        window.setTimeout(typeHeroTitle, 55);
        return;
      }

      if (isDeleting && characterIndex >= 0) {
        heroTypewriter.textContent = heroTitle.slice(0, characterIndex);
        characterIndex -= 1;

        if (characterIndex < 0) {
          isDeleting = false;
          characterIndex = 0;
          window.setTimeout(typeHeroTitle, 700);
          return;
        }

        window.setTimeout(typeHeroTitle, 28);
      }
    };

    typeHeroTitle();
  }
}

const interactiveHeadings = document.querySelectorAll(".interactive-heading");

if (interactiveHeadings.length > 0 && "IntersectionObserver" in window) {
  interactiveHeadings.forEach((heading) => heading.classList.add("reveal-ready"));

  const headingObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  interactiveHeadings.forEach((heading) => {
    headingObserver.observe(heading);

    heading.addEventListener("pointermove", (event) => {
      const bounds = heading.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      heading.style.setProperty("--heading-rotate-x", `${(-y * 3).toFixed(2)}deg`);
      heading.style.setProperty("--heading-rotate-y", `${(x * 4).toFixed(2)}deg`);
    });

    heading.addEventListener("pointerleave", () => {
      heading.style.setProperty("--heading-rotate-x", "0deg");
      heading.style.setProperty("--heading-rotate-y", "0deg");
    });
  });
}

const sectionTypewriters = document.querySelectorAll(".section-typewriter");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

sectionTypewriters.forEach((typewriter) => {
  const text = typewriter.getAttribute("aria-label");

  if (prefersReducedMotion) {
    typewriter.textContent = text;
    return;
  }

  let characterIndex = 0;
  let isDeleting = false;

  const typeSectionHeading = () => {
    if (!isDeleting) {
      typewriter.textContent = text.slice(0, characterIndex);
      characterIndex += 1;

      if (characterIndex > text.length) {
        isDeleting = true;
        window.setTimeout(typeSectionHeading, 2400);
        return;
      }

      window.setTimeout(typeSectionHeading, 38);
      return;
    }

    typewriter.textContent = text.slice(0, characterIndex);
    characterIndex -= 1;

    if (characterIndex < 0) {
      isDeleting = false;
      characterIndex = 0;
      window.setTimeout(typeSectionHeading, 700);
      return;
    }

    window.setTimeout(typeSectionHeading, 22);
  };

  typeSectionHeading();
});

const lightbox = document.getElementById("imageLightbox");

if (lightbox) {
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const previousButton = lightbox.querySelector(".lightbox-prev");
  const nextButton = lightbox.querySelector(".lightbox-next");
  const galleryImages = [...document.querySelectorAll(".project-showcase img")];
  let currentIndex = 0;

  const showImage = (index) => {
    currentIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[currentIndex];
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = image.alt;
  };

  galleryImages.forEach((image, index) => {
    image.closest("figure").tabIndex = 0;
    image.closest("figure").setAttribute("role", "button");
    image.closest("figure").setAttribute("aria-label", `Open: ${image.alt}`);

    const openImage = () => {
      showImage(index);
      lightbox.showModal();
    };

    image.closest("figure").addEventListener("click", openImage);
    image.closest("figure").addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImage();
      }
    });
  });

  closeButton.addEventListener("click", () => lightbox.close());
  previousButton.addEventListener("click", () => showImage(currentIndex - 1));
  nextButton.addEventListener("click", () => showImage(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showImage(currentIndex - 1);
    if (event.key === "ArrowRight") showImage(currentIndex + 1);
  });
}
