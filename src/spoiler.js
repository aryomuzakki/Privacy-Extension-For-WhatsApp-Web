chrome.storage.sync.get(["on", "blockWords", "spoilerQuery"], (data) => {
  if (data) {
    const observerList = [];

    const removeSpoilerTag = el => el.outerHTML = el.textContent;

    const resetSpoiler = () => {
      // extension or spoiler reenabled or disabled, or words updated

      const spoilerTags = [...document.getElementsByClassName(`myspoiler`)]
      if (spoilerTags.length > 0) spoilerTags.forEach(st => removeSpoilerTag(st));

      const spoilerStyle = document.getElementById(`myspoiler-style`);
      if (spoilerStyle) spoilerStyle.parentNode.removeChild(spoilerStyle);

      if (observerList.length > 0) observerList.forEach(ol => ol.disconnect());

      return;
    }

    // chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    //   console.log("request: ", request);

    //   console.log(observerList)

    //   if (request.data.event === "refresh") {
    //     console.log("refreshing")
    //     resetSpoiler();
    //     refresh(data);
    //   }

    //   sendResponse({ success: true, data: { foo: "bar" } });
    // });

    resetSpoiler();

    // const refresh = (data) => {
    if (data.on && data.blockWords) {
      // run if extension and spoiler is enabled

      const addSpoilerTag = (el) => {
        if (el) {
          let newTextContent = el.textContent;
          data.spoilerQuery.forEach(sq => {
            const rgx = new RegExp(`\\b${sq}\\b`, "g");
            newTextContent = newTextContent.replaceAll(rgx, `<span class="myspoiler">${sq}</span>`);
          })
          el.innerHTML = newTextContent;
        }
      };

      const isQueryExist = (elText, spoilerQuery) => spoilerQuery.some(sq => elText.includes(sq));

      const createStyle = () => {
        spoilerStyleEl = document.createElement("style")
        spoilerStyleEl.appendChild(document.createTextNode(`
            .myspoiler {
                --spoiler-color: #323232;
                background-color: var(--spoiler-color);
                color: var(--spoiler-color);
                padding: 0 8px 0 8px;
                transition: all .2s;
            }
            .myspoiler:hover {
                background-color: transparent;
                color: var(--message-primary);
            }
          `));
        spoilerStyleEl.id = "myspoiler-style";
        document.getElementsByTagName("head")[0].appendChild(spoilerStyleEl);
      }

      if (!document.getElementById(`myspoiler-style`)) {
        createStyle();
      }

      const applySpoiler = (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          for (const child of node.childNodes) {
            if (isQueryExist(child.textContent, data.spoilerQuery)) {
              applySpoiler(child);
            }
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          if (isQueryExist(node.textContent, data.spoilerQuery)) {
            if (!(node.parentNode.tagName.toLowerCase() === "span" && node.parentNode.classList.contains("myspoiler"))) {
              addSpoilerTag(node.parentNode);
            }
          }
          return;
        }
      }

      const scrollingChatCallback = (mutationList, _, scrollingChatNode) => {
        if (mutationList) {
          // scrolling chat observer callback
          for (const mutation of mutationList) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
              // new node added in scrolling chat
              mutation.addedNodes.forEach(newAddedNode => {
                const foundElements = [...newAddedNode.getElementsByClassName("selectable-text")].filter(el => isQueryExist(el.textContent, data.spoilerQuery));
                if (foundElements.length > 0) {
                  foundElements.forEach(fe => {
                    applySpoiler(fe);
                  })
                }
              })

            }
          }
        } else {
          // first initiate
          const foundElements = [...scrollingChatNode.getElementsByClassName("selectable-text")].filter(el => isQueryExist(el.textContent, data.spoilerQuery));
          foundElements.forEach(fe => {
            applySpoiler(fe);
          })
        }
      }

      const observerRef = window.MutationObserver || window.MozMutationObserver;

      // on scrolling chat 
      const observeScrollingChat = () => {
        const scrollingChatObserver = new observerRef(scrollingChatCallback);

        const scrollingChat = document.querySelector("._5kRIK > .n5hs2j7m.oq31bsqd.gx1rr48f.qh5tioqs")

        if (scrollingChat) {
          scrollingChatObserver.observe(scrollingChat, { childList: true });
          observerList.push(scrollingChatObserver);
        }
      }

      // chat panel observer callback
      const chatPanelLoaded = (mutationList) => {
        for (const mutation of mutationList) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            // new chat panel are showed
            scrollingChatCallback(null, null, mutation.addedNodes[0]);
            observeScrollingChat();
          }
        }
      };

      const chatPanelObserver = new observerRef(chatPanelLoaded);

      // on chat panel change event
      const chatPanel = document.querySelector("._1jJ70 > ._2Ts6i._2xAQV");

      if (chatPanel) {
        chatPanelObserver.observe(chatPanel, { childList: true });
        observerList.push(chatPanelObserver);
      }

      const scrollingChat = document.querySelector("._5kRIK > .n5hs2j7m.oq31bsqd.gx1rr48f.qh5tioqs")
      if (scrollingChat) {
        scrollingChatCallback(null, null, scrollingChat);
      }

    }
    // }

    // refresh(data);
  }
})