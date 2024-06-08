# Firefox-Config

This repository contains a set of scripts and configuration files that can be used to modify the behavior of Firefox.

**Be aware that updates to Firefox may result in some icon styles or scripts becoming incompatible. This configuration is only tailored to the latest stable version of Firefox, and has currently been tested and verified on version 126.0.1**

# Overview

![Overview1](https://raw.githubusercontent.com/xiecang/firefox-config/master/images/overview_1.png)
![Overview2](https://raw.githubusercontent.com/xiecang/firefox-config/master/images/overview_2.png)

# Features

- Integrated UC scripts using the fx-autoconfig solution, which includes mouse gestures, bookmark tiling, privacy tab merging, shortcut keys, and more.
- Beautified the interface, adjusted the style, added icons, and used a vertical tab bar.

# Install

## Install tree-style tab extension

Click [here](https://addons.mozilla.org/en-US/firefox/addon/sidebery/) to install the Sidebery extension.

Of course, if you prefer other tree-style tabs, such as [Tree Style Tab](https://addons.mozilla.org/en-US/firefox/addon/tree-style-tab/), you can install them yourself. The project does not mandate the use of Sidebery.

The default tab bar is hidden. If you want to enable it, comment out '@import url("css/SideBarFox/sidebar.css");' in `chrome/css/userChrome.css`.

## Setting up config.js from "program" folder

Copy the _contents_ of the directory called "program" (not the directory itself) into the directory of the Firefox binary you want it to apply to.

This means that if you want to affect multiple installations, like release, beta, ESR etc. you need to add the files to all of them.

<details>
<summary>Windows</summary>

Firefox is typically installed to `C:\Program Files\Mozilla Firefox\`

Copy `defaults/` and `config.js` there from the `program` folder. `config.js` should end up in the same directory where `firefox.exe` is.

</details>
<details>
<summary>Linux</summary>

Firefox is typically installed to `/usr/lib/firefox/` or `/usr/lib64/firefox/`

Copy `defaults/` and `config.js` there from the `program` folder. `config.js` should end up in the same directory where `firefox` binary is.

</details>
<details>
<summary>MacOS</summary>

Firefox is typically installed to `/Applications/Firefox.app/Contents/MacOS/` or `/Applications/Firefox Nightly.app/Contents/MacOS/`

Copy `defaults/` and `config.js` to `/Applications/Firefox.app/Contents/Resources/` from the `program` folder. `config.js` should end up in the `/Applications/Firefox.app/Contents/Resources/` directory.

</details>

## Setting up profile

0. In your browser, type `about:profiles`.
1. Locate the item where `Default Profile` is set to yes.
2. Click on `Show in Finder` in the `Root Directory` column.
3. Copy both `user.js` and `chrome` into that directory.

![about:profiles](https://raw.githubusercontent.com/xiecang/firefox-config/master/images/about_profiles.png)

## Deleting startup-cache

Firefox caches some files to speed-up startup. But the files in utils/ modify the startup behavior so you might be required to clear the startup-cache.

If you modify boot.sys.mjs and happen to break it, you will likely need to clear startup-cache again.

<details>
<summary>Clear startup-cache via about:support (recommended)</summary>

0. Load `about:support`
1. In the top-right corner should be a button to clear the startup-cache.
2. Click that button and confirm the popup that will show up.
3. Firefox will restart with startup-cache cleared, and now the scripts should be working.

</details>
<details>
<summary>Clear startup-cache manually</summary>
The startup-cache folder can be found as follows:

0. load the following url `about:profiles`
1. locate the profile you wish to set up and click the "Open Folder" of the **Local** directory - this should open the directory in File Manager
2. Close Firefox
3. Delete folder "StartupCache"
4. Run Firefox

(Note) If you wish to set up a profile that doesn't use normal profile directories (i.e one that was lauched with command-line such as `firefox.exe -profile "C:\test\testprofile"` or with portable-apps launcher) then the startupCache folder will be in the profile root folder.

</details>
