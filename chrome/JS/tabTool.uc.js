// @name           Tab Tool
// @version        0.0.1
// @author         xiecang
// @homepage       https://github.com/xiecang/firefox-config
// @long-description
// @description
/*
双击标签页关闭标签页
在新标签页查看图片
标签栏鼠标滚轮切换标签页
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/xiecang/firefox-config@master/JS/tabTool.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/xiecang/firefox-config@master/JS/tabTool.uc.js
// ==/UserScript==

class TabTool {
    constructor() {
        // 双击标签页关闭标签页
        this.doubleClickCloseTab()
        // 在新标签页查看图片
        this.newTabViewImage()

        // 自动切换到鼠标移动到的标签页
        // this.autoSwitchTabWhenMouseHover()

        // 标签栏鼠标滚轮切换标签页
        this.mouseScrollTab()
    }

    doubleClickCloseTab() {
        gBrowser.tabContainer.addEventListener("dblclick",
            function (event) {
                if (event.button == 0 && !event.ctrlKey) {
                    const tab = event.target.closest('.tabbrowser-tab');
                    if (!tab) return;
                    gBrowser.removeTab(tab);
                    gBrowser.removeTab(tab, {animate: true});
                }
            },
            false
        );
    }

    newTabViewImage() {
        if (location.href != 'chrome://browser/content/browser.xhtml') {
            return
        }
        setTimeout(function () {
            const viewImage = document.getElementById('context-viewimage');
            if (!viewImage) return;
            viewImage.removeAttribute('oncommand');
            viewImage.addEventListener('command', function (e) {
                let where = whereToOpenLink(e, false, false);
                if (where == "current") {
                    where = "tab";
                }
                let referrerInfo = gContextMenu.contentData.referrerInfo;
                let systemPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
                if (gContextMenu.onCanvas) {
                    gContextMenu._canvasToBlobURL(gContextMenu.targetIdentifier).then(function (blobURL) {
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
    }

    selectedTabOnMouseover(timeout) {
        let g = gBrowser
        let w = window

        g.tabContainer.addEventListener('mouseover', e => {
            const tab = e.target.closest('.tabbrowser-tab');
            if (!tab) return;
            timeout = setTimeout(() => g.selectedTab = tab, 150);
        }, false);
        g.tabContainer.addEventListener('mouseout', () => clearTimeout(timeout), false);
    }

    mouseScrollTab() {
        if (!location.href.startsWith('chrome://browser/content/browser.x')) {
            return;
        }
        const scrollRight = true;
        const wrap = true;
        gBrowser.tabContainer.addEventListener("wheel", function(event) {
            let dir = (scrollRight ? 1 : -1) * Math.sign(event.deltaY);
            setTimeout(function() {
                gBrowser.tabContainer.advanceSelectedTab(dir, wrap);
            }, 0);
        }, true);
    }
}

if (gBrowserInit.delayedStartupFinished) {
    window.xcTabTools = new TabTool();
} else {
    let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            window.xcTabTools = new TabTool();
        }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}