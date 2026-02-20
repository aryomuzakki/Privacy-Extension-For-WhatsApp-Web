/* Privacy Extension for WhatsApp(TM) Web                       */
/* Copyright (c) 2024 Lukas Lenhardt - lukaslen.com             */
/* Released under the MIT license, see LICENSE file for details */

// Remove this upon Chrome supporting the browser namespace
if (typeof browser == "undefined") {
  // Redefine browser namespace for Chrome for interoperability with Firefox
  globalThis.browser = chrome;
}

const styleIdentifier = "pfwa";
const SETTINGS_IDENTIFIER = "settings";

let version = browser.runtime.getManifest().version;
document.getElementById('version').innerText = version;

document.querySelectorAll('[data-locale]').forEach(e => {
  e.innerText = browser.i18n.getMessage(e.dataset.locale);
});
document.querySelectorAll('[data-localetitle]').forEach(e => {
  e.title = browser.i18n.getMessage(e.dataset.localetitle);
});

// toast utility
const showToast = (message, duration = 3000, persistent = false) => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
      <p class="msg">${message}</p>
      ${persistent ? `<button class="toast-close-btn">×</button>` : ""}
    `;
  container.appendChild(toast);

  const removeToast = (toast) => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }

  setTimeout(() => toast.classList.add('show'), 10);

  if (!persistent) {
    setTimeout(() => {
      removeToast(toast);
    }, duration < 0 ? 3000 : duration);
  } else {
    toast.querySelector(".toast-close-btn").addEventListener("click", () => {
      removeToast(toast);
    })
  }
}

// detect outside click utility
const onClickOutside = (targetElement, callback, once = true) => {
  function handler(ev) {
    if (!ev.composedPath().includes(targetElement)) {
      callback(ev);
      if (once) {
        document.removeEventListener("click", handler);
      }
    }
  }

  setTimeout(() => {
    document.addEventListener("click", handler);
  }, 0);

  return () => document.removeEventListener("click", handler);
}


// get current setting
const getCurrentSettings = async (settingsIdentifier = SETTINGS_IDENTIFIER) => {
  const result = await browser.storage.sync.get([settingsIdentifier]);
  if (!result.hasOwnProperty(settingsIdentifier)) {
    browser.runtime.reload();
    return;
  }
  return result;
};

// set input value using saved value
const setInputValue = (input, settings) => {
  const varName = input.dataset.varName;
  input.value = parseInt(
    varName === "itBlur"
      ? settings?.blurOnIdle?.idleTimeout || 15
      : settings.varStyles[varName]
  );
};


// Track switch changes and save settings
async function saveSettings(ev) {
  let id = ev.currentTarget.dataset.style;
  let checked = ev.currentTarget.checked;

  const result = await getCurrentSettings();
  if (id == "on") {
    result.settings.on = checked;
  } else if (id === "blurOnIdle") {
    result.settings.blurOnIdle.isEnabled = checked;
  } else {
    result.settings.styles[id] = checked;
  }
  browser.storage.sync.set(result);
}

const switches = document.querySelectorAll("input[type='checkbox']");

switches.forEach((checkbox) => {
  checkbox.addEventListener('change', saveSettings);
});


// toggle open/close blur amount settings
let removeOutsideListener = null;

const togglePopup = (ev) => {
  const currentSettingElement = ev.currentTarget.parentNode.querySelector(".popover");
  const trigger = ev.currentTarget;

  const closeSetting = () => {
    trigger.classList.remove("active");
    currentSettingElement.setAttribute("aria-hidden", "true");
    currentSettingElement.style.maxHeight = null;
  }

  if (!trigger.classList.contains("active")) {
    trigger.classList.add("active");
    currentSettingElement.removeAttribute("aria-hidden");
    currentSettingElement.style.maxHeight = currentSettingElement.scrollHeight + "px";
    removeOutsideListener = onClickOutside(ev.currentTarget.parentNode.querySelector(".popover"), (ev) => {
      console.log('outside click')
      closeSetting();
    });
  } else {
    closeSetting();
    removeOutsideListener();
  }
}

const cancelAdvancedSetting = async (ev) => {
  const popoverElement = ev.currentTarget.parentNode;

  const result = await getCurrentSettings();
  popoverElement.querySelectorAll("input[type='number']").forEach(input => {
    setInputValue(input, result.settings);
  });

  popoverElement.parentNode.querySelector(".trigger-btn.active")?.classList.remove("active");
  popoverElement.setAttribute("aria-hidden", "true");
  popoverElement.style.maxHeight = null;
  removeOutsideListener?.();
}

const triggerButtons = document.querySelectorAll(".trigger-btn");
triggerButtons.forEach((triggerBtn) => {
  triggerBtn.addEventListener("click", togglePopup);
})

const cancelButtons = document.querySelectorAll(".cancel-btn");
cancelButtons.forEach((cancelBtn) => {
  cancelBtn.addEventListener("click", cancelAdvancedSetting);
});


// track form save/submit for advanced settings (variable style settings)
async function saveFormSettings(ev) {
  ev.preventDefault();
  const [key, val] = Object.entries(Object.fromEntries(new FormData(ev.target)))[0];

  const result = await getCurrentSettings();
  if (key === "itBlur") {
    result.settings.blurOnIdle.idleTimeout = val;
  } else {
    result.settings.varStyles[key] = val + "px";
  }
  browser.storage.sync.set(result);

  showToast(browser.i18n.getMessage('toastSaved'));
}

const forms = document.querySelectorAll("form.var-style");

forms.forEach((form) => {
  form.addEventListener("submit", saveFormSettings);
})


// Load settings and update switches
const init = async () => {
  const result = await getCurrentSettings();

  switches.forEach((checkbox) => {
    let id = checkbox.dataset.style;
    if (id == "on") {
      checkbox.checked = result.settings.on;
    } else if (id === "blurOnIdle") {
      checkbox.checked = result.settings?.blurOnIdle?.isEnabled;
    } else {
      checkbox.checked = result.settings.styles[id];
    }
  });

  // set variable input value
  forms.forEach((form) => {
    const numInput = form.querySelector(`input[type="number"]`)
    setInputValue(numInput, result.settings);
  })
}

init();


// theme detector and changer

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
  const curTheme = localStorage.getItem("theme");
  if (curTheme === "light") {

    setCurrentTheme({ matches: true });
    themeTogglerBtn.dataset.theme = "dark";
    localStorage.setItem("theme", "dark");

  } else if (curTheme === "dark") {

    setCurrentTheme(matchMedia("(prefers-color-scheme: dark)"));
    themeTogglerBtn.dataset.theme = "system-default";
    localStorage.setItem("theme", "system-default");
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setCurrentTheme);

  } else if (curTheme === "system-default") {

    matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", setCurrentTheme);
    setCurrentTheme({ matches: false });
    themeTogglerBtn.dataset.theme = "light";
    localStorage.setItem("theme", "light");

  }
}

themeTogglerBtn.addEventListener("click", toggleCurrentTheme);

// first load check
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {

  themeTogglerBtn.dataset.theme = savedTheme;

  if (savedTheme === "system-default") {
    setCurrentTheme(matchMedia("(prefers-color-scheme: dark)"));
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", setCurrentTheme);
  } else {
    setCurrentTheme({ matches: savedTheme === "dark" });
  }

} else {

  const curTheme = setCurrentTheme(matchMedia("(prefers-color-scheme: dark)"));
  localStorage.setItem("theme", curTheme);
  themeTogglerBtn.dataset.theme = curTheme;

}

/*
// legacy code, keeping it for future reference
// message loading not implemented currently

//load message
xmlhttp=new XMLHttpRequest();
xmlhttp.onreadystatechange=function(){
  if (xmlhttp.readyState==4 && xmlhttp.status==200){
    let response = JSON.parse(xmlhttp.responseText);
    if(response["*"] && response["*"]["min"] <= version && response["*"]["max"] >= version)
      response = response["*"]["msg"];
    else
      response = response[version] ? response[version] : '';

    if(response != "" && data.currentPopupMessage != response){
      mainContent.style.display = "none";
      popupMessage.innerText = response;
      popupMessage.innerHTML += "<br><a href=\"#\" id=\"popupMessageButton\">Close message</a>";

      let popupMessageButton = document.getElementById('popupMessageButton');
      popupMessageButton.addEventListener('click', function() {
        chrome.storage.sync.set({currentPopupMessage: response});
        popupMessage.innerHTML = "";
        mainContent.style.display = "initial";
      });
    }
  }
}
xmlhttp.open("GET", "https://lukaslen.com/message/pfwa.json", true);
xmlhttp.send();
*/
