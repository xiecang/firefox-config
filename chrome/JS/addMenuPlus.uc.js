// ==UserScript==
// @name           addMenuPlus.uc.js
// @description    通过配置文件增加修改菜单，修改版
// @namespace      http://d.hatena.ne.jp/Griever/
// @author         Ryan, ywzhaiqi, Griever
// @include        main
// @license        MIT License
// @compatibility  Firefox 70
// @charset        UTF-8
// @version        0.2.1
// @shutdown       window.addMenu.destroy();
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS/addMenuPlus
// @downloadURL    https://github.com/ywzhaiqi/userChromeJS/raw/master/addmenuPlus/addMenuPlus.uc.js
// @reviewURL      https://bbs.kafan.cn/thread-2246475-1-1.html
// @note           0.2.1 fix openUILinkIn was removed, Bug 1820534 - Move front-end to modern flexbox, 修复 about:error 页面获取的地址不对, Bug 1815439 - Remove useless loadURI wrapper from browser.js, 扩展 %FAVICON% %FAVICON_BASE64% 的应用范围
// @note           0.2.0 采用 JSWindowActor 与内容进程通信（替代 e10s 时代的 loadFrameScript，虽然目前还能用），修复 onshowing 仅在页面右键生效的 bug，修复合并窗口后 CSS 失效的问题
// @note           0.1.4 onshowing/onshowinglabel 在所有右键菜单生效
// @note           0.1.3 修正 Firefox 78 (?应该是吧) openUILinkIn 参数变更；Firefox 92 getURLSpecFromFile 废止，切换到 getURLSpecFromActualFile；添加到文件菜单的 app/appmenu 菜单自动移动到汉堡菜单, 修复 keyword 调用搜索引擎失效的问题，没有 label 并使用 keyword 调用搜索引擎时设置 label 为搜素引擎名称；增加 onshowinglabel 属性，增加本地化属性 data-l10n-href 以及 data-l10n-id；修正右键未显示时无法获取选中文本，增加菜单类型 nav （navigator-toolbox的右键菜单），兼容 textLink_e10s.uc.js，增加移动的菜单无需重启浏览器即可还原，增加 identity-box 右键菜单, getSelectionText 完美修复，支持内置页面，修复右键菜单获取选中文本不完整
// @note           0.1.2 增加多语言；修复 %I %IMAGE_URL% %IMAGE_BASE64% 转换为空白字符串；GroupMenu 增加 onshowing 事件
// @note           0.1.1 Places keywords API を使うようにした
// @note           0.1.0 menugroup をとりあえず利用できるようにした
// @note           0.0.9 Firefox 29 の Firefox Button 廃止に伴いファイルメニューに追加するように変更
// @note           0.0.8 Firefox 25 の getShortcutOrURI 廃止に仮対応
// @note           0.0.7 Firefox 21 の Favicon 周りの変更に対応
// @note           0.0.6 Firefox 19 に合わせて修正
// @note           0.0.5 Remove E4X
// @note           0.0.4 設定ファイルから CSS を追加できるようにした
// @note           0.0.4 label の無い menu を splitmenu 風の動作にした
// @note           0.0.4 Vista でアイコンがズレる問題を修正…したかも
// @note           0.0.4 %SEL% の改行が消えてしまうのを修正
// @note           0.0.3 keyword の新しい書式で古い書式が動かない場合があったのを修正
// @note           %URL_HTMLIFIED%, %EOL_ENCODE% が変換できなかったミスを修正
// @note           %LINK_OR_URL% 変数を作成（リンク URL がなければページの URL を返す）
// @note           タブの右クリックメニューでは %URL% や %SEL% はそのタブのものを返すようにした
// @note           keyword で "g %URL%" のような記述を可能にした
// @note           ツールの再読み込みメニューの右クリックで設定ファイルを開くようにした
// @note           修复支持57+
// ==/UserScript==
if (typeof window === "undefined" || globalThis !== window) {
    let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
    try {
        if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
            BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
        }
    } catch (e) { }
    if (!Services.appinfo.remoteType) {
        this.EXPORTED_SYMBOLS = ["AddMenuParent"];
        try {
            const actorParams = {
                parent: {
                    moduleURI: __URI__,
                },
                child: {
                    moduleURI: __URI__,
                    events: {},
                },
                allFrames: true,
                messageManagerGroups: ["browsers"],
                matches: ["*://*/*", "file:///*", "about:*", "view-source:*"],
            };
            ChromeUtils.registerWindowActor("AddMenu", actorParams);
        } catch (e) { console.error(e); }

        this.AddMenuParent = class extends JSWindowActorParent {
            receiveMessage({ name, data }) {
                // https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/browser/actors/ContextMenuParent.sys.mjs#60-63
                let windowGlobal = this.manager.browsingContext.currentWindowGlobal;
                if (!windowGlobal.rootFrameLoader) return;
                let browser = windowGlobal.rootFrameLoader.ownerElement;
                let win = browser.ownerGlobal;
                let addMenu = win.addMenu;
                switch (name) {
                    case "AM:SetSeletedText":
                        addMenu.setSelectedText(data.text);
                        break;
                    case "AM:FaviconLink":
                        if (typeof data.href !== "undefined" && typeof data.hash !== "undefined") {
                            win.gBrowser.tabs.filter(t => t.faviconHash === data.hash).forEach(t => t.faviconUrl = data.href);
                        }
                        break;
                    case "AM:ExectueScriptEnd":
                        break;
                }
            }
        }
    } else {
        this.EXPORTED_SYMBOLS = ["AddMenuChild"];

        this.AddMenuChild = class extends JSWindowActorChild {
            actorCreated() {

            }
            receiveMessage({ name, data }) {
                const win = this.contentWindow;
                const console = win.console;
                const doc = win.document;
                const actor = win.windowGlobalChild.getActor("AddMenu");
                switch (name) {
                    case "AM:GetSelectedText":
                        let obj = {
                            text: BrowserOrSelectionUtils.getSelectionDetails(win).fullText
                        }
                        actor.sendAsyncMessage("AM:SetSeletedText", obj);
                        break;
                    case "AM:GetFaviconLink":
                        if (doc.location.href.startsWith("about")) return;
                        if (!"head" in doc) return;
                        let link = doc.head.querySelector('[rel~="shortcut"]');
                        let href = "";
                        if (link) {
                            href = link.getAttribute("href");
                            if (href.startsWith("//")) {
                                href = doc.location.protocol + href;
                            } else if (href.startsWith("/")) {
                                href = doc.location.protocol + "//" + doc.location.host + "/" + href;
                            }
                        } else {
                            href = doc.location.protocol + "//" + doc.location.host + "/" + "favicon.ico";
                        }
                        actor.sendAsyncMessage("AM:FaviconLink", { href: href, hash: data.hash });
                        break;
                    case "AM:ExectueScript":
                        if (data && data.script) {
                            eval('(' + decodeURIComponent(atob(data.script)) + ').call(this, doc, win, actor)');
                        }
                        break;
                }
            }
        }
    }
} else {
    try {
        if (parseInt(Services.appinfo.version) < 101) {
            ChromeUtils.import(Components.stack.filename);
        } else {
            let fileHandler = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler);
            let scriptPath = Components.stack.filename;
            if (scriptPath.startsWith("chrome")) {
                scriptPath = resolveChromeURL(scriptPath);
                function resolveChromeURL(str) {
                    const registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
                    try {
                        return registry.convertChromeURL(Services.io.newURI(str.replace(/\\/g, "/"))).spec
                    } catch (e) {
                        console.error(e);
                        return ""
                    }
                }
            }
            let scriptFile = fileHandler.getFileFromURLSpec(scriptPath);
            let resourceHandler = Services.io.getProtocolHandler("resource").QueryInterface(Ci.nsIResProtocolHandler);
            if (!resourceHandler.hasSubstitution("addmenu-ucjs")) {
                resourceHandler.setSubstitution("addmenu-ucjs", Services.io.newFileURI(scriptFile.parent));
            }
            ChromeUtils.import(`resource://addmenu-ucjs/${encodeURIComponent(scriptFile.leafName)}?${scriptFile.lastModifiedTime}`);
        }
    } catch (e) { console.error(e); }
    (function (css) {
        let {
            classes: Cc,
            interfaces: Ci,
            utils: Cu,
            results: Cr
        } = Components;

        let BrowserOrSelectionUtils = Cu.import("resource://gre/modules/BrowserUtils.jsm").BrowserUtils
        try {
            if (!BrowserOrSelectionUtils.hasOwnProperty("getSelectionDetails")) {
                BrowserOrSelectionUtils = Cu.import("resource://gre/modules/SelectionUtils.jsm").SelectionUtils;
            }
        } catch (e) { }

        var useScraptchpad = true; // 如果不存在编辑器，则使用代码片段速记器，否则设置编辑器路径
        var enableFileRefreshing = false; // 打开右键菜单时，检查配置文件是否变化，可能会减慢速度
        var onshowinglabelMaxLength = 15; // 通过 onshowinglabel 设置标签的标签最大长度
        var enableidentityBoxContextMenu = true; // 启用 SSL 状态按钮右键菜单
        var enableContentAreaContextMenuCompact = false; // Photon 界面下右键菜单兼容开关，有需要再开

        if (window && window.addMenu) {
            window.addMenu.destroy();
            delete window.addMenu;
        }

        const ADDMENU_LANG = {
            'zh-CN': {
                'config example': '// 这是一个 addMenuPlus 配置文件\n' +
                    '// 请到 http://ywzhaiqi.github.io/addMenu_creator/ 生成配置文件' +
                    '\n\n' +
                    'tab({\n    label: "addMenuPlus 配置",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
                'example is empty': '目前 addMenuPlus 的配置文件为空，请在打开的链接中生成配置并放入配置文件。\n通过右键标签打开配置文件。',
                'addmenuplus label': 'addMenuPlus',
                'addmenuplus tooltip': '左键：重载配置\n右键：编辑配置',
                'custom showing method error': 'addMenuPlus 自定义显示错误',
                'url is invalid': 'URL 不正确: %s',
                'config file': '配置文件',
                'not exists': ' 不存在',
                'check config file with line': '\n请重新检查配置文件第 %s 行',
                'file not found': '文件不存在: %s',
                'config has reload': '配置已经重新载入',
                'please set editor path': '请先设置编辑器的路径!!!',
                'set global editor': '设置全局脚本编辑器',
                'executable files': '执行文件',
                'could not load': '无法载入：%s'
            },
            'en-US': {
                'config example': '// This is an addMenuPlus configuration file.\n' +
                    '// Please visit http://ywzhaiqi.github.io/addMenu_creator/ to generate configuration.' +
                    '\n\n' +
                    'tab({\n    label: "Edit addMenuPlus Configuration",\n    oncommand: "addMenu.edit(addMenu.FILE);"\n});',
                'example is empty': 'The configuration file for addMenuPlus is currently empty, please generate the configuration and put it in the configuration file in the open link. \nOpen the configuration file by right-clicking the tab.',
                'addmenuplus label': 'addMenuPlus',
                'addmenuplus tooltip': 'Left Click：Reload configuration\nRight Click：Edit configuration',
                'custom showing method error': 'addMenuPlus customize popupshow error',
                'url is invalid': 'URL is invalid: %s',
                'config file': 'Configuration file',
                'not exists': ' not exists',
                'check config file with line': '\nPlease recheck line %s of the configuration file',
                'file not found': 'File not found: %s',
                'config has reload': 'The configuration has been reloaded',
                'please set editor path': 'Please set the path to the editor first!!!',
                'set global editor': 'Setting up the global script editor',
                'executable files': 'Executable files',
                'could not load': 'Could not load：%s'
            },
        }

        // 读取语言代码
        let _locale;
        try {
            let _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
            if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
                _locales = osPrefs.getRegionalPrefsLocales();
            else
                _locales = osPrefs.regionalPrefsLocales;
            for (let i = 0; i < _locales.length; i++) {
                if (ADDMENU_LANG.hasOwnProperty(_locales[i])) {
                    _locale = _locales[i];
                    break;
                }
            }
        } catch (e) { }
        const ADDMENU_LOCALE = _locale || "en-US";

        // 增加菜单类型请在这里加入插入点，名称不能是 ident 或者 group
        var MENU_ATTRS = {
            tab: {
                insRef: $("context_closeTab"),
                current: "tab",
                submenu: "TabMenu",
                groupmenu: "TabGroup"
            },
            page: {
                insRef: $("context-viewsource"),
                current: "page",
                submenu: "PageMenu",
                groupmenu: "PageGroup"
            },
            tool: {
                insRef: $("prefSep") || $("webDeveloperMenu"),
                current: "tool",
                submenu: "ToolMenu",
                groupmenu: "ToolGroup"
            },
            app: {
                insRef: $("appmenu-quit") || $("appMenu-quit-button") || $("appMenu-quit-button2") || $("menu_FileQuitItem"),
                current: "app",
                submenu: "AppMenu",
                groupmenu: "AppGroup"
            },
            nav: {
                insRef: $("toolbar-context-undoCloseTab") || $("toolbarItemsMenuSeparator"),
                current: "nav",
                submenu: "NavMenu",
                groupmenu: "NavGroup"
            }
        };

        window.addMenu = {
            _selectedText: "",
            get prefs() {
                delete this.prefs;
                return this.prefs = Services.prefs.getBranch("addMenu.")
            },
            get appVersion() {
                delete this.appVersion;
                return this.appVersion = parseFloat(Services.appinfo.version);
            },
            get platform() {
                delete this.platform;
                return this.platform = AppConstants.platform;
            },
            get FILE() {
                try {
                    // addMenu.FILE_PATH があればそれを使う
                    path = this.prefs.getStringPref("FILE_PATH")
                } catch (e) {
                    if (this.platform === "win") {
                        path = 'JS\\_addmenu.js';
                    } else {
                        path = 'JS/_addmenu.js';
                    }
                }

                aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
                aFile.appendRelativePath(path);

                if (!aFile.exists()) {
                    saveFile(aFile, $L('config example'));
                    alert($L('example is empty'));
                    addMenu.openCommand({
                        target: this
                    }, 'https://ywzhaiqi.github.io/addMenu_creator/', 'tab');
                }

                this._modifiedTime = aFile.lastModifiedTime;
                delete this.FILE;
                return this.FILE = aFile;
            },
            get focusedWindow() {
                return (gContextMenu && gContextMenu.target) ? gContextMenu.target.ownerDocument.defaultView : document.commandDispatcher.focusedWindow || content;
            },
            get supportLocalization() {
                delete this.supportLocalization;
                return this.supportLocalization = typeof Localization === "function";
            },
            get locale() {
                delete this.locale;
                return this.locale = ADDMENU_LOCALE || "en-US";
            },
            get panelId() {
                delete this.panelId;
                return this.panelId = Math.floor(Math.random() * 900000 + 99999);
            },
            init: function () {
                this.win = window;
                // prepare regex
                let he = "(?:_HTML(?:IFIED)?|_ENCODE)?";
                let rTITLE = "%TITLE" + he + "%|%t\\b";
                let rTITLES = "%TITLES" + he + "%|%t\\b";
                let rURL = "%(?:R?LINK_OR_)?URL" + he + "%|%u\\b";
                let rHOST = "%HOST" + he + "%|%h\\b";
                let rSEL = "%SEL" + he + "%|%s\\b";
                let rLINK = "%R?LINK(?:_TEXT|_HOST)?" + he + "%|%l\\b";
                let rIMAGE = "%IMAGE(?:_URL|_ALT|_TITLE)" + he + "%|%i\\b";
                let rIMAGE_BASE64 = "%IMAGE_BASE64" + he + "%|%i\\b";
                let rSVG_BASE64 = "%SVG_BASE64" + he + "%|%i\\b";
                let rMEDIA = "%MEDIA_URL" + he + "%|%m\\b";
                let rCLIPBOARD = "%CLIPBOARD" + he + "%|%p\\b";
                let rFAVICON = "%FAVICON" + he + "%";
                let rEMAIL = "%EMAIL" + he + "%";
                let rExt = "%EOL" + he + "%";

                let rFAVICON_BASE64 = "%FAVICON_BASE64" + he + "%";
                let rRLT_OR_UT = "%RLT_OR_UT" + he + "%"; // 链接文本或网页标题

                this.rTITLE = new RegExp(rTITLE, "i");
                this.rTITLES = new RegExp(rTITLES, "i");
                this.rURL = new RegExp(rURL, "i");
                this.rHOST = new RegExp(rHOST, "i");
                this.rSEL = new RegExp(rSEL, "i");
                this.rLINK = new RegExp(rLINK, "i");
                this.rIMAGE = new RegExp(rIMAGE, "i");
                this.rMEDIA = new RegExp(rMEDIA, "i");
                this.rCLIPBOARD = new RegExp(rCLIPBOARD, "i");
                this.rFAVICON = new RegExp(rFAVICON, "i");
                this.rEMAIL = new RegExp(rEMAIL, "i");
                this.rExt = new RegExp(rExt, "i");
                this.rFAVICON_BASE64 = new RegExp(rFAVICON_BASE64, "i");
                this.rIMAGE_BASE64 = new RegExp(rIMAGE_BASE64, "i");
                this.rSVG_BASE64 = new RegExp(rSVG_BASE64, "i");
                this.rRLT_OR_UT = new RegExp(rRLT_OR_UT, "i");

                this.regexp = new RegExp(
                    [rTITLE, rTITLES, rURL, rHOST, rSEL, rLINK, rIMAGE, rIMAGE_BASE64, rMEDIA, rSVG_BASE64, rCLIPBOARD, rFAVICON, rFAVICON_BASE64, rEMAIL, rExt, rRLT_OR_UT].join("|"), "ig");

                // add menuitem insertpoint
                for (let type in MENU_ATTRS) {
                    let ins = MENU_ATTRS[type].insRef;
                    if (ins) {
                        let tag = ins.localName.startsWith("menu") ? "menuseparator" : "toolbarseparator";
                        let insertPoint = $C(tag, {
                            id: `addMenu-${type}-insertpoint`,
                            class: "addMenu-insert-point",
                            hidden: true
                        })
                        MENU_ATTRS[type].insertId = insertPoint.id;
                        ins.parentNode.insertBefore(insertPoint, ins.nextSibling);
                        delete MENU_ATTRS[type].insRef;
                    } else {
                        delete MENU_ATTRS[type];
                    }
                }

                // old style groupmenu compatibility
                MENU_ATTRS['group'] = {
                    current: "group",
                    submenu: "GroupMenu",
                    insertId: "addMenu-page-insertpoint"
                };

                $("contentAreaContextMenu").addEventListener("popupshowing", this, false);
                $("tabContextMenu").addEventListener("popupshowing", this, false);
                $("toolbar-context-menu").addEventListener("popupshowing", this, false);
                $("menu_FilePopup").addEventListener("popupshowing", this, false);
                $("menu_ToolsPopup").addEventListener("popupshowing", this, false);

                // move menuitems to Hamburger menu when firstly clicks the PanelUI button 
                PanelUI.mainView.addEventListener("ViewShowing", this.moveToAppMenu, {
                    once: true
                });

                // PanelUI 增加 CustomShowing 支持
                PanelUI.mainView.addEventListener("ViewShowing", this);

                this.APP_LITENER_REMOVER = function () {
                    PanelUI.mainView.removeEventListener("ViewShowing", this);
                }

                this.identityBox = $('identity-icon') || $('identity-box')
                if (enableidentityBoxContextMenu && this.identityBox) {
                    // SSL 小锁右键菜单
                    this.identityBox.addEventListener("click", this, false);
                    this.identityBox.setAttribute('contextmenu', false);
                    var popup = $("mainPopupSet").appendChild($C('menupopup', {
                        id: 'identity-box-contextmenu'
                    }));
                    popup.appendChild($C("menuseparator", {
                        id: "addMenu-identity-insertpoint",
                        class: "addMenu-insert-point",
                        hidden: true
                    }));
                    $("mainPopupSet").appendChild(popup);
                    MENU_ATTRS['ident'] = {
                        current: "ident",
                        submenu: "IdentMenu",
                        groupmenu: "IdentGroup",
                        insertId: 'addMenu-identity-insertpoint'
                    }
                }

                // 增加工具菜单
                var ins = $("devToolsSeparator");
                ins.parentNode.insertBefore($C("menuitem", {
                    id: "addMenu-rebuild",
                    label: $L('addmenuplus label'),
                    tooltiptext: $L('addmenuplus tooltip'),
                    oncommand: "setTimeout(function(){ addMenu.rebuild(true); }, 10);",
                    onclick: "if (event.button == 2) { event.preventDefault(); addMenu.edit(addMenu.FILE); }",
                }), ins);

                // Photon Compact
                if (enableContentAreaContextMenuCompact)
                    $("contentAreaContextMenu").setAttribute("photoncompact", "true");

                // 响应鼠标键释放事件（eg：获取选中文本）
                (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener("mouseup", this, false);

                // 响应标签修改事件
                gBrowser.tabContainer.addEventListener('TabAttrModified', this);

                this.style = addStyle(css);
                this.rebuild();
            },
            destroy: function () {
                ChromeUtils.unregisterWindowActor('AddMenu');
                $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
                $("tabContextMenu").removeEventListener("popupshowing", this, false);
                $("toolbar-context-menu").removeEventListener("popupshowing", this, false);
                $("menu_FilePopup").removeEventListener("popupshowing", this, false);
                $("menu_ToolsPopup").removeEventListener("popupshowing", this, false);
                $("contentAreaContextMenu").removeAttribute("photoncompact");
                if (typeof this.APP_LITENER_REMOVER === "function")
                    this.APP_LITENER_REMOVER();
                (gBrowser.mPanelContainer || gBrowser.tabpanels).removeEventListener("mouseup", this, false);
                gBrowser.tabContainer.removeEventListener('TabAttrModified', this);
                this.removeMenuitem();
                $$('#addMenu-rebuild, .addMenu-insert-point').forEach(function (e) {
                    e.parentNode.removeChild(e)
                });
                if ($('identity-box-contextmenu')) {
                    var popup = $('identity-box-contextmenu');
                    popup.parentNode.removeChild(popup);
                }
                if (this.identityBox) {
                    this.identityBox.removeAttribute('contextmenu');
                    this.identityBox.removeEventListener("click", this, false);
                }
                if (this.style && this.style.parentNode) this.style.parentNode.removeChild(this.style);
                if (this.style2 && this.style2.parentNode) this.style2.parentNode.removeChild(this.style2);
                delete window.addMenu;
            },
            handleEvent: function (event) {
                switch (event.type) {
                    case "ViewShowing":
                    case "popupshowing":
                        if (event.target != event.currentTarget) return;
                        if (enableFileRefreshing) {
                            this.updateModifiedFile();
                        }

                        event.target.querySelectorAll(`.addMenu`).forEach(m => {
                            // 强制去除隐藏属性
                            m.removeAttribute("hidden");
                            // 显示时自动更新标签
                            if (m.hasAttribute('onshowinglabel')) {
                                onshowinglabelMaxLength = onshowinglabelMaxLength || 15;
                                var sel = addMenu.convertText(m.getAttribute('onshowinglabel'))
                                if (sel && sel.length > 15)
                                    sel = sel.substr(0, 15) + "...";
                                m.setAttribute('label', sel);
                            }
                        });

                        let insertPoint = "";

                        if (event.target.id == 'contentAreaContextMenu') {
                            var state = [];
                            if (gContextMenu.onTextInput)
                                state.push("input");
                            if (gContextMenu.isContentSelected || gContextMenu.isTextSelected)
                                state.push("select");
                            if (gContextMenu.onLink || event.target.querySelector("#context-openlinkincurrent").getAttribute("hidden") !== "true")
                                state.push(gContextMenu.onMailtoLink ? "mailto" : "link");
                            if (gContextMenu.onCanvas)
                                state.push("canvas image");
                            if (gContextMenu.onImage)
                                state.push("image");
                            if (gContextMenu.onVideo || gContextMenu.onAudio)
                                state.push("media");
                            event.currentTarget.setAttribute("addMenu", state.join(" "));

                            insertPoint = "addMenu-page-insertpoint";
                        }

                        if (event.target.id === "toolbar-context-menu") {
                            let triggerNode = event.target.triggerNode;
                            var state = [];
                            const map = {
                                'toolbar-menubar': 'menubar',
                                'TabsToolbar': 'tabs',
                                'nav-bar': 'navbar',
                                'PersonalToolbar': 'personal',
                            }
                            Object.keys(map).map(e => $(e).contains(triggerNode) && state.push(map[e]));
                            if (triggerNode && triggerNode.localName === "toolbarbutton") {
                                state.push("button");
                            }
                            event.currentTarget.setAttribute("addMenu", state.join(" "));

                            insertPoint = "addMenu-nav-insertpoint";
                        }

                        if (event.target.id === "tabContextMenu") {
                            insertPoint = "addMenu-tab-insertpoint";
                        }

                        if (event.target.id === "identity-box-contextmenu") {
                            insertPoint = "addMenu-identity-insertpoint";
                        }

                        if (event.target.id === "menu_FilePopup" || event.target.id === "appMenu-protonMainView") {
                            insertPoint = "addMenu-app-insertpoint";
                        }

                        if (event.target.id === "menu_ToolsPopup") {
                            insertPoint = "addMenu-tool-insertpoint";
                        }

                        this.customShowings.filter(obj => obj.insertPoint === insertPoint).forEach(function (obj) {
                            var curItem = obj.item;
                            try {
                                eval('(' + obj.fnSource + ').call(curItem, curItem)');
                            } catch (ex) {
                                console.error($L('custom showing method error'), obj.fnSource, ex);
                            }
                        });

                        break;
                    case 'mouseup':
                        // get selected text
                        if (content) {
                            // 内置页面
                            this.setSelectedText(BrowserOrSelectionUtils.getSelectionDetails(content).fullText);
                        } else {
                            // 网页
                            let actor = gBrowser.selectedBrowser.browsingContext.currentWindowGlobal.getActor("AddMenu");
                            actor.sendAsyncMessage("AM:GetSelectedText", {});
                        }
                        break;
                    case 'click':
                        if (event.button == 2 && event.target.id === this.identityBox.id)
                            $("identity-box-contextmenu").openPopup(event.target, "after_pointer", 0, 0, true, false);

                        break;
                    case 'TabAttrModified':
                        let tab = event.target;
                        if (content) return;
                        if (typeof tab === "undefined")
                            return;
                        try {
                            let hash = calculateHashFromStr(tab.linkedBrowser.currentURI.spec)
                            tab.faviconHash = hash;
                            let actor = tab.linkedBrowser.browsingContext.currentWindowGlobal.getActor("AddMenu");
                            actor.sendAsyncMessage("AM:GetFaviconLink", { hash: hash });
                        } catch (error) { }
                        break;
                }
                function calculateHashFromStr(data) {
                    // Lazily create a reusable hasher
                    let gCryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(
                        Ci.nsICryptoHash
                    );

                    gCryptoHash.init(gCryptoHash.MD5);

                    // Convert the data to a byte array for hashing
                    gCryptoHash.update(
                        data.split("").map(c => c.charCodeAt(0)),
                        data.length
                    );
                    // Request the has result as ASCII base64
                    return gCryptoHash.finish(true);
                }

            },
            updateModifiedFile: function () {
                if (!this.FILE.exists()) return;

                if (this._modifiedTime != this.FILE.lastModifiedTime) {
                    this._modifiedTime = this.FILE.lastModifiedTime;

                    setTimeout(function () {
                        addMenu.rebuild(true);
                    }, 10);
                }
            },
            onCommand: function (event) {
                var menuitem = event.target;
                var text = menuitem.getAttribute("text") || "";
                var keyword = menuitem.getAttribute("keyword") || "";
                var url = menuitem.getAttribute("url") || "";
                var where = menuitem.getAttribute("where") || "";
                var exec = menuitem.getAttribute("exec") || "";

                if (keyword) {
                    let param = (text ? (text = this.convertText(text)) : "");
                    let engine = keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(keyword);
                    if (engine) {
                        if (isPromise(engine)) {
                            engine.then(function (engine) {
                                let submission = engine.getSubmission(param);
                                addMenu.openCommand(event, submission.uri.spec, where);
                            });
                        } else {
                            let submission = engine.getSubmission(param);
                            this.openCommand(event, submission.uri.spec, where);
                        }
                    } else {
                        PlacesUtils.keywords.fetch(keyword || '').then(entry => {
                            if (!entry) return;
                            // 文字化けの心配が…
                            let newurl = entry.url.href.replace('%s', encodeURIComponent(param));
                            this.openCommand(event, newurl, where);
                        });
                    }
                } else if (url)
                    this.openCommand(event, this.convertText(url), where);
                else if (exec)
                    this.exec(exec, this.convertText(text));
                else if (text)
                    this.copy(this.convertText(text));
            },
            openCommand: function (event, url, where, postData) {
                var uri;
                try {
                    uri = Services.io.newURI(url, null, null);
                } catch (e) {
                    return this.log(U($L('url is invalid')).replace("%s", url));
                }
                if (uri.scheme === "javascript") {
                    try {
                        gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                    } catch (e) {
                        gBrowser.loadURI(uri, { triggeringPrincipal: gBrowser.contentPrincipal });
                    }
                } else if (where) {
                    if (this.appVersion < 78) {
                        openUILinkIn(uri.spec, where, false, postData || null);
                    } else {
                        openWebLinkIn(uri.spec, where, {
                            postData: postData || null,
                            triggeringPrincipal: where === 'current' ?
                                gBrowser.selectedBrowser.contentPrincipal : (
                                    /^(f|ht)tps?:/.test(uri.spec) ?
                                        Services.scriptSecurityManager.createNullPrincipal({
                                            userContextId: gBrowser.selectedBrowser.getAttribute(
                                                "userContextId"
                                            )
                                        }) :
                                        Services.scriptSecurityManager.getSystemPrincipal()
                                )
                        });
                    }
                } else if (event.button == 1) {
                    if (this.appVersion < 78) {
                        openUILinkIn(uri.spec, 'tab');
                    } else {
                        openWebLinkIn(uri.spec, 'tab', {
                            triggeringPrincipal: /^(f|ht)tps?:/.test(uri.spec) ?
                                Services.scriptSecurityManager.createNullPrincipal({
                                    userContextId: gBrowser.selectedBrowser.getAttribute(
                                        "userContextId"
                                    )
                                }) : Services.scriptSecurityManager.getSystemPrincipal()
                        });
                    }
                } else {
                    if (addMenu.appVersion < 78)
                        openUILink(uri.spec, event);
                    else {
                        openUILink(uri.spec, event, {
                            triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                        });
                    }
                }
            },
            exec: function (path, arg) {
                var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
                var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
                try {
                    var a;
                    if (typeof arg == "undefined") arg = []; // fix slice error
                    if (typeof arg == 'string' || arg instanceof String) {
                        a = arg.split(/\s+/)
                    } else if (Array.isArray(arg)) {
                        a = arg;
                    } else {
                        a = [arg];
                    }

                    file.initWithPath(path);
                    if (!file.exists()) {
                        Cu.reportError($L("file not found", path));
                        return;
                    }

                    // Linux 下目录也是 executable
                    if (!file.isDirectory() && file.isExecutable()) {
                        process.init(file);
                        process.runw(false, a, a.length);
                    } else {
                        file.launch();
                    }
                } catch (e) {
                    this.log(e);
                }
            },
            handleRelativePath: function (path, parentPath) {
                if (path) {
                    var ffdir = parentPath ? parentPath : Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile).path;
                    // windows 的目录分隔符不一样
                    if (this.platform === "win") {
                        path = path.replace(/\//g, '\\');
                        if (/^(\\)/.test(path)) {
                            return ffdir + path;
                        }
                    } else {
                        path = path.replace(/\\/g, '//');
                        if (/^(\/\/)/.test(path)) {
                            return ffdir + path.replace(/^\/\//, "/");
                        }
                    }
                    return path;
                }
            },
            moveToAppMenu: async function (_e) {
                let ins = document.getElementById('addMenu-app-insertpoint');
                if (ins && ins.localName === 'menuseparator') {
                    let separator = $('appMenu-quit-button2').previousSibling;
                    if (separator) {
                        ins.remove();
                        // addMenu.removeMenuitem();
                        ins = $C('toolbarseparator', {
                            'id': 'addMenu-app-insertpoint',
                            class: "addMenu-insert-point",
                            hidden: true
                        });
                        separator.parentNode.insertBefore(ins, separator);
                        addMenu.rebuild();
                    }
                }
            },
            rebuild: function (isAlert) {
                var aFile = this.FILE;

                if (!aFile || !aFile.exists() || !aFile.isFile()) {
                    this.log(aFile ? aFile.path : U($L('config file')) + U($L('not exists')));
                    return;
                }

                var data = loadText(aFile);

                var sandbox = new Cu.Sandbox(new XPCNativeWrapper(window));

                sandbox.Components = Components;
                sandbox.Cc = Cc;
                sandbox.Ci = Ci;
                sandbox.Cr = Cr;
                sandbox.Cu = Cu;
                sandbox.Services = Services;
                sandbox.locale = this.locale;
                sandbox.addMenu = this;
                sandbox.$L = $L;

                var includeSrc = "";
                sandbox.include = function (aLeafName) {
                    var data = loadFile(aLeafName);
                    if (data)
                        includeSrc += data + "\n";
                };
                sandbox._css = [];

                Object.values(MENU_ATTRS).forEach(function ({
                    current,
                    submenu,
                    groupmenu
                }) {
                    sandbox["_" + current] = [];
                    if (submenu !== "GroupMenu") {
                        sandbox[current] = function (itemObj) {
                            ps(itemObj, sandbox["_" + current]);
                        }
                    }
                    sandbox[submenu] = function (menuObj) {
                        if (!menuObj)
                            menuObj = {};
                        menuObj._items = [];
                        if (submenu == 'GroupMenu')
                            menuObj._group = true;
                        sandbox["_" + current].push(menuObj);
                        return function (itemObj) {
                            ps(itemObj, menuObj._items);
                        }
                    }
                    if (isDef(groupmenu))
                        sandbox[groupmenu] = function (menuObj) {
                            if (!menuObj)
                                menuObj = {};
                            menuObj._items = [];
                            menuObj._group = true;
                            sandbox["_" + current].push(menuObj);
                            return function (itemObj) {
                                ps(itemObj, menuObj._items);
                            }
                        }
                }, this);

                function ps(item, array) {
                    ("join" in item && "unshift" in item) ? [].push.apply(array, item) :
                        array.push(item);
                }

                try {
                    var lineFinder = new Error();
                    Cu.evalInSandbox("function css(code){ this._css.push(code+'') };\n" + data, sandbox, "1.8");
                    Cu.evalInSandbox(includeSrc, sandbox, "1.8");
                } catch (e) {
                    let line = e.lineNumber - lineFinder.lineNumber - 1;
                    this.alert(e + $L("check config file with line", line), null, function () {
                        addMenu.edit(addMenu.FILE, line);
                    });
                    return this.log(e);
                }
                if (this.style2 && this.style2.parentNode)
                    this.style2.parentNode.removeChild(this.style2);
                if (sandbox._css.length)
                    this.style2 = addStyle(sandbox._css.join("\n"));

                this.removeMenuitem();

                this.customShowings = [];
                this.customFrameResult = [];

                Object.values(MENU_ATTRS).forEach(function ({
                    current,
                    submenu,
                    groupmenu,
                    insertId
                }) {
                    if (!sandbox["_" + current] || sandbox["_" + current].length == 0) return;
                    let insertPoint = $(insertId);
                    this.createMenuitem(sandbox["_" + current], insertPoint);
                }, this);


                if (isAlert) this.alert(U($L('config has reload')));
            },
            newGroupMenu: function (menuObj, opt) {
                var group = $C('menugroup');

                // 增加 onshowing 事件
                if (menuObj.onshowing) {
                    this.customShowings.push({
                        item: group,
                        insertPoint: opt.insertPoint.id,
                        fnSource: menuObj.onshowing
                    });
                    delete menuObj.onshowing;
                }

                if (menuObj.framescript) {
                    if (typeof menuObj.framescript === "function") {
                        menuObj.framescript = menuObj.framescript.toString();
                    } else if (menuObj.framescript.keyword && menuObj.framescript.result && menuObj.framescript.script) {
                        this.customFrameResult.push({
                            keyword: menuObj.framescript.keyword,
                            result: menuObj.framescript.result,
                        })
                        if (typeof menuObj.framescript.script === "function") {
                            menuObj.framescript = menuObj.framescript.script.toString();
                        }
                    }
                    menuObj.framescript = btoa(encodeURIComponent(menuObj.framescript));
                }

                Object.keys(menuObj).map(function (key) {
                    var val = menuObj[key];
                    if (key === "_items") return;
                    if (key === "_group") return;
                    if (typeof val == "function")
                        menuObj[key] = val = "(" + val.toString() + ").call(this, event);";
                    group.setAttribute(key, val);
                }, this);
                let cls = group.classList;
                cls.add('addMenu');

                // 表示 / 非表示の設定
                if (menuObj.condition)
                    this.setCondition(group, menuObj.condition);

                menuObj._items.forEach(function (obj) {
                    group.appendChild(this.newMenuitem(obj, {
                        isMenuGroup: true
                    }));
                }, this);
                return group;
            },
            newMenu: function (menuObj, opt) {
                opt || (opt = {});
                if (menuObj._group) {
                    return this.newGroupMenu(menuObj, opt);
                }
                var isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                    separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                    menuitemType = isAppMenu ? "toolbarbutton" : "menu",
                    menu = $C(menuitemType),
                    popup,
                    panelId;

                // fix for appmenu
                const viewCache = ($('appMenu-viewCache') && $('appMenu-viewCache').content) || $('appMenu-multiView');
                if (isAppMenu && viewCache) {
                    menu.setAttribute('closemenu', "none");
                    panelId = menuObj.id ? menuObj.id + "-panel" : "addMenu-panel-" + this.panelId++;
                    popup = viewCache.appendChild($C('panelview', {
                        'id': panelId,
                        'class': 'addMenu PanelUI-subView'
                    }));
                    popup = popup.appendChild($C('vbox', {
                        class: 'panel-subview-body',
                        panelId: panelId
                    }));
                } else {
                    popup = menu.appendChild($C("menupopup"));
                }

                if (menuObj.onshowing) {
                    this.customShowings.push({
                        item: menu,
                        insertPoint: opt.insertPoint.id,
                        fnSource: menuObj.onshowing.toString()
                    });
                    delete menuObj.onshowing;
                }

                if (menuObj.framescript) {
                    if (typeof menuObj.framescript === "function") {
                        menuObj.framescript = menuObj.framescript.toString();
                    } else if (menuObj.framescript.keyword && menuObj.framescript.result && menuObj.framescript.script) {
                        this.customFrameResult.push({
                            keyword: menuObj.framescript.keyword,
                            result: menuObj.framescript.result,
                        })
                        if (typeof menuObj.framescript.script === "function") {
                            menuObj.framescript = menuObj.framescript.script.toString();
                        }
                    }
                    menuObj.framescript = btoa(encodeURIComponent(menuObj.framescript));
                }

                for (let key in menuObj) {
                    let val = menuObj[key];
                    if (key === "_items") continue;
                    if (typeof val == "function")
                        menuObj[key] = val = "(" + val.toString() + ").call(this, event);"
                    menu.setAttribute(key, val);

                }

                let cls = menu.classList;
                cls.add("addMenu");
                if (isAppMenu) {
                    cls.add("subviewbutton");
                    cls.add("subviewbutton-nav");
                } else {
                    cls.add("menu-iconic");
                }


                // 表示 / 非表示の設定
                if (menuObj.condition)
                    this.setCondition(menu, menuObj.condition);

                menuObj._items.forEach(function (obj) {
                    popup.appendChild(this.newMenuitem(obj, opt));
                }, this);

                // menu に label が無い場合、最初の menuitem の label 等を持ってくる
                // menu 部分をクリックで実行できるようにする(splitmenu みたいな感じ)
                if (isAppMenu) {
                    menu.setAttribute('oncommand', `PanelUI.showSubView('${panelId}', this)`);
                } else if (!menu.hasAttribute('label')) {
                    let firstItem = menu.querySelector('menuitem');
                    if (firstItem) {
                        let command = firstItem.getAttribute('command');
                        if (command)
                            firstItem = document.getElementById(command) || firstItem;
                        ['label', 'accesskey', 'image', 'icon'].forEach(function (n) {
                            if (!menu.hasAttribute(n) && firstItem.hasAttribute(n))
                                menu.setAttribute(n, firstItem.getAttribute(n));
                        }, this);
                        menu.setAttribute('onclick', "\
                        if (event.target != event.currentTarget) return;\
                        var firstItem = event.currentTarget.querySelector('menuitem');\
                        if (!firstItem) return;\
                        if (event.button === 1) {\
                            checkForMiddleClick(firstItem, event);\
                        } else {\
                            firstItem.doCommand();\
                            closeMenus(event.currentTarget);\
                        }\
                    ");
                    }
                }
                return menu;
            },
            newMenuitem: function (obj, opt) {
                opt || (opt = {});

                var menuitem,
                    isAppMenu = opt.insertPoint && opt.insertPoint.localName === "toolbarseparator" && opt.insertPoint.id === 'addMenu-app-insertpoint',
                    separatorType = isAppMenu ? "toolbarseparator" : "menuseparator",
                    menuitemType = isAppMenu ? "toolbarbutton" : "menuitem",
                    noDefaultLabel = false;

                // label == separator か必要なプロパティが足りない場合は区切りとみなす
                if (obj.label === "separator" ||
                    (!obj.label && !obj.image && !obj.text && !obj.keyword && !obj.url && !obj.oncommand && !obj.command)) {
                    menuitem = $C(separatorType);
                } else if (obj.oncommand || obj.command) {
                    let org = obj.command ? document.getElementById(obj.command) : null;
                    if (org && org.localName === separatorType) {
                        menuitem = $C(separatorType);
                    } else {
                        menuitem = $C(menuitemType);
                        if (obj.command)
                            menuitem.setAttribute("command", obj.command);

                        noDefaultLabel = !obj.label;
                        if (noDefaultLabel)
                            obj.label = obj.command || obj.oncommand;
                    }
                } else {
                    menuitem = $C(menuitemType);

                    // property fix
                    noDefaultLabel = !obj.label;
                    if (noDefaultLabel)
                        obj.label = obj.exec || obj.keyword || obj.url || obj.text;

                    if (obj.keyword && !obj.text) {
                        let index = obj.keyword.search(/\s+/);
                        if (index > 0) {
                            obj.text = obj.keyword.substr(index).trim();
                            obj.keyword = obj.keyword.substr(0, index);
                        }
                    }

                    if (obj.where && /\b(tab|tabshifted|window|current)\b/i.test(obj.where))
                        obj.where = RegExp.$1.toLowerCase();

                    if (obj.where && !("acceltext" in obj))
                        obj.acceltext = obj.where;

                    if (!obj.condition && (obj.url || obj.text)) {
                        // 表示 / 非表示の自動設定
                        let condition = "";
                        if (this.rSEL.test(obj.url || obj.text)) condition += " select";
                        if (this.rLINK.test(obj.url || obj.text)) condition += " link";
                        if (this.rEMAIL.test(obj.url || obj.text)) condition += " mailto";
                        if (this.rIMAGE.test(obj.url || obj.text)) condition += " image";
                        if (this.rMEDIA.test(obj.url || obj.text)) condition += " media";
                        if (condition)
                            obj.condition = condition;
                    }

                    if (obj.exec) {
                        obj.exec = this.handleRelativePath(obj.exec);
                    }
                }

                // 右键第一层菜单添加 onpopupshowing 事件
                if (opt.isTopMenuitem && obj.onshowing) {
                    this.customShowings.push({
                        item: menuitem,
                        insertPoint: opt.insertPoint.id,
                        fnSource: obj.onshowing.toString()
                    });
                    delete obj.onshowing;
                }

                if (obj.framescript) {
                    if (typeof obj.framescript === "function") {
                        obj.framescript = obj.framescript.toString();
                    } else if (obj.framescript.keyword && obj.framescript.result && obj.framescript.script) {
                        this.customFrameResult.push({
                            keyword: obj.framescript.keyword,
                            result: obj.framescript.result,
                        })
                        if (typeof obj.framescript.script === "function") {
                            obj.framescript = obj.framescript.script.toString();
                        }
                    }
                    obj.framescript = btoa(encodeURIComponent(obj.framescript));
                }

                for (let key in obj) {
                    let val = obj[key];
                    if (key === "command") continue;
                    if (typeof val == "function")
                        obj[key] = val = "(" + val.toString() + ").call(this, event);";
                    menuitem.setAttribute(key, val);
                }

                if (noDefaultLabel && menuitem.localName !== separatorType) {
                    if (this.supportLocalization && obj['data-l10n-href'] && obj["data-l10n-href"].endsWith(".ftl") && obj['data-l10n-id']) {
                        // Localization 支持
                        let strings = new Localization([obj["data-l10n-href"]]);
                        strings.formatValue([obj['data-l10n-id']]).then(
                            text => {
                                menuitem.setAttribute('label', text || menuitem.getAttribute("label"));
                            }
                        )
                    } else if (obj.keyword) {
                        // 调用搜索引擎 Label hack
                        let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                        if (isPromise(engine)) {
                            engine.then(s => {
                                if (s && s._name) menuitem.setAttribute('label', s._name);
                            });
                        } else {
                            if (engine && engine._name) menuitem.setAttribute('label', engine._name);
                        }
                    }
                }

                /** obj を属性にする
                 for (let [key, val] in Iterator(obj)) {
                if (key === "command") continue;
                if (typeof val == "function")
                    obj[key] = val = "(" + val.toString() + ").call(this, event);";
                    menuitem.setAttribute(key, val);
                }**/

                var cls = menuitem.classList;
                cls.add("addMenu");

                if (isAppMenu) {
                    if (menuitem.localName == "toolbarbutton") cls.add("subviewbutton");
                } else {
                    cls.add("menuitem-iconic");
                }
                // 表示 / 非表示の設定
                if (obj.condition)
                    this.setCondition(menuitem, obj.condition);

                // separator はここで終了
                if (menuitem.localName == "menuseparator")
                    return menuitem;

                if (!obj.onclick)
                    menuitem.setAttribute("onclick", "checkForMiddleClick(this, event)");

                // 给 MenuGroup 的菜单加上 tooltiptext
                if (opt.isMenuGroup && !obj.tooltiptext && obj.label) {
                    menuitem.setAttribute('tooltiptext', obj.label);
                }

                // oncommand, command はここで終了
                if (obj.oncommand || obj.command)
                    return menuitem;

                menuitem.setAttribute("oncommand", "addMenu.onCommand(event);");

                // 可能ならばアイコンを付ける
                this.setIcon(menuitem, obj);

                return menuitem;
            },
            createMenuitem: function (itemArray, insertPoint) {
                var chldren = $A(insertPoint.parentNode.children);
                //Symbol.iterator
                for (let obj of itemArray) {
                    if (!obj) continue;
                    let menuitem;

                    // clone menuitem and set attribute
                    if (obj.id && (menuitem = $(obj.id))) {
                        let dupMenuitem;
                        let isDupMenu = (obj.clone != false);
                        if (isDupMenu) {
                            dupMenuitem = menuitem.cloneNode(true);

                            // 隐藏原菜单
                            // menuitem.classList.add("addMenuHide");
                        } else {
                            dupMenuitem = menuitem;
                            // 增加用于还原已移动菜单的标记
                            if (dupMenuitem)
                                dupMenuitem.parentNode.insertBefore($C(insertPoint.localName, {
                                    'original-id': dupMenuitem.getAttribute('id'),
                                    hidden: true,
                                    class: 'addMenuOriginal',
                                }), dupMenuitem);
                        }
                        if (obj.framescript) {
                            if (typeof obj.framescript === "function") {
                                obj.framescript = obj.framescript.toString();
                            } else if (obj.framescript.keyword && obj.framescript.result && obj.framescript.script) {
                                this.customFrameResult.push({
                                    keyword: obj.framescript.keyword,
                                    result: obj.framescript.result,
                                })
                                if (typeof obj.framescript.script === "function") {
                                    obj.framescript = obj.framescript.script.toString();
                                }
                            }
                            obj.framescript = btoa(encodeURIComponent(obj.framescript));
                        }
                        for (let key in obj) {
                            let val = obj[key];
                            if (typeof val == "function")
                                obj[key] = val = "(" + val.toString() + ").call(this, event);";

                            dupMenuitem.setAttribute(key, val);

                        }

                        // 如果没有则添加 menuitem-iconic 或 menu-iconic，给菜单添加图标用。
                        let type = dupMenuitem.nodeName,
                            cls = dupMenuitem.classList;
                        if (type == 'menuitem' || type == 'menu')
                            if (!cls.contains(type + '-iconic'))
                                cls.add(type + '-iconic');

                        if (!cls.contains('addMenu'))
                            cls.add('addMenu');
                        if (!isDupMenu && !cls.contains('addMenuNot'))
                            cls.add('addMenuNot');

                        // // 没有插入位置的默认放在原来那个菜单的后面
                        // if(isDupMenu && !obj.insertAfter && !obj.insertBefore && !obj.position){
                        //     obj.insertAfter = obj.id;
                        // }
                        let noMove = !isDupMenu;
                        insertMenuItem(obj, dupMenuitem, noMove);
                        continue;
                    }

                    menuitem = obj._items ? this.newMenu(obj, {
                        insertPoint: insertPoint
                    }) : this.newMenuitem(obj, {
                        isTopMenuitem: true,
                        insertPoint: insertPoint
                    });

                    insertMenuItem(obj, menuitem);

                }

                function insertMenuItem(obj, menuitem, noMove) {
                    let ins;
                    if (obj.parent && (ins = $(obj.parent))) {
                        ins.appendChild(menuitem);
                        return;
                    }
                    if (obj.insertAfter && (ins = $(obj.insertAfter))) {
                        ins.parentNode.insertBefore(menuitem, ins.nextSibling);
                        return;
                    }
                    if (obj.insertBefore && (ins = $(obj.insertBefore))) {
                        ins.parentNode.insertBefore(menuitem, ins);
                        return;
                    }
                    if (obj.position && parseInt(obj.position, 10) > 0) {
                        (ins = chldren[parseInt(obj.position, 10) - 1]) ?
                            ins.parentNode.insertBefore(menuitem, ins) :
                            insertPoint.parentNode.appendChild(menuitem);
                        return;
                    }
                    if (!noMove) {
                        insertPoint.parentNode.insertBefore(menuitem, insertPoint);
                    }
                }
            },
            removeMenuitem: function () {
                var remove = function (e) {
                    if (e.classList.contains('addMenuNot')) return;
                    e.parentNode.removeChild(e);
                };

                $$('.addMenuOriginal').forEach((e) => {
                    let id = e.getAttribute('original-id');
                    if (id && $(id))
                        e.parentNode.insertBefore($(id), e);
                    e.parentNode.removeChild(e);
                });

                $$('menu.addMenu, menugroup.addMenu').forEach(remove);
                $$('.addMenu').forEach(remove);
                // 恢复原隐藏菜单
                $$('.addMenuHide').forEach(function (e) {
                    e.classList.remove('addMenuHide');
                });
            },
            setIcon: function (menu, obj) {
                if (menu.hasAttribute("src") || menu.hasAttribute("image") || menu.hasAttribute("icon"))
                    return;

                if (obj.exec) {
                    var aFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                    try {
                        aFile.initWithPath(obj.exec);
                    } catch (e) {
                        return;
                    }
                    // if (!aFile.exists() || !aFile.isExecutable()) {
                    if (!aFile.exists()) {
                        menu.setAttribute("disabled", "true");
                    } else {
                        if (aFile.isFile()) {
                            let fileURL = this.getURLSpecFromFile(aFile);
                            menu.setAttribute("image", "moz-icon://" + fileURL + "?size=16");
                        } else {
                            menu.setAttribute("image", "chrome://global/skin/icons/folder.svg");
                        }
                    }
                    return;
                }

                if (obj.keyword) {
                    let engine = obj.keyword === "@default" ? Services.search.getDefault() : Services.search.getEngineByAlias(obj.keyword);
                    if (engine) {
                        if (isPromise(engine)) {
                            engine.then(function (engine) {
                                if (engine.iconURI) menu.setAttribute("image", engine.iconURI.spec);
                            });
                        } else if (engine.iconURI) {
                            menu.setAttribute("image", engine.iconURI.spec);
                        }
                        return;
                    }
                }
                var setIconCallback = function (url) {
                    let uri, iconURI;
                    try {
                        uri = Services.io.newURI(url, null, null);
                    } catch (e) {
                        this.log(e)
                    }
                    if (!uri) return;

                    menu.setAttribute("scheme", uri.scheme);
                    PlacesUtils.favicons.getFaviconDataForPage(uri, {
                        onComplete: function (aURI, aDataLen, aData, aMimeType) {
                            try {
                                // javascript: URI の host にアクセスするとエラー
                                menu.setAttribute("image", aURI && aURI.spec ?
                                    "moz-anno:favicon:" + aURI.spec :
                                    "moz-anno:favicon:" + uri.scheme + "://" + uri.host + "/favicon.ico");
                            } catch (e) { }
                        }
                    });
                }
                PlacesUtils.keywords.fetch(obj.keyword || '').then(entry => {
                    let url;
                    if (entry) {
                        url = entry.url.href;
                    } else {
                        url = (obj.url + '').replace(this.regexp, "");
                    }
                    setIconCallback(url);
                }, e => {
                    this.log(e)
                }).catch(e => { });
            },
            setCondition: function (menu, condition) {
                if (/\bnormal\b/i.test(condition)) {
                    menu.setAttribute("condition", "normal");
                } else {
                    let match = condition.toLowerCase().match(/\b(?:no)?(?:select|link|mailto|image|canvas|media|input)\b/ig);
                    if (!match || !match[0])
                        return;
                    match = match.filter(function (c, i, a) {
                        return a.indexOf(c) === i
                    });
                    menu.setAttribute("condition", match.join(" "));
                }
            },
            convertText: function (text) {
                var context = gContextMenu || { // とりあえずエラーにならないようにオブジェクトをでっち上げる
                    link: {
                        href: "",
                        host: ""
                    },
                    target: {
                        alt: "",
                        title: ""
                    },
                    __noSuchMethod__: function (id, args) {
                        return ""
                    },
                };
                let tab = document.popupNode || TabContextMenu.contextTab || gBrowser.selectedTab  || gBrowser.mCurrentTab;
                var bw = gContextMenu ? context.browser : tab.linkedBrowser;

                return text.replace(this.regexp, function (str) {
                    str = str.toUpperCase().replace("%LINK", "%RLINK");
                    if (str.indexOf("_HTMLIFIED") >= 0)
                        return htmlEscape(convert(str.replace("_HTMLIFIED", "")));
                    if (str.indexOf("_HTML") >= 0)
                        return htmlEscape(convert(str.replace("_HTML", "")));
                    if (str.indexOf("_ENCODE") >= 0)
                        return encodeURIComponent(convert(str.replace("_ENCODE", "")));
                    return convert(str);
                });

                function convert(str) {
                    switch (str) {
                        case "%T":
                            return bw.contentTitle;
                        case "%TITLE%":
                            return bw.contentTitle;
                        case "%TITLES%":
                            return bw.contentTitle.replace(/\s-\s.*/i, "").replace(/_[^\[\]【】]+$/, "");
                        case "%U":
                            return bw.documentURI.spec;
                        case "%URL%":
                            return bw.documentURI.spec;
                        case "%H":
                            return bw.documentURI.host;
                        case "%HOST%":
                            return bw.documentURI.host;
                        case "%S":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || "";
                        case "%SEL%":
                            return (context.selectionInfo && context.selectionInfo.fullText) || addMenu.getSelectedText() || "";
                        case "%L":
                            return context.linkURL || "";
                        case "%RLINK%":
                            return context.linkURL || "";
                        case "%RLINK_HOST%":
                            return context.link.host || "";
                        case "%RLINK_TEXT%":
                            return context.linkText() || "";
                        case "%RLINK_OR_URL%":
                            if ("linkURL" in context) {
                                return context.linkURL;
                            } else {
                                return bw.documentURI.spec;
                            }
                        case "%RLT_OR_UT%":
                            return context.onLink && context.linkText() || bw.contentTitle; // 链接文本或网页标题
                        case "%IMAGE_ALT%":
                            return context.target.alt || "";
                        case "%IMAGE_TITLE%":
                            return context.target.title || "";
                        case "%I":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_URL%":
                            return context.imageURL || context.imageInfo.currentSrc || "";
                        case "%IMAGE_BASE64%":
                            return typeof context.imageURL === "undefined" ? img2base64(context.mediaURL) : img2base64(context.imageURL);
                        case "%SVG_BASE64%":
                            let url = context.linkURL || bw.documentURI.spec || "";
                            return url.endsWith("svg") ? svg2base64(url) : "";
                        case "%M":
                            return context.mediaURL || "";
                        case "%MEDIA_URL%":
                            return context.mediaURL || "";
                        case "%P":
                            return readFromClipboard() || "";
                        case "%CLIPBOARD%":
                            return readFromClipboard() || "";
                        case "%FAVICON%":
                            return tab.faviconUrl || gBrowser.getIcon(tab ? tab : null) || "";
                        case "%FAVICON_BASE64%":
                            let image = tab.faviconUrl || gBrowser.getIcon(tab ? tab : null);
                            if (image && image.startsWith("data:image")) return image;
                            return img2base64(image);
                        case "%EMAIL%":
                            return getEmailAddress() || "";
                        case "%EOL%":
                            return "\r\n";
                    }
                    return str;
                }

                function htmlEscape(s) {
                    return (s + "").replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;").replace(/\'/g, "&apos;");
                }

                function getEmailAddress() {
                    var url = context.linkURL;
                    if (!url || !/^mailto:([^?]+).*/i.test(url)) return "";
                    var addresses = RegExp.$1;
                    try {
                        var characterSet = context.target.ownerDocument.characterSet;
                        const textToSubURI = Cc['@mozilla.org/intl/texttosuburi;1'].getService(Ci.nsITextToSubURI);
                        addresses = textToSubURI.unEscapeURIForUI(characterSet, addresses);
                    } catch (ex) { }
                    return addresses;
                }

                function img2base64(imgSrc, imgType) {
                    if (typeof imgSrc == 'undefined') return "";
                    imgType = imgType || "image/png";
                    const NSURI = "http://www.w3.org/1999/xhtml";
                    var img = new Image();
                    var that = this;
                    var canvas,
                        isCompleted = false;
                    img.onload = function () {
                        var width = this.naturalWidth,
                            height = this.naturalHeight;
                        if (that.appVersion <= 72) {
                            canvas = document.createXULElementNS(NSURI, "canvas");
                        } else {
                            canvas = document.createElementNS(NSURI, "canvas")
                        }
                        canvas.width = width;
                        canvas.height = height;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(this, 0, 0);
                        isCompleted = true;
                    };
                    img.onerror = function () {
                        Cu.reportError($L('could not load', imgSrc));
                        isCompleted = true;
                    };
                    img.src = imgSrc;

                    var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
                    while (!isCompleted) {
                        thread.processNextEvent(true);
                    }

                    var data = canvas ? canvas.toDataURL(imgType) : "";
                    canvas = null;
                    return data;
                }

                function svg2base64(svgSrc) {
                    if (typeof svgSrc == 'undefined') return "";
                    var xmlhttp = new XMLHttpRequest();
                    xmlhttp.open("GET", svgSrc, false);
                    xmlhttp.send();
                    var svg = xmlhttp.responseText;
                    // svg string to data url
                    var svg64 = "data:image/svg+xml;base64," + btoa(svg);
                    return svg64;
                }
            },
            setSelectedText: function (text) {
                this._selectedText = text;
            },
            getSelectedText: function () {
                return this._selectedText;
            },
            /**
             * 获取选区
             * @param {*} win
             * @returns
             * @deprecated use getSelectedText instead
             */
            getSelection: function (win) {
                // from getBrowserSelection Fx19
                win || (win = this.focusedWindow);
                var selection = this.getRangeAll(win).join(" ");
                if (!selection) {
                    let element = document.commandDispatcher.focusedElement;
                    let isOnTextInput = function (elem) {
                        return elem instanceof HTMLTextAreaElement ||
                            (elem instanceof HTMLInputElement && elem.mozIsTextField(true));
                    };

                    if (isOnTextInput(element)) {
                        selection = element.QueryInterface(Ci.nsIDOMNSEditableElement)
                            .editor.selection.toString();
                    }
                }

                if (selection) {
                    selection = selection.replace(/^\s+/, "")
                        .replace(/\s+$/, "")
                        .replace(/\s+/g, " ");
                }
                return selection;
            },
            /**
             *
             * @param {*} win
             * @returns
             * @deprecated
             */
            getRangeAll: function (win) {
                win || (win = this.focusedWindow);
                var sel = win.getSelection();
                var res = [];
                for (var i = 0; i < sel.rangeCount; i++) {
                    res.push(sel.getRangeAt(i));
                };
                return res;
            },
            getInputSelection: function (elem) {
                if (elem instanceof HTMLTextAreaElement || elem instanceof HTMLInputElement && elem.mozIsTextField(false))
                    return elem.value.substring(elem.selectionStart, elem.selectionEnd);
                return "";
            },
            getURLSpecFromFile(aFile) {
                var aURL;
                if (typeof userChrome !== "undefined" && typeof userChrome.getURLSpecFromFile !== "undefined") {
                    aURL = userChrome.getURLSpecFromFile(aFile);
                } else if (this.appVersion < 92) {
                    aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
                } else {
                    aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
                }
                return aURL;
            },
            edit: function (aFile, aLineNumber) {
                if (!aFile || !aFile.exists() || !aFile.isFile()) return;

                var editor;
                try {
                    editor = Services.prefs.getComplexValue("view_source.editor.path", Ci.nsIFile);
                } catch (e) { }

                if (!editor || !editor.exists()) {
                    if (useScraptchpad && this.appVersion <= 72) {
                        this.openScriptInScratchpad(window, aFile);
                        return;
                    } else {
                        alert($L('please set editor path'));
                        var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                        fp.init(window, $L('set global editor'), fp.modeOpen);
                        fp.appendFilter($L('executable files'), "*.exe");

                        if (typeof fp.show !== 'undefined') {
                            if (fp.show() == fp.returnCancel || !fp.file)
                                return;
                            else {
                                editor = fp.file;
                                Services.prefs.setCharPref("view_source.editor.path", editor.path);
                            }
                        } else {
                            fp.open(res => {
                                if (res != Ci.nsIFilePicker.returnOK) return;
                                editor = fp.file;
                                Services.prefs.setCharPref("view_source.editor.path", editor.path);
                            });
                        }
                    }
                }

                var aURL = this.getURLSpecFromFile(aFile);
                var aDocument = null;
                var aCallBack = null;
                var aPageDescriptor = null;
                gViewSourceUtils.openInExternalEditor({
                    URL: aURL,
                    lineNumber: aLineNumber
                }, aPageDescriptor, aDocument, aLineNumber, aCallBack);
            },
            /**
             * 使用 Scratchpad 编辑
             * @param {*} parentWindow
             * @param {*} file
             * @deprecated
             */
            openScriptInScratchpad: function (parentWindow, file) {
                let spWin = window.openDialog("chrome://devtools/content/scratchpad/index.xul", "Toolkit:Scratchpad", "chrome,dialog,centerscreen,dependent");
                spWin.top.moveTo(0, 0);
                spWin.top.resizeTo(screen.availWidth, screen.availHeight);

                spWin.addEventListener("load", function spWinLoaded() {
                    spWin.removeEventListener("load", spWinLoaded, false);

                    let Scratchpad = spWin.Scratchpad;
                    Scratchpad.setFilename(file.path);
                    Scratchpad.addObserver({
                        onReady: function () {
                            Scratchpad.removeObserver(this);
                            Scratchpad.importFromFile.call(Scratchpad, file);
                        }
                    });
                }, false);
            },
            copy: function (aText) {
                Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(aText);
                //XULBrowserWindow.statusTextField.label = "Copy: " + aText;
            },
            copyLink: function (copyURL, copyLabel) {
                // generate the Unicode and HTML versions of the Link
                var textUnicode = copyURL;
                var textHtml = ("<a href=\"" + copyURL + "\">" + copyLabel + "</a>");

                // make a copy of the Unicode
                var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                if (!str) return false; // couldn't get string obj
                str.data = textUnicode; // unicode string?

                // make a copy of the HTML
                var htmlstring = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                if (!htmlstring) return false; // couldn't get string obj
                htmlstring.data = textHtml;

                // add Unicode & HTML flavors to the transferable widget
                var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
                if (!trans) return false; //no transferable widget found

                trans.addDataFlavor("text/unicode");
                trans.setTransferData("text/unicode", str, textUnicode.length * 2); // *2 because it's unicode

                trans.addDataFlavor("text/html");
                trans.setTransferData("text/html", htmlstring, textHtml.length * 2); // *2 because it's unicode

                // copy the transferable widget!
                var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
                if (!clipboard) return false; // couldn't get the clipboard

                clipboard.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
                return true;
            },
            alert: function (aMsg, aTitle, aCallback) {
                var callback = aCallback ? {
                    observe: function (subject, topic, data) {
                        if ("alertclickcallback" != topic)
                            return;
                        aCallback.call(null);
                    }
                } : null;
                var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
                alertsService.showAlertNotification(
                    this.appVersion >= 78 ? "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGZpbGw9Im5vbmUiIGQ9Ik0wIDBoMjR2MjRIMHoiLz48cGF0aCBkPSJNMTIgMjJDNi40NzcgMjIgMiAxNy41MjMgMiAxMlM2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTAtNC40NzcgMTAtMTAgMTB6bTAtMmE4IDggMCAxIDAgMC0xNiA4IDggMCAwIDAgMCAxNnpNMTEgN2gydjJoLTJWN3ptMCA0aDJ2NmgtMnYtNnoiLz48L3N2Zz4=" : "chrome://global/skin/icons/information-32.png", aTitle || "addMenuPlus",
                    aMsg + "", !!callback, "", callback);
            },
            $$: function (exp, context, aPartly) {
                context || (context = this.focusedWindow.document);
                var doc = context.ownerDocument || context;
                var elements = $$(exp, doc);
                if (arguments.length <= 2)
                    return elements;
                var sel = doc.defaultView.getSelection();
                return elements.filter(function (q) {
                    return sel.containsNode(q, aPartly)
                });
            },
            log: log,
        }

        function $(id) {
            return document.getElementById(id);
        }

        function $$(exp, doc) {
            return Array.prototype.slice.call((doc || document).querySelectorAll(exp));
        }

        function $A(args) {
            return Array.prototype.slice.call(args);
        }

        function log() {
            console.log(Array.prototype.slice.call(arguments));
        }

        function U(text) {
            return 1 < 'あ'.length ? decodeURIComponent(escape(text)) : text
        };

        function $C(name, attr) {
            const appVersion = Services.appinfo.version.split(".")[0];
            attr || (attr = {});
            var el;
            if (appVersion >= 69) {
                el = document.createXULElement(name);
            } else {
                el = document.createElement(name);
            }
            if (attr) Object.keys(attr).forEach(function (n) {
                el.setAttribute(n, attr[n])
            });
            return el;
        }

        function loadText(aFile) {
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);

            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) { }
            sstream.close();
            fstream.close();
            return data;
        }

        function loadFile(aLeafName) {
            var aFile = Cc["@mozilla.org/file/directory_service;1"]
                .getService(Ci.nsIDirectoryService)
                .QueryInterface(Ci.nsIProperties)
                .get('UChrm', Ci.nsIFile);
            aFile.appendRelativePath(aLeafName);
            if (!aFile.exists() || !aFile.isFile()) return null;
            var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
            var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
            fstream.init(aFile, -1, 0, 0);
            sstream.init(fstream);
            var data = sstream.read(sstream.available());
            try {
                data = decodeURIComponent(escape(data));
            } catch (e) { }
            sstream.close();
            fstream.close();
            return data;
        }

        function addStyle(css) {
            var pi = document.createProcessingInstruction(
                'xml-stylesheet',
                'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
            );
            return document.insertBefore(pi, document.documentElement);
        }

        function saveFile(fileOrName, data) {
            var file;
            if (typeof fileOrName == "string") {
                file = Services.dirsvc.get('UChrm', Ci.nsIFile);
                file.appendRelativePath(fileOrName);
            } else {
                file = fileOrName;
            }

            var suConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
            suConverter.charset = 'UTF-8';
            data = suConverter.ConvertFromUnicode(data);

            var foStream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
            foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0);
            foStream.write(data, data.length);
            foStream.close();
        }

        function capitalize(s) {
            return s && s[0].toUpperCase() + s.slice(1);
        }

        function $L() {
            let key = arguments[0];
            if (key) {
                if (!ADDMENU_LANG[ADDMENU_LOCALE].hasOwnProperty(key)) return capitalize(key);
                let str = ADDMENU_LANG[ADDMENU_LOCALE][key];
                for (let i = 1; i < arguments.length; i++) {
                    str = str.replace("%s", arguments[i]);
                }
                return str;
            } else return "";
        }

        function isDef(v) {
            return v !== undefined && v !== null
        }

        function isPromise(val) {
            return (
                isDef(val) &&
                typeof val.then === 'function' &&
                typeof val.catch === 'function'
            )
        }

        window.addMenu.init();
    })(`
    .addMenuHide
      { display: none !important; }
    #contentAreaContextMenu:not([addMenu~="select"]) .addMenu[condition~="select"],
    #contentAreaContextMenu:not([addMenu~="link"])   .addMenu[condition~="link"],
    #contentAreaContextMenu:not([addMenu~="mailto"]) .addMenu[condition~="mailto"],
    #contentAreaContextMenu:not([addMenu~="image"])  .addMenu[condition~="image"],
    #contentAreaContextMenu:not([addMenu~="canvas"])  .addMenu[condition~="canvas"],
    #contentAreaContextMenu:not([addMenu~="media"])  .addMenu[condition~="media"],
    #contentAreaContextMenu:not([addMenu~="input"])  .addMenu[condition~="input"],
    #contentAreaContextMenu[addMenu~="select"] .addMenu[condition~="noselect"],
    #contentAreaContextMenu[addMenu~="link"]   .addMenu[condition~="nolink"],
    #contentAreaContextMenu[addMenu~="mailto"] .addMenu[condition~="nomailto"],
    #contentAreaContextMenu[addMenu~="image"]  .addMenu[condition~="noimage"],
    #contentAreaContextMenu[addMenu~="canvas"]  .addMenu[condition~="nocanvas"],
    #contentAreaContextMenu[addMenu~="media"]  .addMenu[condition~="nomedia"],
    #contentAreaContextMenu[addMenu~="input"]  .addMenu[condition~="noinput"],
    #contentAreaContextMenu:not([addMenu=""])  .addMenu[condition~="normal"]
      { display: none; }
    #toolbar-context-menu:not([addMenu~="menubar"]) .addMenu[condition~="menubar"],
    #toolbar-context-menu:not([addMenu~="tabs"]) .addMenu[condition~="tabs"],
    #toolbar-context-menu:not([addMenu~="navbar"]) .addMenu[condition~="navbar"],
    #toolbar-context-menu:not([addMenu~="personal"]) .addMenu[condition~="personal"],
    #toolbar-context-menu:not([addMenu~="button"]) .addMenu[condition~="button"],
    #toolbar-context-menu[addMenu~="menubar"] .addMenu[condition~="nomenubar"],
    #toolbar-context-menu[addMenu~="tabs"] .addMenu[condition~="notabs"],
    #toolbar-context-menu[addMenu~="navbar"] .addMenu[condition~="nonavbar"],
    #toolbar-context-menu[addMenu~="personal"] .addMenu[condition~="nopersonal"],
    #toolbar-context-menu[addMenu~="button"] .addMenu[condition~="nobutton"],
    #toolbar-context-menu:not([addMenu=""]) .addMenu[condition~="normal"]
      { display: none !important; }
    .addMenu-insert-point,
    toolbarseparator:not(.addMenu-insert-point)+toolbarseparator
      { display: none !important; }
    .addMenu[url] {
      list-style-image: url("chrome://mozapps/skin/places/defaultFavicon.png");
    }
    .addMenu.exec,
    .addMenu[exec] {
      list-style-image: url("chrome://devtools/content/debugger/images/window.svg");
    }
    .addMenu.copy,
    menuitem.addMenu[text]:not([url]):not([keyword]):not([exec])
    {
      list-style-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJjb250ZXh0LWZpbGwiIGZpbGwtb3BhY2l0eT0iY29udGV4dC1maWxsLW9wYWNpdHkiPjxwYXRoIGQ9Ik00IDJDMi44OTUgMiAyIDIuODk1IDIgNEwyIDE3QzIgMTcuNTUyIDIuNDQ4IDE4IDMgMThDMy41NTIgMTggNCAxNy41NTIgNCAxN0w0IDRMMTcgNEMxNy41NTIgNCAxOCAzLjU1MiAxOCAzQzE4IDIuNDQ4IDE3LjU1MiAyIDE3IDJMNCAyIHogTSA4IDZDNi44OTUgNiA2IDYuODk1IDYgOEw2IDIwQzYgMjEuMTA1IDYuODk1IDIyIDggMjJMMjAgMjJDMjEuMTA1IDIyIDIyIDIxLjEwNSAyMiAyMEwyMiA4QzIyIDYuODk1IDIxLjEwNSA2IDIwIDZMOCA2IHogTSA4IDhMMjAgOEwyMCAyMEw4IDIwTDggOCB6Ii8+PC9zdmc+);
      -moz-image-region: rect(0pt, 16px, 16px, 0px);
    }
    .addMenu.checkbox .menu-iconic-icon {
      -moz-appearance: checkbox;
    }
    .addMenu > .menu-iconic-left {
      -moz-appearance: menuimage;
    }
    .addMenu > .menu-iconic-left > .menu-iconic-icon {
        -moz-context-properties: fill, fill-opacity !important;
        fill: currentColor !important;
    }
    #contentAreaContextMenu[photoncompact="true"]:not([needsgutter]) > .addMenu:is(menu, menuitem) > .menu-iconic-left,
    #contentAreaContextMenu[photoncompact="true"]:not([needsgutter]) > menugroup.addMenu >.addMenu:first-child > .menu-iconic-left {
        visibility: collapse;
    }
    /* menugroup.addMenu {
      padding-bottom: 2px;
    } */
    menugroup.addMenu > .menuitem-iconic.fixedSize {
        -moz-box-flex: 0;
        flex-grow: 0;
        flex-shrink: 0;
        padding-inline-end: 8px;
    }
    menugroup.addMenu > .menuitem-iconic:nth-child(2).noIcon {
        padding-inline-start: 0;
    }
    menugroup.addMenu > .menuitem-iconic:nth-child(2).noIcon > .menu-iconic-text {
        padding-inline-start: 0 !important;
    }
    menugroup.addMenu > .menuitem-iconic.noIcon > .menu-iconic-left {
        display: none !important;
        padding-inline-end: 0px !important;
    }
    menugroup.addMenu > .menuitem-iconic {
        -moz-box-flex: 1;
        -moz-box-pack: center;
        -moz-box-align: center;
        flex-grow: 1;
        justify-content: center;
        align-items: center;
        padding-block: 4px;
        padding-inline-start: 1em;
    }
    menugroup.addMenu > .menuitem-iconic > .menu-iconic-left {
        -moz-appearance: none;
        /* padding-top: 2px; */
    }
    menugroup.addMenu > .menuitem-iconic > .menu-iconic-left > .menu-iconic-icon {
        width: 16px;
        height: 16px;
    }
    menugroup.addMenu:not(.showText):not(.showFirstText) > .menuitem-iconic:not(.showText) > .menu-iconic-text,
    menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child) > .menu-iconic-text,
    menugroup.addMenu > .menuitem-iconic > .menu-accel-container {
        display: none;
    }
    menugroup.addMenu > .menuitem-iconic {
        padding-inline-end: 1em;
    }
    menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) {
        padding-left: 0;
        -moz-box-flex: 0;
        flex-grow: 0;
        flex-shrink: 0;
        padding-inline-end: 0;
    }
    menugroup.addMenu.showFirstText > .menuitem-iconic:not(:first-child):not(.showText) > .menu-iconic-left {
        margin-inline-start: 8px;
        margin-inline-end: 8px;
    }
    `)
}