/* Privacy Extension for WhatsApp(TM) Web                       */
/* Copyright (c) 2024 Lukas Lenhardt - lukaslen.com             */
/* Released under the MIT license, see LICENSE file for details */

// Remove this upon Chrome supporting the browser namespace
if (typeof browser == "undefined") {
  // Redefine browser namespace for Chrome for interoperability with Firefox
  globalThis.browser = chrome;
}

const styleIdentifier = "pfwa";
const settingsIdentifier = "settings";

let version = browser.runtime.getManifest().version;
document.getElementById('version').innerText = version;

document.querySelectorAll('[data-locale]').forEach(e => {
  e.innerText = browser.i18n.getMessage(e.dataset.locale);
});
document.querySelectorAll('[data-localetitle]').forEach(e => {
  e.title = browser.i18n.getMessage(e.dataset.localetitle);
});

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


let switches = document.querySelectorAll("input[type='checkbox']");

// Track switch changes and save settings
switches.forEach((checkbox) => {
  checkbox.addEventListener('change', saveSettings);
});
function saveSettings() {
  let id = this.dataset.style;
  let checked = this.checked;

  browser.storage.sync.get([settingsIdentifier]).then((result) => {
    if (!result.hasOwnProperty(settingsIdentifier)) {
      browser.runtime.reload();
      return;
    }
    if (id == "on") {
      result.settings.on = checked;
    } else if (id === "blurOnIdle") {
      result.settings.blurOnIdle.isEnabled = checked;
    } else {
      result.settings.styles[id] = checked;
    }
    browser.storage.sync.set(result);
  });
}

// toggle open/close blur amount settings
const showBlurSettings = (ev) => {
  // if current target is currently active button, only close currently active collapsible
  if (ev.currentTarget.classList.contains("active")) {
    ev.currentTarget.classList.remove("active");
    ev.currentTarget.parentNode.querySelector(".collapsible").classList.remove("show");
  } else {
    console.log("not contains active");
    // close other
    ev.currentTarget.parentNode.parentNode.querySelector(".reveal-btn.active")?.classList.remove("active");
    ev.currentTarget.parentNode.parentNode.querySelector(".collapsible.show")?.classList.remove("show");

    // and open collapsible in current target 
    ev.currentTarget.classList.add("active");
    ev.currentTarget.parentNode.querySelector(".collapsible").classList.add("show");
  }
}
const revealButtons = document.querySelectorAll(".reveal-btn");
revealButtons.forEach((revealBtn) => {
  revealBtn.addEventListener("click", showBlurSettings)
})

const cancelButtons = document.querySelectorAll(".cancel-btn");
cancelButtons.forEach((cancelBtn) => {
  cancelBtn.addEventListener("click", (ev) => {
    const collapsibleElement = ev.currentTarget.parentNode;

    browser.storage.sync.get([settingsIdentifier]).then((result) => {
      if (!result.hasOwnProperty(settingsIdentifier)) {
        browser.runtime.reload();
        return;
      }
      // reset input value to current used value
      const numInputs = collapsibleElement.querySelectorAll('input')
      numInputs.forEach(numInput => {
        const varName = numInput.dataset.varName;
        if (varName === "itBlur") {
          numInput.value = parseInt(result.settings?.blurOnIdle?.idleTimeout || 15);
        } else {
          numInput.value = parseInt(result.settings.varStyles[varName]);
        }
      })
    });

    collapsibleElement.classList.remove("show");
    ev.currentTarget.parentNode.parentNode.querySelector(".reveal-btn.active").classList.remove("active");
  })
})

// track form save/submit for variable style settings
const forms = document.querySelectorAll("form.var-style");

forms.forEach((form) => {
  form.addEventListener("submit", saveFormSettings);
})
function saveFormSettings(ev) {
  ev.preventDefault();
  const [key, val] = Object.entries(Object.fromEntries(new FormData(ev.target)))[0];

  browser.storage.sync.get([settingsIdentifier]).then((result) => {
    if (!result.hasOwnProperty(settingsIdentifier)) {
      browser.runtime.reload();
      return;
    }
    if (key === "itBlur") {
      result.settings.blurOnIdle.idleTimeout = val;
    } else {
      result.settings.varStyles[key] = val + "px";
    }
    browser.storage.sync.set(result);
  });
  showToast('Saved!');
}

// Load settings and update switches
browser.storage.sync.get([settingsIdentifier]).then((result) => {
  if (!result.hasOwnProperty(settingsIdentifier)) {
    browser.runtime.reload();
    return;
  }

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
    const varName = numInput.dataset.varName;
    if (varName === "itBlur") {
      numInput.value = parseInt(result.settings?.blurOnIdle?.idleTimeout || 15);
    } else {
      numInput.value = parseInt(result.settings.varStyles[varName]);
    }
  })

});

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
