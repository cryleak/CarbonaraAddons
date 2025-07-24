import { Config } from "../utils/ObjectEditor";
import { chat, capitalizeFirst } from "../utils/utils";

export const modules = [];

export function registerModule(module) {
    modules.push(module);
}

export default class Module extends Config {
    constructor(name, phoenix) {
        super(name);
        this._name = name;
        this._phoenix = phoenix;
    }

    _tryLoadConfig() {
        try {
            this._config = JSON.parse(FileLib.read("CarbonaraAddons/data/modules", `${this._name}.json`));
            if (this._config === null) {
                this._config = this._defaultConfig();
                this._config["toggle"] = false;
                this.syncConfig();
            }
        } catch (e) {
            this._config = this._defaultConfig();
            this._config["toggle"] = false;
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
        this._config["toggle"] = true;

        this._phoenix.customPayload("phoenixclient-toggle", buffer);
    }

    isToggled() {
        return this._toggled && this._phoenix.isInPhoenix();
    }

    disable() {
        const buffer = {
            "module": this._name
        }
        this._toggled = false;
        this._config["toggle"] = false;

        this._phoenix.customPayload("phoenixclient-disable", buffer);
    }

    config() {
        return this._config;
    }

    _createConfigValues() {
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
                    setter("toggle", obj.config["toggle"]);
                }
            }
        ];

        Object.keys(this._config).forEach(key => {
            if (key === "toggle") { // handled seperately
                return;
            }

            let value = this._config[key];
            let type = typeof value;
            switch (type) {
                case "boolean":
                    config.push({
                        type: "addSwitch",
                        configName: key,
                        registerListener: (obj, _, next) => {
                            if (obj._config[key] === next) {
                                return;
                            }

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
                            if (obj._config[key] === next) {
                                return;
                            }

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
                            let num = parseFloat(next);
                            if (!isNaN(num) && obj._config[key] !== num) {
                                obj._config[key] = num;
                                obj.syncConfig();
                            }
                        },
                        updator: (setter, obj) => {
                            setter(key, obj._config[key].toString());
                        }
                    });
                    break;
                default:
                    throw new Error(`Unsupported config type: ${type} for key: ${key}`);
            }
        });

        return config;
    }

    syncConfig() {
        FileLib.write("CarbonaraAddons/data/modules", `${this._name}.json`, JSON.stringify(this._config, null, 4));
        if (this.isToggled()) {
            this._phoenix.customPayload("phoenixclient-config", { "module": this._name, "config": this._config });
        }
    }

    _defaultConfig() {
        return {};
    }
};
