import Editable from "../utils/ObjectEditor";
import { chat, capitalizeFirst } from "../utils/utils";

export const modules = [];

export function registerModule(module) {
    modules.push(module);
}

export default class Module extends Editable {
    constructor(name, phoenix) {
        this._name = name;
        this._phoenix = phoenix;


        try {
            this._config = JSON.parse(FileLib.read("CarbonaraAddons/data/modules", `${this._name}.json`));
            if (this._config === null) {
                this._config = this._defaultConfig();
                this.syncConfig();
            }
        } catch (e) {
            this._config = this._defaultConfig();
            this.syncConfig();
        }
    }

    getName() {
        return this._name;
    }

    toggle() {
        const buffer = {
            "module": this._name,
            "config": this._config
        };
        this._toggled = true;

        chat(JSON.stringify(buffer));
        this._phoenix.customPayload("phoenixclient-toggle", buffer);
    }

    disable() {
        const buffer = {
            "module": this._name
        }
        this._toggled = false;

        this._phoenix.customPayload("phoenixclient-disable", buffer);
    }

    config() {
        return this._config;
    }

    createConfigValues() {
        const config = [
            {
                type: "addTextParagraph",
                configName: `Editing module: ${capitalizeFirst(this._name)}`
            },
            {
                type: "addSwitch",
                configName: "toggle",
                registerListener: (obj, _, next) => {
                    if (this._toggled === next) {
                        return;
                    }

                    if (next) {
                        obj.toggle();
                    } else {
                        obj.disable();
                    }
                },
                updator: (setter, obj) => {
                    setter("toggle", obj._toggled);
                }
            }
        ];

        for (const key in this._config) {
            const value = this._config[key];
            const type = typeof value;
            switch (type) {
                case "boolean":
                    config.push({
                        type: "addSwitch",
                        configName: key,
                        registerListener: (obj, _, next) => {
                            obj._config[key] = next;
                            obj.syncConfig();
                        },
                        updator: (setter, obj) => {
                            setter(key, obj._config[key]);
                        }
                    });
                    break;
                case "string":
                    config.push({
                        type: "addTextInput",
                        configName: key,
                        registerListener: (obj, _, next) => {
                            obj._config[key] = next;
                            obj.syncConfig();
                        },
                        updator: (setter, obj) => {
                            setter(key, obj._config[key]);
                        }
                    });
                    break;
                case "number":
                    config.push({
                        type: "addTextInput",
                        configName: key,
                        registerListener: (obj, _, next) => {
                            const num = parseFloat(next);
                            if (!isNaN(num)) {
                                obj._config[key] = num;
                                obj.syncConfig();
                            }
                        },
                    });
                    break;
                default:
                    throw new Error(`Unsupported config type: ${type} for key: ${key}`);
            }
        }

        return config;
    }

    syncConfig() {
        FileLib.write("CarbonaraAddons/data/modules", `${this._name}.json`, JSON.stringify(this._config, null, 4));
        this._phoenix.customPayload("phoenixclient-config", { "config": this._config });
    }

    _defaultConfig() {
        return {};
    }
};
