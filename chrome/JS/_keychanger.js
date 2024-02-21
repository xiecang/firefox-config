//Firefox 自定义快捷 RunningCheese for 100+


//F1-12键
//--------------------------------------------------------------------------------------------------------------------------------------------
keys['F1'] = function () {
    document.getElementById("cmd_newNavigatorTab").doCommand();
};
keys['F2'] = {
    oncommand: "internal",
    params: [
        'tab',
        'prev'
    ]
}; // 上一个标签页 (内置命令演示)
keys['F3'] = function () {
    gBrowser.getFindBar().then(findBar => {
        if (findBar.getAttribute('hidden')) {
            gBrowser.tabContainer.advanceSelectedTab(1, true);
        } else {
            findBar.getElement('find-next').doCommand();
        }
    });
}; // 下一个标签页
keys['F4'] = {
    oncommand: "internal",
    params: [
        'tab',
        'duplicate'
    ]
}; //复制当前标签页
//keys['F5'] =""; // 原生功能：刷新
//keys['F6'] =""; // 原生功能：定位到地址栏
//keys['F7'] =""; // 原生功能：启用浏览光标
//keys['F8'] ="";
//keys['F9'] ="";
//keys['F10'] ="";
//keys['F11'] =""; // 原生功能：全屏模式
//keys['F12'] =""; // 原生功能：开发者工具


//Alt 组合键
//--------------------------------------------------------------------------------------------------------------------------------------------

keys['Alt+·'] = function () {
    window.document.getElementById("unified-extensions-button").click();
}; //打开扩展管理
keys['Alt+`'] = function () {
    window.document.getElementById("unified-extensions-button").click();
}; //打开扩展管理

keys["Alt+F1"] = function () {
    if (gBrowser.selectedTab.getAttribute("pinned") !== "true") {
        gBrowser.removeCurrentTab();
    }
}; //关闭当前标签页
keys["Alt+F2"] = function () {
    gBrowser.removeTabsToTheEndFrom(gBrowser.selectedTab);
}; //关闭右侧所有标签页
keys["Alt+F3"] = function () {
    gBrowser.removeAllTabsBut(gBrowser.selectedTab);
}; //关闭其他标签页

keys['Alt+F'] = function (event) {
    var bar = document.getElementById("PersonalToolbar");
    setToolbarVisibility(bar, bar.collapsed);
};//显示或隐藏书签栏


keys['Alt+P'] = function (event) {
    event.target.ownerGlobal.BrowserPageInfo();
}; //查看页面信息

keys['Alt+Z'] = function () {
    try {
        document.getElementById('History:UndoCloseTab').doCommand();
    } catch (ex) {
        if ('undoRemoveTab' in gBrowser) gBrowser.undoRemoveTab(); else throw "Session Restore feature is disabled."
    }
}; //恢复关闭标签页

keys['Alt+V'] = function () {
    let url = readFromClipboard();
    try {
        switchToTabHavingURI(url, true);
    } catch (ex) {
        var reg = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
        if (!reg.test(url)) {
            url = 'https://www.baidu.com/s?wd=' + encodeURIComponent(url);
        } else {
            if (url.substring(4, 0).toLowerCase() == "http") {
                url = encodeURIComponent(url);
            } else {
                url = 'http://' + encodeURIComponent(url);
            }
        }
        switchToTabHavingURI(url, true);
    }
    e.preventDefault();
    e.stopPropagation();
}; //打开剪切板地址


keys['Alt+C'] = function () {
    (function () {
        var gClipboardHelper = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
        var txt = "";
        var url = gBrowser.currentURI.spec;
        var title = gBrowser.contentTitle;
        txt += "[" + title + "]" + "(" + url + ")";
        gClipboardHelper.copyString(txt);
    })();
}//复制当前网页 Markdown 链接

keys['Ctrl+Shift+Alt+C'] = function () {
    (function () {
        var gClipboardHelper = Components.classes['@mozilla.org/widget/clipboardhelper;1'].getService(Components.interfaces.nsIClipboardHelper);
        var txt = "";
        gBrowser.tabs.forEach(function (tab) {
            var url = gBrowser.getBrowserForTab(tab).currentURI.spec;
            txt += "[" + tab.label + "]" + "(" + url + ")" + "\r\r"
        });
        gClipboardHelper.copyString(txt);
    })();
}//复制所有网页 Markdown 链接


//Ctrl+Alt 组合键
//--------------------------------------------------------------------------------------------------------------------------------------------

//keys['Ctrl+Alt+A'] =  function() {var path ="..\\..\\Tools\\Snapshot.exe";	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);file.initWithPath(path.replace(/^\./, Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path));file.launch();};//截图

//keys['Ctrl+Alt+Shift+A'] =  function() {window.minimize(); var path ="..\\..\\Tools\\Snapshot.exe";	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);file.initWithPath(path.replace(/^\./, Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path));file.launch();};//隐藏火狐截图

//keys['Ctrl+Alt+Q'] =  function() {var path ="..\\..\\Tools\\FSCapture\\FSCapture.exe";	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);file.initWithPath(path.replace(/^\./, Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path));file.launch();};//完整截图

//keys["Ctrl+Alt+S"]  = function() {var path ="..\\..\\Tools\\ScreenToGif.exe";	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);file.initWithPath(path.replace(/^\./, Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path));file.launch();};//GIF截图

//keys['Ctrl+Alt+C'] =  function() { var path ="..\\..\\Tools\\Colors\\Colors.exe";	var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);file.initWithPath(path.replace(/^\./, Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile).path));file.launch();};//颜色拾取器

keys["Ctrl+Alt+X"] = function () {
    var toolbar = document.getElementById("toolbar-menubar");
    var visibility = toolbar.getAttribute("autohide") == "true";
    setToolbarVisibility(toolbar, visibility);
};//打开Alt菜单 ff70+


//Ctrl+Shift 组合键
//--------------------------------------------------------------------------------------------------------------------------------------------
//keys['Ctrl+Shift+A'] = 原生快捷键：打开附加组件栏
//keys['Ctrl+Shift+S'] = 原生快捷键：打开火狐自带的截图功能
//keys['Ctrl+Shift+D'] = 原生快捷键：保存当前所有标签




