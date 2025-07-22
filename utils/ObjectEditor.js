import ConfigTypes from "../../Amaterasu/core/ConfigTypes"
import Settings from "../../Amaterasu/core/Settings"

import { capitalizeFirst } from "./utils"


const defaultValues = [false, 1, undefined, 0, "", [255, 255, 255, 255], false, 0, 0]

/**
 * @typedef {string|number|number[]} DefaultObjectValue
 */

/**
 * @template {string} ConfigName
 * @template {string?} CategoryName
 * @template {DefaultObjectValue?} Value
 * @template {(number|string|MultiCheckBoxChildObject)[]} Options
 * @typedef {object} DefaultObject
 * @prop {CategoryName} category The category name for this config component
 * @prop {ConfigName} configName The config name for this config component (used to get its current value)
 * @prop {string} title The title to be displayed for this config component
 * @prop {string} description The description to be displayed for this config component
 * @prop {string?} placeHolder The placeholder for this component (only if it supports it)
 * @prop {Value} value The current config value of this component (only if it supports it)
 * @prop {?(data: R<string, DefaultObjectValue>) => boolean} shouldShow The function that runs whenever `Amaterasu` attempts to hide a component (this function should only return `Boolean`) (it is passed the `Settings::settings` object)
 * @prop {?(data: import("./Settings").default) => void} onClick The function that runs whenever a button is clicked (it is passed the `Settings` object)
 * @prop {string?} subcategory The subcategory for this config component
 * @prop {string[]?} tags The searching tags for this component (if any is defined these will make the component come up in results whenever searching these strings)
 * @prop {?(previousValue: Value, newValue: Value) => void} registerListener The function that runs whenever this component's value changes (returns params `previousValue` and `newValue`)
 * @prop {Options?} options Usage varies depending on type of setting. [min, max] for slider, options for checkbox/multicheck box (strings in checkbox, nested objects for multi), and probably more. Pay me.
 * @prop {boolean?} centered Whether the [title] and [description] should be centered
*/

/**
 * @typedef {DefaultObject<string, string, DefaultObjectValue, (number|string|MultiCheckBoxChildObject)[]>} DefaultDefaultObject
 */

/**
 * @template {string} ConfigName
 * @typedef {object} MultiCheckBoxChildObject
 * @prop {string} title The title to be displayed for this config component
 * @prop {ConfigName} configName The config name for this config component (used to get its current value)
 * @prop {boolean?} value The current config value of this component
 */

/**
 * @template K
 * @template [V = undefined]
 * @typedef {Record<K, V>} R
 */

/**
 * @template [P = R<never>]
 * @template [C = R<never>]
 * @template [A = R<never>]
 * @template {string} [L = never]
 */
class NoSaveConfig {

    /**
     * - This class handles all the data required by the
     * - whole [Amaterasu]'s [Config] system
     * @param {string} moduleName The module name. this is used on the saving data process so make sure to set it correctly.
     */
    constructor(moduleName) {
        /**
         * @type {string}
         */
        this.moduleName = moduleName
        /**
         * @type {string?}
         */
        this.lastCategory = null

        /**
         * Holds all the categories names
         * @type {Set<string>}
         */
        this.categories = new Set()

        /**
         * Config stuff
         * @type {{ category: string, settings: DefaultDefaultObject[] }[]}
         */
        this.config = []
        /**
         * @type {?import("./Settings").default<this>}
         */
        this.settingsInstance = null

        // Registers
        register("gameUnload", () => {
            if (this.settingsInstance) {
                const gui = this.settingsInstance.handler.ctGui
                if (gui.isOpen()) gui.close()

                this.settingsInstance.handler = null
                this.settingsInstance = null
            }
        })
    }

    /**
     * @private
     * - Internal use.
     * - Used to setup all the configs after the defaults are set.
     * - This is done this way due to the default configurations being created before the `Settings` instance
     * @returns {this}
     */
    _init() {
        this._makeConfig()
        return this
    }

    /**
     * @private
     * - Internal use.
     * - Checks whether the saved data has changed from the new data
     * - This will make it so it saves the correct value and changes the [ConfigType] properly
     * @param {string} categoryName
     * @param {string} configName
     * @param {DefaultDefaultObject} newObj
     * @returns
     */
    _makeObj(categoryName, configName, newObj) {
        categoryName = this._checkCategory(categoryName, configName)

        if (newObj.subcategory === "") newObj.subcategory = null

        const obj = this.savedConfig?.find(it => it.category === categoryName)?.settings?.find(currObj => currObj.name === configName)
        if (!obj) return this[categoryName].push(newObj)

        if (obj.type !== newObj.type) {
            newObj.value = defaultValues[newObj.type]

            this[categoryName].push(newObj)
            console.warn(`[Amaterasu - ${this.moduleName}] config type for ${configName} was changed from ${obj.type} to ${newObj.type}. therefor the object was re-created to fit these changes`)

            return
        }

        // Handle MultiCheckBox savings
        if (obj.type === ConfigTypes.MULTICHECKBOX) {
            obj.options.forEach(opts => {
                const nObj = newObj.options.find(op => op.configName === opts.name)
                if (!nObj) return

                nObj.value = opts.value
            })

            this[categoryName].push(newObj)

            return
        }

        newObj.value = obj.value
        this[categoryName].push(newObj)
    }

    /**
     * @private
     * - Internal use.
     * - Checks whether the given [categoryName] is valid.
     * - also checks whether that category is created.
     * - if not we create it.
     * @param {string} categoryName
     * @param {string} configName
     * @returns {string} the category name itself
     */
    _checkCategory(categoryName, configName) {
        if (!categoryName && !this.lastCategory) throw new Error(`${categoryName} is not a valid Category Name.`)
        if (configName === "getConfig") throw new Error(`[Amaterasu - ${this.moduleName}] you cannot overwrite a built in function. attempting to create config with configName: ${configName}. failed please change this configName`)

        // Gets the prevous category name if [categoryName] is [null]
        categoryName = categoryName ?? this.lastCategory

        if (!categoryName) throw new Error(`${categoryName} is not a valid Category Name`)
        if (!configName) throw new Error(`${configName} is not a valid Config Name.`)

        // Create category data if it does not exist.
        if (!this.categories.has(categoryName)) {
            this[categoryName] = []
            this.categories.add(categoryName)
        }

        this.lastCategory = categoryName

        return categoryName
    }

    /**
     * @private
     * - Internal use.
     */
    _makeConfig() {
        this.categories.forEach(categoryName => {
            const settings = this[categoryName]

            settings.forEach(dobj => {
                const obj = this.config.find(names => names.category === categoryName)
                if (!obj) return this.config.push({ category: categoryName, settings: [dobj] })

                obj.settings.push(dobj)
            })
        })
    }

    /**
     * @private
     * - Internal use.
     * - Forms and updates the current config into an actual dev friendly format
     * - e.g instead of `[Settings: { name: "configName", text: "config stuff" ...etc }]`
     * converts it into `{ configName: false }`
     * @param {Object?}
     */
    _normalizeSettings(settings) {
        // TODO: change this to only be ran once per feature change
        // rather than everytime one changes re-scan the entire thing and re-build it
        this.config.forEach(obj => {
            obj.settings.forEach(settingsObj => {
                if (settingsObj.type === ConfigTypes.MULTICHECKBOX) {
                    settingsObj.options.forEach(opts => {
                        settings[opts.configName] = opts.value
                    })
                    return
                }

                settings[settingsObj.name] = settingsObj.value
            })
        })
    }

    /**
     * @private
     * - Internal use.
     * - Builds the config into an actual dev friendly format
     * - e.g instead of `[Settings: { name: "configName", text: "config stuff" ...etc }]`
     * converts it into `{ configName: false }`
     * @returns {Readonly<P> & { getConfig() => import("./Settings").default<DefaultConfig<P, C, A, L>> }}
     */
    _initSettings() {
        const settings = {}

        this.config.forEach(obj => {
            obj.settings.forEach(settingsObj => {
                if (settingsObj.type === ConfigTypes.MULTICHECKBOX) {
                    settingsObj.options.forEach(opts => {
                        settings[opts.configName] = opts.value
                    })
                    return
                }

                settings[settingsObj.name] = settingsObj.value
            })
        })

        settings.getConfig = () => this.settingsInstance

        this.settingsInstance.settings = settings

        return settings
    }

    /**
     * - Creates a new button with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G extends string ? G : L, undefined, undefined>} options
     * @returns {DefaultConfig<P, C & R<G extends string ? G : L, R<N>>, A, G extends string ? G : L>} this for method chaining
     */
    addButton({
        category = null,
        configName = null,
        title,
        description,
        placeHolder = "Click",
        onClick,
        shouldShow,
        subcategory = null,
        tags = []
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.BUTTON,
            name: configName,
            text: title,
            description,
            placeHolder,
            onClick,
            shouldShow,
            subcategory,
            tags
        })
        return this
    }

    /**
     * - Creates a new toggle with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G extends string ? G : L, boolean, undefined>} options
     * @returns {DefaultConfig<P & R<N, boolean>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, boolean>>, G extends string ? G : L>} this for method chaining
     */
    addToggle({
        category = null,
        configName = null,
        title,
        description,
        value = false,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TOGGLE,
            name: configName,
            text: title,
            description,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new switch with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, boolean, undefined>} options
     * @returns {DefaultConfig<P & R<N, boolean>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, boolean>>, G extends string ? G : L>} this for method chaining
     */
    addSwitch({
        category = null,
        configName = null,
        title,
        description,
        value = false,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SWITCH,
            name: configName,
            text: title,
            description,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new textinput with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, string, undefined>} options
     * @returns {DefaultConfig<P & R<N, string>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, string>>, G extends string ? G : L>} this for method chaining
     */
    addTextInput({
        category = null,
        configName = null,
        title,
        description,
        value = "",
        placeHolder,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TEXTINPUT,
            name: configName,
            text: title,
            description,
            value,
            placeHolder,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new slider with the given params and pushes it into the config
     * - For a decimal slider, the first number of the `options` property should include a decimal e.g. 0.01
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, [number, number]>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addSlider({
        category = null,
        configName = null,
        title,
        description,
        options = [0, 10],
        value = 1,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SLIDER,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new selection with the given params and pushes it into the config
     * - The `value` property is the index of the option, not the option itself
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, string[]>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addSelection({
        category = null,
        configName = null,
        title,
        description,
        options = ["Test 1", "Test 2"],
        value = 0,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener,
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.SELECTION,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new color picker with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, [number, number, number, number], undefined>} options
     * @returns {DefaultConfig<P & R<N, [number, number, number, number]>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, [number, number, number, number]>>, G extends string ? G : L>} this for method chaining
     */
    addColorPicker({
        category = null,
        configName = null,
        title,
        description,
        value = [255, 255, 255, 255],
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.COLORPICKER,
            name: configName,
            text: title,
            description,
            value,
            placeHolder: value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new drop down with the given params and pushes it into the config
     * - The `value` property is the index of the option, not the option itself
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, string[]>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addDropDown({
        category = null,
        configName = null,
        title,
        description,
        options = ["Test 1", "Test 2"],
        value = 0,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.DROPDOWN,
            name: configName,
            text: title,
            description,
            options,
            value,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }

    /**
     * - Creates a new multi checkbox with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<undefined, G, undefined, MultiCheckBoxChildObject<N>[]>} options
     * @returns {DefaultConfig<P & R<N, boolean>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, boolean>>, G extends string ? G : L>} this for method chaining
     */
    addMultiCheckbox({
        category = null,
        configName = null,
        title,
        description,
        options = [],
        placeHolder = "Click",
        shouldShow,
        subcategory = null,
        tags = []
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.MULTICHECKBOX,
            name: configName,
            text: title,
            description,
            options,
            shouldShow,
            placeHolder,
            subcategory,
            tags
        })
        return this
    }

    /**
     * - Creates a new text paragraph with the given params and pushes it into the config
     * - This is for displaying text, not for a paragraph input
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, undefined, undefined>} options
     * @returns {DefaultConfig<P, C & R<G extends string ? G : L, R<N>>, A, G extends string ? G : L>} this for method chaining
     */
    addTextParagraph({
        category = null,
        configName = null,
        title,
        description,
        centered = false,
        shouldShow,
        subcategory = null,
        tags = []
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.TEXTPARAGRAPH,
            name: configName,
            text: title,
            centered,
            description,
            shouldShow,
            subcategory,
            tags
        })
        return this
    }

    /**
     * - Creates a new keybind with the given params and pushes it into the config
     * @template {string} N
     * @template {string?} G
     * @param {DefaultObject<N, G, number, undefined>} options
     * @returns {DefaultConfig<P & R<N, number>, C & R<G extends string ? G : L, R<N>>, A & R<G extends string ? G : L, R<N, number>>, G extends string ? G : L>} this for method chaining
     */
    addKeybind({
        category = null,
        configName = null,
        title,
        description,
        value = 0,
        shouldShow,
        subcategory = null,
        tags = [],
        registerListener
    }) {
        this._makeObj(category, configName, {
            type: ConfigTypes.KEYBIND,
            name: configName,
            text: title,
            value,
            description,
            shouldShow,
            subcategory,
            tags,
            registerListener
        })
        return this
    }
}

export default class Editable {
    static configs = {};

    constructor() {}

    openEditor() {
        this.constructor._getEditor(this);
    }

    createConfigValues() {
        return Object.keys(this).reduce((acc, key) => {
            const v = this[key];
            if (v === null || v === undefined || Array.isArray(v)) return acc;

            switch (typeof v) {
                case "number":
                    acc.push({
                        type: "addTextInput",
                        description: key,
                        value: v,
                        configName: key,
                        subcategory: "Main",
                        category: "Object Editor",
                        registerListener: (obj, _, next) => {
                            obj[key] = parseFloat(next);
                        },
                        updator: (setter, obj) => {
                            setter(key, obj[key]);
                        }
                    });
                    break;
                case "string":
                    acc.push({
                        type: "addTextInput",
                        title: key,
                        description: key,
                        value: v,
                        configName: key,
                        subcategory: "Main",
                        category: "Object Editor",
                        registerListener: (obj, _, next) => {
                            obj[key] = next;
                        },
                        updator: (setter, obj) => {
                            setter(key, obj[key]);
                        }
                    });
                    break;
                default:
                    if (v.x && v.y && v.z) {
                        acc.push({
                            type: "addTextInput",
                            title: `x of ${key}`,
                            description: `x of ${key}`,
                            value: v.x,
                            configName: `xof${key}`,
                            subcategory: key,
                            category: "Object Editor",
                            registerListener: (obj, _, next) => {
                                obj[key].x = parseFloat(next);
                            },
                            updator: (setter, obj) => {
                                setter(`xof${key}`, obj[key].x);
                            }
                        });
                        acc.push({
                            type: "addTextInput",
                            title: `y of ${key}`,
                            description: `y of ${key}`,
                            value: v.y,
                            configName: `yof${key}`,
                            subcategory: key,
                            category: "Object Editor",
                            registerListener: (obj, _, next) => {
                                obj[key].y = parseFloat(next);
                            },
                            updator: (setter, obj) => {
                                setter(`yof${key}`, obj[key].y);
                            }
                        });
                        acc.push({
                            type: "addTextInput",
                            title: `z of ${key}`,
                            description: `z of ${key}`,
                            value: v.z,
                            configName: `zof${key}`,
                            subcategory: key,
                            category: "Object Editor",
                            registerListener: (obj, _, next) => {
                                obj[key].z = parseFloat(next);
                            },
                            updator: (setter, obj) => {
                                setter(`zof${key}`, obj[key].z);
                            }
                        });
                    }
                    break;
            }
            return acc;
        }, []);
    }

    _onUpdatedInConfig() {}

    newConfig() {
        config = new NoSaveConfig("CarbonaraAddons")._init();

        let object = null;
        let updators = [];
        this.createConfigValues().forEach((value) => {
            if (value.updator) {
                updators.push(value.updator);
            }

            if (value.registerListener) {
                const re = value.registerListener;
                value.registerListener = (prev, next) => {
                    re(object, prev, next);
                    this._onUpdatedInConfig();
                };
            }

            if (value.onClick) {
                const oldOnClick = value.onClick;
                value.onClick = () => {
                    oldOnClick(object);
                }
            }

            value.title = value.title || capitalizeFirst(value.configName);
            value.description = value.description || "";
            value.category = value.subcategory || "Object Editor";
            value.subcategory = value.subcategory || "Main";
            config[value.type](value);
        });

        const settings = new Settings("CarbonaraAddons", config, "ColorScheme.json");

        const setter = (key, value) => {
            settings.settings.getConfig()?.setConfigValue("Object Editor", key, value);
        }

        return (obj) => {
            object = obj;
            updators.forEach((updator) => {
                updator(setter, object);
            });
            settings.settings.getConfig().openGui();
        };
    }

    static _getEditor(object) {
        if (!(object instanceof Editable)) {
            return null;
        }

        if (Editable.configs[object.constructor.name]) {
            return Editable.configs[object.constructor.name](object);
        }

        const config = object.newConfig();
        Editable.configs[object.constructor.name] = config;
        return config(object);
    }
}
