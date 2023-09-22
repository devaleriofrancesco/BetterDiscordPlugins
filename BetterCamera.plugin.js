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
            "discord_id": "154401402263699457",
            "github_username": "devaleriofrancesco"
        }],
        "version": "0.0.1",
        "description": "Hide & show webcam based on configurable shortcut.",
        "github": "https://github.com/devaleriofrancesco",
        "github_raw": "https://raw.githubusercontent.com/danegottwald/BetterDiscordPlugins/main/HideStreamPreview/HideStreamPreview.plugin.js"
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

module.exports = !global.ZeresPluginLibrary ? class {
    constructor() {
        this._config = config;
    }

    load() {
        BdApi.showConfirmationModal("Library plugin is needed",
            `ZeresPluginLibrary is missing. Please click Download Now to install it.`, {
                confirmText: "Download",
                cancelText: "Cancel",
                onConfirm: () => {
                    request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
                        if (error) {
                            return electron.shell.openExternal("https://github.com/rauenzi/BDPluginLibrary");
                        }
                        fs.writeFileSync(path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body);
                    });
                }
            });
    }

    start() { }

    stop() { }

} : (([Plugin, Library]) => {
    const {
        Settings,
        PluginUtilities,
    } = Library;

    return class HideStreamPreview extends Plugin {

        _keyBind = null;

        load() {
        }

        unload() {
        }

        onStart() {
            // Load Settings from Config on Startup
            Object.entries(PluginUtilities.loadData("shortcut", "settings", {})).forEach(([setting, value]) => {
                settings[setting]["value"] = value
            });
        }

        onStop() {
        }

        getSettingsPanel() {
            // Dynamically create settings panel depending on the keys in the 'settings' dictionary
            var panel = new Settings.SettingPanel();
            Object.entries(settings).forEach(([setting, content]) => {
                panel.append(
                    new Settings.Keybind(
                        content["title"], content["description"], content["value"],
                        (val) => {
                            settings[setting]["value"] = val;
                            PluginUtilities.saveSettings("shortcut", { [setting]: val });
                            this._setKeyBind(val);
                            this._addKeyBindListener();
                        }
                    )
                );
            });

            return panel.getElement();
        }

        _getKeyBind() {
            return this._keyBind;
        }

        _setKeyBind(keyBind) {
            this._keyBind = keyBind[0];
        }

        _addKeyBindListener() {
            document.removeEventListener('keydown', this._keyDownListener.bind(this));
            document.addEventListener('keydown', this._keyDownListener.bind(this));
        }

        _keyDownListener(ev) {
            const keyBind = this._getKeyBind();
            const keyBindClause =
                ev.keyCode === keyBind['keyCode'] &&
                ev.metaKey === keyBind['metaKey'] &&
                ev.shiftKey === keyBind['shiftKey'] &&
                ev.altKey === keyBind['altKey'] &&
                ev.ctrlKey === keyBind['ctrlKey'];

            if (keyBindClause) {
                this._toggleWebcam();
            }
        }

        _toggleWebcam() {
            const checkWebcamVisibility = document.querySelector(`svg[class=${webcamIconButton}]`);
            if (checkWebcamVisibility) {
                checkWebcamVisibility.closest('button').click();
            }
        }

        // Hide stream preview when the wrapper for the video tiles is targeted
        // observer(e) {
        //     console.log(e);
        // }

    };

})(global.ZeresPluginLibrary.buildPlugin(config));