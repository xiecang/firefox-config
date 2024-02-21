// ==UserScript==
// @name           KeyChanger.uc.js
// @author         Griever
// @namespace      http://d.hatena.ne.jp/Griever/
// @include        main
// @description    快捷键配置脚本
// @description:en Additional shortcuts for Firefox
// @license        MIT License
// @charset        UTF-8
// @version        2022.11.27
// @note           2022.11.27 修复 gBrowser
// @note           2022.06.03 新增 getSelctionText()，修增 saveFile 不存在
// @note           0.0.2 メニューを右クリックで設定ファイルを開けるようにした
// @note           0.0.2 Meta キーを装飾キーに使えるようになったかもしれない（未テスト）
// @note           0.0.2 Windows キーを装飾キーに使えるようになったかもしれない（未テスト Firefox 17 以降）
// @note           2018.1.25.2 Firefox59+ 修复
// ==/UserScript==

location.href.startsWith("chrome://browser/content/browser.x") && (function () {
    var useScraptchpad = true;  // If the editor does not exist, use the code snippet shorthand, otherwise set the editor path
    //let {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;

    const INTERNAL_MAP = {
        tab: {
            close: {
                current: function () {
                    gBrowser.removeTab(gBrowser.selectedTab);
                },
                all: function () {
                    gBrowser.removeTabs(gBrowser.tabs);
                },
                other: function () {
                    gBrowser.removeAllTabsBut(gBrowser.selectedTab);
                }
            },
            pin: {
                current: function () {
                    gBrowser.pinTab(gBrowser.selectedTab);
                },
                all: function (event) {
                    gBrowser.tabs.forEach(t => gBrowser.pinTab(t));
                },
            },
            unpin: {
                current: function () {
                    gBrowser.unpinTab(gBrowser.selectedTab);
                },
                all: function (event) {
                    gBrowser.tabs.forEach(t => gBrowser.unpinTab(t));
                },
            },
            "toggle-pin": {
                current: function () {
                    if (gBrowser.selectedTab.pinned)
                        gBrowser.unpinTab(gBrowser.selectedTab);
                    else
                        gBrowser.pinTab(gBrowser.selectedTab);
                },
                all: function (event) {
                },
            },
            prev: function () {
                gBrowser.tabContainer.advanceSelectedTab(-1, true);
            },
            next: function () {
                gBrowser.tabContainer.advanceSelectedTab(1, true);
            },
            duplicate: function () {
                duplicateTabIn(gBrowser.selectedTab, 'tab');
            }
        }
    }

    window.KeyChanger = {
        get appVersion() {
            return Services.appinfo.version.split(".")[0];
        },
        get platform() {
            delete this.platform;
            return this.platform = AppConstants.platform;
        },
        get FILE() {
            delete this.FILE;
            try {
                path = this.prefs.getStringPref("FILE_PATH")
            } catch (e) {
                if (this.platform === "win") {
                    path = 'JS\\_keychanger.js';
                } else {
                    path = 'JS/_keychanger.js';
                }
            }
            aFile = Services.dirsvc.get("UChrm", Ci.nsIFile);
            aFile.appendRelativePath(path);
            if (!aFile.exists()) {
                saveFile(aFile, '');
                alert('_keychanger.js 配置为空');
            }
            return this.FILE = aFile;
        },
        get prefs() {
            delete this.prefs;
            return this.prefs = Services.prefs.getBranch("keyChanger.")
        },
        isBuilding: false,
        _selectedText: "",
        KEYSETID: "keychanger-keyset",
        addEventListener: function () {
            (gBrowser.mPanelContainer || gBrowser.tabpanels).addEventListener("mouseup", this, false);
        },
        handleEvent: function (event) {
            switch (event.type) {
                case 'mouseup':
                    try {
                        gBrowser.selectedBrowser.finder.getInitialSelection().then((r) => {
                            this.setSelectedText(r.selectedText);
                        })
                    } catch (e) { }
                    break;
            }
        },
        getSelectedText: function () {
            return this._selectedText || "";
        },
        setSelectedText: function (text) {
            this._selectedText = text;
        },
        makeKeyset: function (isAlert) {
            this.isBuilding = true;
            var s = new Date();
            var keys = this.makeKeys();
            if (!keys) {
                this.isBuilding = false;
                return this.alert('KeyChanger', 'Load error.');
            }
            $R(document.getElementById(this.KEYSETID)); // 删除 KeySet
            let keyset = $C(document, "keyset", {
                id: this.KEYSETID
            })
            keyset.appendChild(keys);

            var df = document.createDocumentFragment();
            Array.prototype.slice.call(document.getElementsByTagName('keyset')).forEach(function (elem) {
                df.appendChild(elem);
            });
            var insPos = document.getElementById('mainPopupSet');
            insPos.parentNode.insertBefore(keyset, insPos);
            insPos.parentNode.insertBefore(df, insPos);
            var e = new Date() - s;
            if (isAlert) {
                this.alert('KeyChanger: Loaded', e + 'ms');
            }
            setTimeout(function () {
                KeyChanger.isBuilding = false;
            }, 100);

        },
        makeKeys: function () {
            var str = loadText(this.FILE);
            if (!str)
                return null;

            var sandbox = new Components.utils.Sandbox(new XPCNativeWrapper(window));
            var keys = Components.utils.evalInSandbox('var keys = {};\n' + str + ';\nkeys;', sandbox);
            if (!keys)
                return null;
            var dFrag = document.createDocumentFragment();

            Object.keys(keys).forEach(function (n) {
                let keyString = n.toUpperCase().split("+");
                let modifiers = "", key, keycode, k;

                for (let i = 0, l = keyString.length; i < l; i++) {
                    k = keyString[i];
                    switch (k) {
                        case "CTRL":
                        case "CONTROL":
                        case "ACCEL":
                            modifiers += "accel,";
                            break;
                        case "SHIFT":
                            modifiers += "shift,";
                            break;
                        case "ALT":
                        case "OPTION":
                            modifiers += "alt,";
                            break;
                        case "META":
                        case "COMMAND":
                            modifiers += "meta,";
                            break;
                        case "OS":
                        case "WIN":
                        case "WINDOWS":
                        case "HYPER":
                        case "SUPER":
                            modifiers += "os,";
                            break;
                        case "":
                            key = "+";
                            break;
                        case "BACKSPACE":
                        case "BKSP":
                        case "BS":
                            keycode = "VK_BACK";
                            break;
                        case "RET":
                        case "ENTER":
                            keycode = "VK_RETURN";
                            break;
                        case "ESC":
                            keycode = "VK_ESCAPE";
                            break;
                        case "PAGEUP":
                        case "PAGE UP":
                        case "PGUP":
                        case "PUP":
                            keycode = "VK_PAGE_UP";
                            break;
                        case "PAGEDOWN":
                        case "PAGE DOWN":
                        case "PGDN":
                        case "PDN":
                            keycode = "VK_PAGE_DOWN";
                            break;
                        case "TOP":
                            keycode = "VK_UP";
                            break;
                        case "BOTTOM":
                            keycode = "VK_DOWN";
                            break;
                        case "INS":
                            keycode = "VK_INSERT";
                            break;
                        case "DEL":
                            keycode = "VK_DELETE";
                            break;
                        default:
                            if (k.length === 1) {
                                key = k;
                            } else if (k.indexOf("VK_") === -1) {
                                keycode = "VK_" + k;
                            } else {
                                keycode = k;
                            }
                            break;
                    }
                }
                let elem = document.createXULElement('key');
                if (modifiers !== '')
                    elem.setAttribute('modifiers', modifiers.slice(0, -1));
                if (key)
                    elem.setAttribute('key', key);
                else if (keycode)
                    elem.setAttribute('keycode', keycode);

                let cmd = keys[n];
                switch (typeof cmd) {
                    case 'function':
                        elem.setAttribute('oncommand', '(' + cmd.toString() + ').call(this, event);');
                        break;
                    case 'object':
                        Object.keys(cmd).forEach(function (a) {
                            if (a === 'oncommand' && cmd[a] === "internal")
                                cmd[a] = "KeyChanger.internalCommand(event);";
                            elem.setAttribute(a, cmd[a]);
                        }, this);
                        break;
                    default:
                        elem.setAttribute('oncommand', cmd);
                }
                dFrag.appendChild(elem);
            }, this);
            return dFrag;
        },
        createMenuitem: function () {
            var menuitem = document.createXULElement('menuitem');
            menuitem.setAttribute('id', 'toolsbar_KeyChanger_rebuild');
            menuitem.setAttribute('label', 'KeyChanger');
            menuitem.setAttribute('tooltiptext', '左键：重载配置\n右键：编辑配置');
            menuitem.setAttribute('oncommand', 'setTimeout(function(){ KeyChanger.makeKeyset(true); }, 10);');
            menuitem.setAttribute('onclick', 'if (event.button == 2) { event.preventDefault();KeyChanger.edit(KeyChanger.FILE); }');
            var insPos = document.getElementById('devToolsSeparator');
            insPos.parentNode.insertBefore(menuitem, insPos);
        },
        internalCommand: function (event) {
            let params = event.target.getAttribute('params');
            let cmd = this.internalParamsParse(params);
            if (typeof cmd === "function") {
                cmd.call(this, event);
            } else {
                this.log("Internal command is not complete or too long", params, cmd);
            }
        },
        internalParamsParse: function (params) {
            let args = params.split(',');
            let cmd = INTERNAL_MAP;
            for (let i = 0; i < args.length; i++) {
                if (cmd.hasOwnProperty(args[i])) {
                    cmd = cmd[args[i]];
                } else {
                    return "";
                }
            }
            return cmd;
        },
        openCommand: function (url, where, postData) {
            var uri;
            try {
                uri = Services.io.newURI(url, null, null);
            } catch (e) {
                return this.log("URL 有问题: %s".replace("%s", url));
            }
            if (uri.scheme === "javascript") {
                try {
                    loadURI(url);
                } catch (e) {
                    gBrowser.loadURI(url, { triggeringPrincipal: gBrowser.contentPrincipal });
                }
            } else if (where) {
                try {
                    openUILinkIn(uri.spec, where, false, postData || null);
                } catch (e) {
                    let aAllowThirdPartyFixup = {
                        postData: postData || null,
                        triggeringPrincipal: where === 'current' ?
                            gBrowser.selectedBrowser.contentPrincipal : (
                                /^(f|ht)tps?:/.test(uri.spec) ?
                                    Services.scriptSecurityManager.createNullPrincipal({}) :
                                    Services.scriptSecurityManager.getSystemPrincipal()
                            )
                    }
                    openUILinkIn(uri.spec, where, aAllowThirdPartyFixup);
                }
            } else {
                let aAllowThirdPartyFixup = {
                    inBackground: false,
                    postData: postData || null,
                    triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal({})
                }
                openUILinkIn(uri.spec, 'tab', aAllowThirdPartyFixup);
            }
        },
        edit: function (aFile, aLineNumber) {
            if (KeyChanger.isBuilding) return;
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
                    function setPath() {
                        var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
                        fp.init(window, "设置全局脚本编辑器", fp.modeOpen);
                        fp.appendFilter("执行文件", "*.exe");

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
                    KeyChanger.alert("请先设置编辑器的路径!!!", "提示", setPath);

                }
            }

            var aURL = "";
            aURL = this.getURLSpecFromFile(aFile);

            var aDocument = null;
            var aCallBack = null;
            var aPageDescriptor = null;
            gViewSourceUtils.openInExternalEditor({
                URL: aURL,
                lineNumber: aLineNumber
            }, aPageDescriptor, aDocument, aLineNumber, aCallBack);

        },
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
        exec: function (path, arg) {
            var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            var process = Cc['@mozilla.org/process/util;1'].createInstance(Ci.nsIProcess);
            try {
                var a = (typeof arg == 'string' || arg instanceof String) ? arg.split(/\s+/) : [arg];
                file.initWithPath(path);
                process.init(file);
                process.run(false, a, a.length);
            } catch (e) {
                this.log(e);
            }
        },
        getURLSpecFromFile(aFile) {
            var aURL;
            if (this.appVersion < 92) {
                aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromFile(aFile);
            } else {
                aURL = Services.io.getProtocolHandler("file").QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromActualFile(aFile);
            }
            return aURL;
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
                "chrome://global/skin/icons/information-32.png", aTitle || "addMenu",
                aMsg + "", !!callback, "", callback);
        },
        log: function () {
            Services.console.logStringMessage("[KeyChanger] " + Array.prototype.slice.call(arguments));
        },
        init: function () {
            this.createMenuitem();
            this.makeKeyset();
            this.addEventListener();
        }
    };

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
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
        foStream.write(data, data.length);
        foStream.close();
    }

    function loadText(aFile) {
        var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
        var sstream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
        fstream.init(aFile, -1, 0, 0);
        sstream.init(fstream);

        var data = sstream.read(sstream.available());
        try {
            data = decodeURIComponent(escape(data));
        } catch (e) {
        }
        sstream.close();
        fstream.close();
        return data;
    }

    function $C(aDoc, tag, attrs, skipAttrs) {
        attrs = attrs || {};
        skipAttrs = skipAttrs || [];
        var el = (aDoc || document).createXULElement(tag);
        return $A(el, attrs, skipAttrs);
    }

    function $A(el, obj, skipAttrs) {
        skipAttrs = skipAttrs || [];
        if (obj) Object.keys(obj).forEach(function (key) {
            if (!skipAttrs.includes(key)) {
                if (typeof obj[key] === 'function') {
                    el.setAttribute(key, "(" + obj[key].toString() + ").call(this, event);");
                } else {
                    el.setAttribute(key, obj[key]);
                }
            }
        });
        return el;
    }

    function $R(el) {
        if (!el || !el.parentNode) return;
        el.parentNode.removeChild(el);
    }

    if (gBrowserInit.delayedStartupFinished) window.KeyChanger.init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.KeyChanger.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();