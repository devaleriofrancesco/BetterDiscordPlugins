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

    return class BetterCamera extends Plugin {

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

        _getKeyBind() {
            return this._keyBind;
        }

        _setKeyBind(keyBind) {
            this._keyBind = keyBind;
        }

        _addKeyBindListener() {

            const shortcut = [];

            const mapping = this._getKeyMappings();
            const keyBind = this._getKeyBind();
            for (let i = 0; i < keyBind.length; i++) {
                const currentShortCut = keyBind[i];
                const letter = String.fromCharCode(currentShortCut['keyCode']);
                shortcut.push([
                    0, mapping[letter.toLowerCase()]
                ]);
            }

            // get first element
            const firstElement = keyBind[0];
            if (firstElement['metaKey']) {
                shortcut.push([0, mapping['meta']]);
            }

            if (firstElement['shiftKey']) {
                shortcut.push([0, mapping['shift']]);
            }

            if (firstElement['altKey']) {
                shortcut.push([0, mapping['alt']]);
            }

            if (firstElement['ctrlKey']) {
                shortcut.push([0, mapping['ctrl']]);
            }

            DiscordNative.nativeModules.requireModule("discord_utils").inputEventUnregister(6666);
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

        _toggleWebcam() {
            const checkWebcamVisibility = document.querySelector(`svg[class=${webcamIconButton}]`);
            if (checkWebcamVisibility) {
                checkWebcamVisibility.closest('button').click();
            }
        }

    };

})(global.ZeresPluginLibrary.buildPlugin(config));