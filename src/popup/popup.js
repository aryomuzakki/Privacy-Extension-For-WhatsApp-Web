// Checkboxes
let button = document.getElementById('switch');
let messages = document.getElementById('messages');
let messagesPreview = document.getElementById('messagesPreview');
let mediaPreview = document.getElementById('mediaPreview');
let mediaGallery = document.getElementById('mediaGallery');
let textInput = document.getElementById('textInput');
let profilePic = document.getElementById('profilePic');
let name = document.getElementById('name');
let noDelay = document.getElementById('noDelay');
let unblurActive = document.getElementById('unblurActive');

let blockWords = document.getElementById("blockWords");
let wordsTextArea = document.getElementById("spoilerQuery");

// Message functionality
let mainContent = document.getElementById('mainContent');
let popupMessage = document.getElementById('popupMessage');

// Get and set current version
let version = chrome.runtime.getManifest().version;
document.getElementById('version').innerText = version;

// Add or remove stylesheets
function refreshScript(){
  chrome.tabs.query({url: "https://web.whatsapp.com/"}, function(tabs) {
    if (tabs.length !== 0)
      tabs.forEach(function(tab){chrome.tabs.executeScript(tab.id, {file: '/load.js'})});
  });
}

// Set current state in popup
chrome.storage.sync.get([
    'on',
    'currentPopupMessage',
    'messages',
    'messagesPreview',
    'mediaPreview',
    'mediaGallery',
    'textInput',
    'profilePic',
    'name',
    'noDelay',
    'unblurActive',
    'blockWords',
    'spoilerQuery',
  ], function(data) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      messages.checked=data.messages;
      messagesPreview.checked=data.messagesPreview;
      mediaPreview.checked=data.mediaPreview;
      mediaGallery.checked=data.mediaGallery;
      textInput.checked=data.textInput;
      profilePic.checked=data.profilePic;
      name.checked=data.name;
      noDelay.checked=data.noDelay;
      unblurActive.checked=data.unblurActive;
      button.checked = data.on;
      blockWords.checked = data.blockWords;
      wordsTextArea.value = data.spoilerQuery.join("\n");

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
    });
});

button.addEventListener('change', function() {
  chrome.storage.sync.set({on: this.checked});
  refreshScript();
  refreshSpoiler();
});
// Update settings values
messages.addEventListener('change', function() {
  chrome.storage.sync.set({messages: this.checked});
  refreshScript();
});
messagesPreview.addEventListener('change', function() {
  chrome.storage.sync.set({messagesPreview: this.checked});
  refreshScript();
});
mediaPreview.addEventListener('change', function() {
  chrome.storage.sync.set({mediaPreview: this.checked});
  refreshScript();
});
mediaGallery.addEventListener('change', function() {
  chrome.storage.sync.set({mediaGallery: this.checked});
  refreshScript();
});
textInput.addEventListener('change', function() {
  chrome.storage.sync.set({textInput: this.checked});
  refreshScript();
});
profilePic.addEventListener('change', function() {
  chrome.storage.sync.set({profilePic: this.checked});
  refreshScript();
});
name.addEventListener('change', function() {
  chrome.storage.sync.set({name: this.checked});
  refreshScript();
});
noDelay.addEventListener('change', function() {
  chrome.storage.sync.set({noDelay: this.checked});
  refreshScript();
});
unblurActive.addEventListener('change', function() {
  chrome.storage.sync.set({unblurActive: this.checked});
  refreshScript();
});

// spoiler / block words
function refreshSpoiler({ data }) {
  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   chrome.tabs.sendMessage(tabs[0].id, { data }, function (response) {
  //     console.log("response from sendMessage", response);
  //   });
  // });
  chrome.tabs.query({ url: "https://web.whatsapp.com/" }, function (tabs) {
    if (tabs.length !== 0)
      tabs.forEach(function(tab){chrome.tabs.executeScript(tab.id, {file: '/spoiler.js'})});
  });
}

let updateBlockedWord = document.getElementById("block-word-btn");

// wordsTextArea.addEventListener("keyup", (ev) => {
//   let blockWordList = document.getElementsByClassName("block-word-list")[0];
//   blockWordList.innerHTML = "";
//   ev.target.value.split("\n").forEach(el => {
//     if (el.trim().length > 0) {
//       let liEl = document.createElement("li");
//       liEl.innerText = el;
//       blockWordList.appendChild(liEl);
//     }
//   })
// })

updateBlockedWord.addEventListener("click", () => {
  const spoilerQuery = wordsTextArea.value.split("\n").filter(val => val).map(val => val.trim())
  chrome.storage.sync.set({ spoilerQuery });
  refreshSpoiler({ data: { event: "refresh", spoilerQuery } });
})

blockWords.addEventListener("click", function () {
  chrome.storage.sync.set({ blockWords: this.checked });
  refreshSpoiler({ data: { event: "refresh" } });
})