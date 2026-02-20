// theme detector and changer
const STORAGE_KEY = "pfwa-theme";

// listener and first check
const setCurrentTheme = (ev) => {
  const theme = ev?.matches ? "dark" : "light";
  document.body.dataset.theme = theme;
  return theme;
}

const themeTogglerBtn = document.querySelector(".theme-toggle");

// theme toggle
const toggleCurrentTheme = (ev) => {
  ev.preventDefault();
  const curTheme = localStorage.getItem(STORAGE_KEY);
  if (curTheme === "light") {
    setCurrentTheme({ matches: true });
    themeTogglerBtn.dataset.theme = "dark";
    localStorage.setItem(STORAGE_KEY, "dark");
  } else if (curTheme === "dark") {
    setCurrentTheme(window.matchMedia("(prefers-color-scheme: dark)"));
    themeTogglerBtn.dataset.theme = "system-default";
    localStorage.setItem(STORAGE_KEY, "system-default");
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setCurrentTheme);
  } else if (curTheme === "system-default") {
    window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", setCurrentTheme);
    setCurrentTheme({ matches: false });
    themeTogglerBtn.dataset.theme = "light";
    localStorage.setItem(STORAGE_KEY, "light");
  }
}

themeTogglerBtn.addEventListener("click", toggleCurrentTheme);

// first load check
const savedTheme = localStorage.getItem(STORAGE_KEY);
if (savedTheme) {
  themeTogglerBtn.dataset.theme = savedTheme;
  if (savedTheme === "system-default") {
    setCurrentTheme(window.matchMedia("(prefers-color-scheme: dark)"));
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setCurrentTheme);
  } else {
    setCurrentTheme({ matches: savedTheme === "dark" });
  }
} else {
  const curTheme = setCurrentTheme(window.matchMedia("(prefers-color-scheme: dark)"));
  localStorage.setItem(STORAGE_KEY, curTheme);
  themeTogglerBtn.dataset.theme = curTheme;
}