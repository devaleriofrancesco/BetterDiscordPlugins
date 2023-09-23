/**
 * @name BetterCamera
 * @author DeveloperFallito
 * @description Hide & show webcam based on configurable shortcut.
 * @version 0.0.1
 */

const config = {
    "info": {
        "name": "BetterCamera",
        "authors": [{
            "name": "DeveloperFallito",
            "discord_id": "318024713115009026",
            "github_username": "devaleriofrancesco"
        }],
        "version": "0.0.1",
        "description": "Hide & show webcam based on configurable shortcut.",
        "github": "https://github.com/devaleriofrancesco",
        "github_raw": "https://raw.githubusercontent.com/devaleriofrancesco/BetterDiscordPlugins/master/BetterCamera.plugin.js"
    },
    // "changelog": [
    //
    // ],
    "main": "BetterCamera.js"
};

var settings = {
    "shortcut": {
        "title": "Shortcut for toggle webcam (Hide / Show)",
        "description": "Click record button for record shortcut",
        "value": null
    }
}


const fs = require("fs");
const path = require("path");
const request = require("request");
const webcamIconButton = 'buttonIcon-2Zsrs2';

module.exports = (_ => {

    const changeLog = {

    };

    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        constructor (meta) {for (let key in meta) this[key] = meta[key];}
        getName () {return this.name;}
        getAuthor () {return this.author;}
        getVersion () {return this.version;}
        getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}

        downloadLibrary () {
            require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
                if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
                else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
            });
        }

        load () {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
            if (!window.BDFDB_Global.downloadModal) {
                window.BDFDB_Global.downloadModal = true;
                BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
                    onConfirm: _ => {
                        delete window.BDFDB_Global.downloadModal;
                        this.downloadLibrary();
                    }
                });
            }
            if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
        }
        start () {this.load();}
        stop () {}
        getSettingsPanel () {
            let template = document.createElement("template");
            template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
            template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
            return template.content.firstElementChild;
        }
    } : (([Plugin, BDFDB]) => {

        return class BetterCamera extends Plugin {

            load() {
            }

            unload() {
            }

            onStart() {
                // Load Settings from Config on Startup
                // Object.entries(PluginUtilities.loadData("shortcut", "settings", {})).forEach(([setting, value]) => {
                //     settings[setting]["value"] = value;
                //     this._setKeyBind(value);
                //     this._addKeyBindListener();
                // });
                this.settings = BDFDB.DataUtils.load(this, 'bindings') ?? [];
                if (!this.settings.keycombo) {
                    this.settings.keycombo = [];
                }
            }

            onStop() {
                DiscordNative.nativeModules.requireModule("discord_utils").inputEventUnregister(6666);
            }

            getSettingsPanel (collapseStates = {}) {
                let settingsPanel;
                return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
                    collapseStates: collapseStates,
                    children: _ => {
                        let settingsItems = [];
                        let keyRecorderIns;
                        settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.KeybindRecorder, {
                            value: this.settings.keycombo.filter(n => n),
                            reset: true,
                            disabled: false,
                            ref: instance => {if (instance) keyRecorderIns = instance;},
                            onChange: value => {
                                this.settings.keycombo = value;
                                BDFDB.DataUtils.save(this.settings, this, "bindings");
                                this.SettingsUpdated = true;
                                this._addKeyBindListener();
                            }
                        }));

                        return settingsItems;
                    }
                });
            }

            _getKeyMappings() {
                switch (DiscordNative.process.platform) {
                    case "Windows".toLowerCase():
                        return BdApi.Webpack.getModule(m => m.ctrl === 0xa2, {searchExports: true});
                    case "Linux".toLowerCase():
                        return BdApi.Webpack.getModule(m => m.ctrl === 0x25, {searchExports: true});
                    case "Mac".toLowerCase():
                        return BdApi.Webpack.getModule(m => m.ctrl === 0xe0, {searchExports: true});
                }
            }

            _addKeyBindListener() {

                const keyBind = this.settings.keycombo ?? [];
                const shortcut = this._getKeysArray(keyBind);

                DiscordNative.nativeModules.requireModule("discord_utils").inputEventUnregister(6666);
                if (shortcut.length) {
                    DiscordNative.nativeModules.requireModule("discord_utils").inputEventRegister(
                        6666,
                        shortcut,
                        isDown => this._toggleWebcam(),
                        {
                            blurred: true,
                            focused: true,
                            keydown: true,
                            keyup: false
                        }
                    );
                }
            }

            _getKeysArray(keyBind) {
                const shortcut = [];
                const mapping = this._getKeyMappings();

                const specialKeys = [
                    91, // META
                    16, // SHIFT
                    17, //CTRL
                    18, // ALT LEFT
                    225 // ALT RIGHT
                ];

                for (let i = 0; i < keyBind.length; i++) {
                    const currentShortCut = keyBind[i];
                    if (specialKeys.includes(currentShortCut)) {
                        shortcut.push([
                            0, currentShortCut
                        ]);
                    }else {
                        const letter = String.fromCharCode(currentShortCut);
                        shortcut.push([
                            0, mapping[letter.toLowerCase()]
                        ]);
                    }
                }

                return shortcut;
            }

            _toggleWebcam() {
                const checkWebcamVisibility = document.querySelector(`svg[class=${webcamIconButton}]`);
                if (checkWebcamVisibility) {
                    checkWebcamVisibility.closest('button').click();
                }
            }

        };

    })(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();