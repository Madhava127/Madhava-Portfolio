import "./style.css";

const BASE_URL = import.meta.env.BASE_URL;
const assetUrl = (path) => `${BASE_URL}${path.replace(/^\/+/, "")}`;
const profilePhoto = document.querySelector(".profile-photo");
const profileFallback = document.querySelector(".portrait-fallback");

function showProfileFallback() {
  profilePhoto.hidden = true;
  profileFallback.removeAttribute("aria-hidden");
  profileFallback.setAttribute("role", "img");
  profileFallback.setAttribute("aria-label", "Madhava profile photo unavailable");
}

profilePhoto.addEventListener("error", showProfileFallback, { once: true });

if (profilePhoto.complete && profilePhoto.naturalWidth === 0) {
  showProfileFallback();
}

document.querySelector("#current-year").textContent = String(new Date().getFullYear());

const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");

function updateThemeButton() {
  const isLight = root.dataset.theme === "light";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} theme`);
}

themeToggle.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  updateThemeButton();
  try {
    localStorage.setItem("portfolio-theme", root.dataset.theme);
  } catch {
    // Theme changes still apply for the current page when storage is disabled.
  }
});
updateThemeButton();

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

function closeMenu() {
  siteNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  menuToggle.innerHTML = '<svg aria-hidden="true"><use href="#icon-menu" /></svg>';
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", `${isOpen ? "Close" : "Open"} navigation menu`);
  siteNav.classList.toggle("is-open", isOpen);
  menuToggle.innerHTML = `<svg aria-hidden="true"><use href="#icon-${isOpen ? "close" : "menu"}" /></svg>`;
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
    closeMenu();
    menuToggle.focus();
  }
});

const revealElements = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => {
    element.classList.add("will-reveal");
    revealObserver.observe(element);
  });
}

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const currentLink = siteNav.querySelector(`a[href="#${entry.target.id}"]`);
        siteNav.querySelectorAll("a[aria-current]").forEach((link) => link.removeAttribute("aria-current"));
        currentLink?.setAttribute("aria-current", "location");
      });
    },
    { rootMargin: "-30% 0px -60% 0px" },
  );
  document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
}

const certificateDialog = document.querySelector(".certificate-dialog");
const dialogTitle = document.querySelector("#certificate-dialog-title");
const dialogImage = document.querySelector(".certificate-dialog-image");
const dialogPdf = document.querySelector(".certificate-dialog-pdf");
const dialogClose = document.querySelector(".certificate-dialog-close");

function closeCertificateDialog() {
  certificateDialog.close();
}

dialogClose.addEventListener("click", closeCertificateDialog);
certificateDialog.addEventListener("click", (event) => {
  if (event.target === certificateDialog) closeCertificateDialog();
});

async function checkPdfAvailable(path) {
  try {
    const response = await fetch(path, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

function disableCertificateLink(link, message) {
  const notice = document.createElement("span");
  notice.className = "certificate-link-unavailable";
  notice.textContent = message;
  notice.setAttribute("role", "status");
  link.replaceWith(notice);
}

function isValidCredlyUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      ["credly.com", "www.credly.com"].includes(url.hostname) &&
      /^\/badges\/[^/]+\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

async function initializeCertificate(card) {
  const preview = card.querySelector(".certificate-preview");
  const image = preview.querySelector("img");
  const viewLink = card.querySelector(".certificate-view");
  const verifyLink = card.querySelector(".verify-link");
  const pdfUrl = assetUrl(card.dataset.pdf);
  viewLink.href = pdfUrl;
  const pdfAvailability = checkPdfAvailable(pdfUrl);

  if (!isValidCredlyUrl(verifyLink.href)) {
    disableCertificateLink(verifyLink, "Verification link unavailable");
  }
  pdfAvailability.then((available) => {
    if (!available && viewLink.isConnected) {
      disableCertificateLink(viewLink, "Certificate PDF unavailable");
    }
  });

  image.addEventListener("load", () => {
    preview.classList.add("has-image");
    preview.setAttribute("role", "button");
    preview.tabIndex = 0;
    preview.setAttribute("aria-label", `Open larger preview of ${image.alt}`);

    const openPreview = () => {
      dialogTitle.textContent = image.alt.replace(" certificate preview", "");
      dialogImage.src = assetUrl(card.dataset.image);
      dialogImage.alt = image.alt;
      dialogPdf.href = pdfUrl;
      certificateDialog.showModal();
    };

    preview.addEventListener("click", openPreview);
    preview.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPreview();
      }
    });
  }, { once: true });

  image.addEventListener("error", async () => {
    const pdfAvailable = await pdfAvailability;
    if (!pdfAvailable && viewLink.isConnected) {
      disableCertificateLink(viewLink, "Certificate PDF unavailable");
    } else if (viewLink.isConnected) {
      viewLink.setAttribute("aria-label", "Open the original certificate PDF");
    }
  }, { once: true });

  image.src = assetUrl(card.dataset.image);
}

document.querySelectorAll("[data-certificate]").forEach(initializeCertificate);

const repoGrid = document.querySelector("#repo-grid");
const featuredRepositories = new Set([
  "madhava-portfolio",
  "theweddingspace",
  "vehicle-service-management-system",
]);

function addRepoStatus(message, includeProfileLink = false) {
  const status = document.createElement("p");
  status.className = "repo-status";
  status.textContent = message;

  if (includeProfileLink) {
    status.append(" ");
    const link = document.createElement("a");
    link.href = "https://github.com/Madhava127?tab=repositories";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Browse repositories on GitHub.";
    status.append(link);
  }
  repoGrid.replaceChildren(status);
}

function createRepoCard(repository) {
  const card = document.createElement("a");
  card.className = "repo-card";
  card.href = repository.html_url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.setAttribute("aria-label", `Open GitHub repository ${repository.name}`);

  const header = document.createElement("div");
  header.className = "repo-card-head";
  const title = document.createElement("h4");
  title.textContent = repository.name;
  const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrow.setAttribute("aria-hidden", "true");
  arrow.setAttribute("viewBox", "0 0 24 24");
  arrow.innerHTML = '<path d="M7 17 17 7M7 7h10v10" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" />';
  header.append(title, arrow);

  const description = document.createElement("p");
  description.textContent = repository.description || "No description provided.";

  const meta = document.createElement("div");
  meta.className = "repo-meta";
  const language = document.createElement("span");
  language.className = "repo-language";
  language.textContent = repository.language || "Language not listed";
  meta.append(language);
  const stars = document.createElement("span");
  stars.textContent = `☆ ${repository.stargazers_count}`;
  meta.append(stars);

  card.append(header, description, meta);
  return card;
}

function isValidRepository(repository) {
  if (!repository || typeof repository !== "object") return false;
  if (typeof repository.name !== "string" || !repository.name.trim()) return false;
  if (typeof repository.description !== "string" && repository.description !== null) return false;
  if (typeof repository.language !== "string" && repository.language !== null) return false;
  if (!Number.isInteger(repository.stargazers_count) || repository.stargazers_count < 0) return false;
  if (typeof repository.fork !== "boolean") return false;

  try {
    const url = new URL(repository.html_url);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
}

async function getApiError(response) {
  let apiMessage = "";
  try {
    const body = await response.clone().json();
    apiMessage = typeof body?.message === "string" ? body.message : "";
  } catch {
    // The status code and headers still provide a useful fallback.
  }

  const rateLimited = response.status === 429 ||
    (response.status === 403 && (
      response.headers.get("x-ratelimit-remaining") === "0" ||
      /rate.?limit/i.test(apiMessage)
    ));

  if (rateLimited) {
    return "GitHub’s public API rate limit has been reached.";
  }

  return `GitHub returned an error (${response.status}).`;
}

async function loadRepositories() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      "https://api.github.com/users/Madhava127/repos?sort=updated&per_page=100",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      addRepoStatus(await getApiError(response), true);
      return;
    }

    let repositories;
    try {
      repositories = await response.json();
    } catch {
      addRepoStatus("GitHub returned data that couldn’t be read.", true);
      return;
    }

    if (!Array.isArray(repositories) || !repositories.every(isValidRepository)) {
      addRepoStatus("GitHub returned an unexpected repository response.", true);
      return;
    }

    const otherRepositories = repositories
      .filter((repository) =>
        !repository.fork && !featuredRepositories.has(repository.name.toLowerCase()))
      .slice(0, 6);

    if (otherRepositories.length === 0) {
      addRepoStatus("No other public repositories are available to show yet.", true);
      return;
    }

    repoGrid.replaceChildren(...otherRepositories.map(createRepoCard));
  } catch (error) {
    const message = error.name === "AbortError"
      ? "Loading repositories timed out."
      : "Couldn’t connect to GitHub. Check your connection.";
    addRepoStatus(message, true);
  } finally {
    window.clearTimeout(timeout);
  }
}

loadRepositories();

const announcement = document.querySelector(".announcement");
let announcementTimeout;

function announce(message) {
  announcement.textContent = message;
  announcement.classList.add("is-visible");
  window.clearTimeout(announcementTimeout);
  announcementTimeout = window.setTimeout(() => {
    announcement.classList.remove("is-visible");
  }, 3500);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Try the legacy copy method for browsers or permissions without Clipboard API access.
    }
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = text;
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.left = "-9999px";
  document.body.append(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand("copy");
  temporaryInput.remove();

  if (!copied) {
    throw new Error("Clipboard copy was not available.");
  }
}

document.querySelector("[data-copy-email]").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    await copyText(button.dataset.copyEmail);
    announce("Email address copied.");
  } catch {
    announce("Couldn’t copy automatically. Email: kmadhava1590@gmail.com");
  }
});
