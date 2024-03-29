// ==UserScript==
// @name             Tabplus.uc.js
// @description      设置标签的打开方式
// @update           2021-07-28 for ff90
// @update           2019-09-23
// @update           2019-09-14
// @update           2018-04-20
// @license          MIT License
// @compatibility    Firefox 90+
// @charset          UTF-8
// @include          chrome://browser/content/browser.xhtml
// @include          chrome://browser/content/browser.xul
// ==/UserScript==



var gBrowser = window._gBrowser;

// 01. 双击标签页关闭标签页
gBrowser.tabContainer.addEventListener("dblclick",
    function(event) {
        if (event.button == 0 && !event.ctrlKey) {
            const tab = event.target.closest('.tabbrowser-tab');
            if(!tab) return;
      gBrowser.removeTab(tab);
      gBrowser.removeTab(tab, {animate: true});
        }
    },
false);




// 02. 自动切换到鼠标移动到的标签页 
/*
((g, w) => {
  class TabPlus {
    constructor() {
      this.SelectedTabOnMouseover();
    }
    SelectedTabOnMouseover(timeout) {
      g.tabContainer.addEventListener('mouseover', e => {
        const tab = e.target.closest('.tabbrowser-tab');
        if (!tab) return;
        timeout = setTimeout(() => g.selectedTab = tab, 150);
      }, false);
      g.tabContainer.addEventListener('mouseout', () => clearTimeout(timeout), false);
    }
  }
  new TabPlus();
})(gBrowser, window);
*/



// 03. 右键关闭标签页
/*
gBrowser.tabContainer.addEventListener("click",
function(event) {
    if (event.button == 2 && !event.ctrlKey) {
        const tab = event.target.closest('.tabbrowser-tab');
        if(!tab) return;
        gBrowser.removeTab(tab);
        gBrowser.removeTab(tab, {animate: false});
        event.stopPropagation();
        event.preventDefault();
    }
},
false);
*/



// 04. 标签栏鼠标滚轮切换标签页
/*
(function() {
  if (!location.href.startsWith('chrome://browser/content/browser.x'))
    return;
  const scrollRight = true;
  const wrap = true;
  gBrowser.tabContainer.addEventListener("wheel", function(event) {
    let dir = (scrollRight ? 1 : -1) * Math.sign(event.deltaY);
    setTimeout(function() {
      gBrowser.tabContainer.advanceSelectedTab(dir, wrap);
    }, 0);
  }, true);
})();
*/



// 05. 在新标签页查看图片 

location.href == 'chrome://browser/content/browser.xhtml' && setTimeout(function() {
const viewImage = document.getElementById('context-viewimage');
if(!viewImage) return;
viewImage.removeAttribute('oncommand');
viewImage.addEventListener('command',  function (e) {
  let where = whereToOpenLink(e, false, false);
  if (where == "current") {
    where = "tab";
  }
  let referrerInfo = gContextMenu.contentData.referrerInfo;
  let systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
  if (gContextMenu.onCanvas) {
    gContextMenu._canvasToBlobURL(gContextMenu.targetIdentifier).then(function(blobURL) {
      openLinkIn(blobURL, where, {
        referrerInfo,
        triggeringPrincipal: systemPrincipal,
        inBackground: e.button !== 0
      });
    }, Cu.reportError);
  } else {
    urlSecurityCheck(
      gContextMenu.mediaURL,
      gContextMenu.principal,
      Ci.nsIScriptSecurityManager.DISALLOW_SCRIPT
    );
  
    // Default to opening in a new tab.
    openLinkIn(gContextMenu.mediaURL, where, {
      referrerInfo,
      forceAllowDataURI: true,
      triggeringPrincipal: gContextMenu.principal,
      csp: gContextMenu.csp,
      inBackground: e.button !== 0
    });
  }
});
}, 1000);




// // 06. 关闭标签页后选择左侧标签
// (function () {
//   gBrowser.tabContainer.addEventListener("TabClose", tabCloseHandler, false);
//   function tabCloseHandler(event) {
//     var tab = event.target;
//     gBrowser.selectedTab = tab;
//     if (gBrowser.selectedTab._tPos != 0) {
//       gBrowser.tabContainer.advanceSelectedTab(-1, true);
//     }
//   }
// })();



// 07.  新标签打开侧边栏历史页面 
(function() {
   
if (!location.href.startsWith('chrome://browser/content/browser.x'))
    return;
   
  eval('PlacesUIUtils.openNodeWithEvent = '  + PlacesUIUtils.openNodeWithEvent.toString()
    .replace(' && lazy.PlacesUtils.nodeIsBookmark(aNode)', '')
    .replace('getBrowserWindow(window)',
      '(window && window.document.documentElement.getAttribute("windowtype") == "navigator:browser") ? window : BrowserWindowTracker.getTopWindow()')
  );
   
  let onPopupshowing = function() {
    let historyMenu = document.getElementById('history-menu');
    if (!historyMenu._placesView) {
      new HistoryMenu(event);
      historyMenu._placesView._onCommand = function HM__onCommand(aEvent) {
        let placesNode = aEvent.target._placesNode;
        if (placesNode) {
          PlacesUIUtils.openNodeWithEvent(placesNode, aEvent);
        };
      };
    };
  };
   
  let historyPopup = document.getElementById('historyMenuPopup');
  historyPopup.setAttribute('onpopupshowing', '(' + onPopupshowing.toString() + ')()');
   
})();
