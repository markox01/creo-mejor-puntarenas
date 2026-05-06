const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("open");
  });
}

const header = document.querySelector(".site-header");
const snapSections = [
  ...document.querySelectorAll("main > section"),
  ...document.querySelectorAll("body > footer")
];
let isSectionScrolling = false;
let snapTimeoutId = 0;
let lastScrollY = window.scrollY;
let lastScrollDirection = 0;

const canUseSectionScroll = () =>
  window.innerWidth > 760 &&
  window.innerHeight > 820 &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getHeaderOffset = () => header?.offsetHeight || 0;

const syncActiveNavLink = () => {
  if (!navLinks.length) {
    return;
  }

  const marker = window.scrollY + getHeaderOffset() + window.innerHeight * 0.3;
  let activeId = "";

  snapSections.forEach((section) => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (marker >= top && marker < bottom && section.id) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
};

const getCurrentSectionIndex = () => {
  const marker = window.scrollY + getHeaderOffset() + window.innerHeight * 0.25;

  return snapSections.findIndex((section, index) => {
    const top = section.offsetTop;
    const nextTop = snapSections[index + 1]?.offsetTop ?? Number.POSITIVE_INFINITY;
    return marker >= top && marker < nextTop;
  });
};

const getSectionProgress = (index) => {
  const section = snapSections[index];
  const nextSection = snapSections[index + 1];

  if (!section || !nextSection) {
    return 0;
  }

  const start = Math.max(0, section.offsetTop - getHeaderOffset());
  const end = Math.max(start + 1, nextSection.offsetTop - getHeaderOffset());
  const progress = (window.scrollY - start) / (end - start);

  return Math.max(0, Math.min(1, progress));
};

const scrollToSection = (index) => {
  const target = snapSections[index];
  if (!target) {
    return;
  }

  isSectionScrolling = true;
  window.scrollTo({
    top: Math.max(0, target.offsetTop - getHeaderOffset()),
    behavior: "smooth"
  });

  window.setTimeout(() => {
    isSectionScrolling = false;
  }, 700);
};

const queueSectionSnap = () => {
  window.clearTimeout(snapTimeoutId);
  snapTimeoutId = window.setTimeout(() => {
    if (!canUseSectionScroll() || isSectionScrolling || lastScrollDirection <= 0) {
      return;
    }

    const currentIndex = Math.max(0, getCurrentSectionIndex());
    const progress = getSectionProgress(currentIndex);
    const nextIndex = Math.min(snapSections.length - 1, currentIndex + 1);

    if (progress >= 0.8 && nextIndex !== currentIndex) {
      scrollToSection(nextIndex);
    }
  }, 140);
};

window.addEventListener("scroll", () => {
  if (!canUseSectionScroll() || isSectionScrolling) {
    lastScrollY = window.scrollY;
    syncActiveNavLink();
    return;
  }

  const delta = window.scrollY - lastScrollY;
  lastScrollDirection = delta > 0 ? 1 : delta < 0 ? -1 : lastScrollDirection;
  lastScrollY = window.scrollY;

  syncActiveNavLink();
  queueSectionSnap();
}, { passive: true });

syncActiveNavLink();

window.addEventListener("keydown", (event) => {
  if (!canUseSectionScroll() || isSectionScrolling) {
    return;
  }

  const activeTag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag || "")) {
    return;
  }

  const nextKeys = ["ArrowDown", "PageDown", " "];
  const prevKeys = ["ArrowUp", "PageUp"];

  let direction = 0;
  if (nextKeys.includes(event.key)) {
    direction = 1;
  } else if (prevKeys.includes(event.key)) {
    direction = -1;
  }

  if (!direction) {
    return;
  }

  const currentIndex = Math.max(0, getCurrentSectionIndex());
  const progress = getSectionProgress(currentIndex);
  const shouldAdvance = direction < 0 || progress >= 0.8;
  const nextIndex = shouldAdvance
    ? Math.min(snapSections.length - 1, Math.max(0, currentIndex + direction))
    : currentIndex;

  if (nextIndex !== currentIndex) {
    event.preventDefault();
    scrollToSection(nextIndex);
  }
});

const searchInput = document.querySelector("#proposal-search");
const filterButtons = document.querySelectorAll(".filter-chip");
const proposalCards = document.querySelectorAll(".proposal-card");
let activeFilter = "all";

const visitCounter = document.querySelector("#visit-counter");

if (visitCounter) {
  const storageKey = "site-visit-count";
  const currentValue = Number.parseInt(window.localStorage.getItem(storageKey) || "0", 10);
  const nextValue = Number.isNaN(currentValue) ? 1 : currentValue + 1;

  window.localStorage.setItem(storageKey, String(nextValue));
  visitCounter.textContent = nextValue.toLocaleString("es-CR");
}

const filterProposals = () => {
  const query = (searchInput?.value || "").trim().toLowerCase();

  proposalCards.forEach((card) => {
    const category = card.dataset.category || "";
    const keywords = card.dataset.keywords || "";
    const matchesFilter = activeFilter === "all" || activeFilter === category;
    const matchesQuery = !query || keywords.includes(query) || card.textContent.toLowerCase().includes(query);
    card.hidden = !(matchesFilter && matchesQuery);
  });
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((chip) => {
      const isActive = chip === button;
      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    filterProposals();
  });
});

searchInput?.addEventListener("input", filterProposals);

const form = document.querySelector("#volunteer-form");
const statusNode = document.querySelector("#form-status");
const chatbotRoot = document.querySelector("[data-chatbot]");
const chatbotToggle = document.querySelector(".chatbot-toggle");
const chatbotPanel = document.querySelector(".chatbot-panel");
const chatbotClose = document.querySelector(".chatbot-close");
const chatbotForm = document.querySelector("#chatbot-form");
const chatbotInput = document.querySelector("#chatbot-input");
const chatbotMessages = document.querySelector("#chatbot-messages");

const validators = {
  name: (value) => value.trim().length >= 4,
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  district: (value) => value.trim().length >= 2,
  interest: (value) => value.trim().length > 0,
  message: (value) => value.trim().length >= 15
};

const setFieldState = (field, isValid) => {
  field.classList.toggle("error", !isValid);
  field.setAttribute("aria-invalid", String(!isValid));
};

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  if (String(formData.get("company") || "").trim()) {
    statusNode.textContent = "No se pudo procesar el formulario.";
    return;
  }

  let allValid = true;

  Object.entries(validators).forEach(([name, validate]) => {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLElement)) {
      return;
    }

    const value = "value" in field ? String(field.value || "") : "";
    const isValid = validate(value);
    setFieldState(field, isValid);
    if (!isValid) {
      allValid = false;
    }
  });

  if (!allValid) {
    statusNode.textContent = "Revisa los campos marcados para continuar.";
    return;
  }

  statusNode.textContent = "Formulario listo para integrarse con tu CRM o CMS. Los datos pasaron la validación.";
  form.reset();
});

const appendChatMessage = (role, text) => {
  if (!chatbotMessages) {
    return;
  }

  const item = document.createElement("article");
  item.className = `chatbot-message ${role}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  item.appendChild(paragraph);
  chatbotMessages.appendChild(item);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
};

const setChatbotOpen = (isOpen) => {
  if (!chatbotPanel || !chatbotToggle) {
    return;
  }

  chatbotPanel.hidden = !isOpen;
  chatbotToggle.setAttribute("aria-expanded", String(isOpen));
};

chatbotToggle?.addEventListener("click", () => {
  const isOpen = chatbotToggle.getAttribute("aria-expanded") === "true";
  setChatbotOpen(!isOpen);
});

chatbotClose?.addEventListener("click", () => {
  setChatbotOpen(false);
});

chatbotForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!chatbotInput) {
    return;
  }

  const message = chatbotInput.value.trim();
  if (!message) {
    return;
  }

  appendChatMessage("user", message);
  chatbotInput.value = "";
  chatbotInput.disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
      appendChatMessage("bot", data?.error || "No pude responder en este momento.");
    } else {
      appendChatMessage("bot", data.reply || "No pude responder en este momento.");
    }
  } catch (error) {
    appendChatMessage("bot", "No fue posible conectar con el asistente ahora mismo.");
  } finally {
    chatbotInput.disabled = false;
    chatbotInput.focus();
  }
});
