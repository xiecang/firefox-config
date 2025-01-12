// @name           Button Events
// @version        0.0.1
// @author         xiecang
// @homepage       https://github.com/xiecang/firefox-config
// @long-description
// @description
/*
中键点击地址栏自动复制网址
左键「侧边栏」打开历史记录，右键打开书签
双击 侧边栏顶部 切换左右的停靠位置
右键「历史按钮」恢复最后关闭的标签
右键「下载按钮」打开下载历史
右键「三道杠」右侧打开侧边栏
右键「地址栏书签图标」 打开书签管理界面
右键「新建标签按钮」访问剪切板内容
中键「新建标签页按钮」恢复关闭的标签页
右键「地址栏刷新按钮」 强制刷新页面（跳过缓存）
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/xiecang/firefox-config@master/JS/buttonEvents.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/xiecang/firefox-config@master/JS/buttonEvents.uc.js
// ==/UserScript==


class ButtonEvents {
    constructor() {
        // 中键点击地址栏自动复制网址
        this.urlbarEvents()

        // 左键「侧边栏」打开历史记录，右键打开书签
        this.sidebarButtonEvents()

        // 双击 侧边栏顶部 切换左右的停靠位置
        this.sidebarHeaderEvents()

        // 右键「历史按钮」恢复最后关闭的标签
        this.historyPanelmenuEvents()

        // 右键「下载按钮」打开下载历史
        this.rightClickOpenDownloadHistory()

        // 右键「三道杠」右侧打开侧边栏
        this.rightClickOpenSideBar()

        //右键「地址栏书签图标」 打开书签管理界面
        this.rightClickOpenBenchmarkManager()
        
        // 右键「新建标签按钮」访问剪切板内容
        this.rightClickNewTabButtonReadClipboard()

        // 中键「新建标签页按钮」恢复关闭的标签页
        this.middleClickNewTabButtonOpenLastCloseTab()
        
        // 右键「地址栏刷新按钮」 强制刷新页面（跳过缓存）
        this.rightClickReloadButtonSkipCache()
    }

    // 中键点击地址栏自动复制网址
    urlbarEvents() {
        if (location.href.startsWith('chrome://browser/content/browser.x')) {
            document.getElementById('urlbar').addEventListener('click', function (e) {
                if (e.button == 1) {
                    let gClipboardHelper = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
                    gClipboardHelper.copyString(gBrowser.currentURI.spec);
                }
            }, false);
        }
    }

    // 左键「侧边栏」打开历史记录，右键打开书签
    sidebarButtonEvents() {
        let viewHistorySidebar = document.getElementById('sidebar-button');
        if (!viewHistorySidebar) return;
        let menupopup = viewHistorySidebar.firstChild;
        viewHistorySidebar.addEventListener("click", function (e) {
            if (e.button == 0) {
                // 左键「侧边栏」打开历史记录，右键打开书签
                e.preventDefault();
                e.stopPropagation();
                //document.getElementById('toolbar-context-menu').style.display="none";
                SidebarUI.toggle("viewHistorySidebar");
                //SidebarUI.toggle("viewBookmarksSidebar");
            } else if (e.button == 2) {
                // 右键「侧边栏」打开书签
                e.preventDefault();
                e.stopPropagation();
                //document.getElementById('toolbar-context-menu').style.display="none";
                SidebarUI.toggle("viewBookmarksSidebar");
            }
        }, false);

    }

    // 双击 侧边栏顶部 切换左右的停靠位置
    sidebarHeaderEvents() {
        let SidebarFloat = document.getElementById('sidebar-header');
        if (!SidebarFloat) return;
        // let menupopup = SidebarFloat.firstChild;
        SidebarFloat.addEventListener("dblclick", function (e) {
            if (e.button == 0) {
                let key = "sidebar.position_start";
                Services.prefs.setBoolPref(key, !Services.prefs.getBoolPref(key));
            }
        }, false);
    }

    // 右键「历史按钮」恢复最后关闭的标签
    historyPanelmenuEvents() {
        let UndoClosedTabs = document.getElementById('history-panelmenu');
        if (!UndoClosedTabs) return;
        let menupopup = UndoClosedTabs.firstChild;
        UndoClosedTabs.addEventListener("click", function (e) {
            if (e.button == 2) {
                e.preventDefault();
                e.stopPropagation();
                //document.getElementById('toolbar-context-menu').style.display="none";
                // setTimeout(e=>document.getElementById("toolbar-context-menu").hidePopup(), 0);  (会有BUG)
                undoCloseTab();
            }
        }, false);
    }

    // 右键「下载按钮」打开下载历史
    rightClickOpenDownloadHistory() {
        let ShowAllDownload = document.getElementById('downloads-button');
        if (!ShowAllDownload) return;
        let menupopup = ShowAllDownload.firstChild;
        ShowAllDownload.addEventListener("click", function (e) {
            if (e.button == 2) {
                e.preventDefault();
                e.stopPropagation();
                //document.getElementById('toolbar-context-menu').style.display="none";
                DownloadsPanel.showDownloadsHistory();
            }
        }, false);
    }

    // 右键「三道杠」右侧打开侧边栏
    rightClickOpenSideBar() {
        let OpenAllTabs = document.getElementById('PanelUI-menu-button');
        if (!OpenAllTabs) return;
        let menupopup = OpenAllTabs.firstChild;
        OpenAllTabs.addEventListener("click", function (e) {
            if (e.button == 2) {
                e.preventDefault();
                e.stopPropagation();
                //document.getElementById('toolbar-context-menu').style.display="none";
                document.getElementById("sidebar-button").click();
                Services.prefs.setBoolPref("sidebar.position_start", false);
            }
        }, false);
    }

    // 右键「地址栏书签图标」 打开书签管理界面
    rightClickOpenBenchmarkManager() {
        let OpenPlacesOrganizer = document.getElementById('star-button-box');
        if (!OpenPlacesOrganizer) return;
        let menupopup = OpenPlacesOrganizer.firstChild;
        OpenPlacesOrganizer.addEventListener("click", function (e) {
            if (e.button == 2) {
                e.preventDefault();
                PlacesCommandHook.showPlacesOrganizer('AllBookmarks');
            }
        }, false);

    }

    rightClickNewTabButtonReadClipboard() {
        if (!location.href.startsWith('chrome://browser/content/browser.x')) {
            return
        }
        window.addEventListener("click", function (e) {
            if (e.button === 2 && (e.originalTarget.matches("#tabs-newtab-button") || e.originalTarget.matches("#new-tab-button"))) {
                let url = readFromClipboard();
                try {
                    switchToTabHavingURI(url, true);
                } catch (ex) {
                    url = 'https://www.google.com/s?wd=' + encodeURIComponent(url);
                    switchToTabHavingURI(url, true);
                }
                e.preventDefault();
                e.stopPropagation();
                // document.getElementById('toolbar-context-menu').style.display="none";
            }
        }, false);
    }
    
    // 中键「新建标签页按钮」恢复关闭的标签页
    middleClickNewTabButtonOpenLastCloseTab() {
        let ucjsUndoCloseTab = function(e) {
            // Nur mit Mittelkick
            if (e.button != 1) {
                return;
            }
            // Klick auf Tab-Leiste und die Neuer Tab Schaltfl?chen
            if (e.target.localName != 'tabs' && e.target.localName != 'toolbarbutton') {
                return;
            }
            undoCloseTab(0);
            e.preventDefault();
            e.stopPropagation();
        }
        // Schaltfl?che Neuer Tab
        document.getElementById('new-tab-button').onclick = ucjsUndoCloseTab;
        // Tab-Leiste
        gBrowser.tabContainer.addEventListener('click', ucjsUndoCloseTab, true);
        window.addEventListener('unload', function uninit() {
            gBrowser.tabContainer.removeEventListener('click', ucjsUndoCloseTab, true);
            window.removeEventListener('unload', uninit, false);
        }, false);
    }

    // 右键「地址栏刷新按钮」 强制刷新页面（跳过缓存）
    rightClickReloadButtonSkipCache() {
        let UndoClosedTabs = document.getElementById('reload-button');
        if (!UndoClosedTabs) return;
        UndoClosedTabs.addEventListener("click", function(event) {
            if (event.button == 2) {
                event.preventDefault();
                BrowserReloadSkipCache();
            }
        }, false);
    }
}

if (gBrowserInit.delayedStartupFinished) {
    window.xcButtonEvents = new ButtonEvents();
} else {
    let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            window.xcButtonEvents = new ButtonEvents();
        }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
