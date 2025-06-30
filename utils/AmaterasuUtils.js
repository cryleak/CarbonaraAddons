import nodeCreation from "../nodeCreation"
import { makeConfig } from "../nodeCreation"


/**
 * - Sets the new config value of the given [configName]. You need to call applyConfigChanges() to apply it.
 * @param {ConfigName} configName
 * @param {any} value
 * @returns {this} this for method chaining
 */
function setConfigValue(configName, value) {
    const category = "Route"
    const config = nodeCreation().getConfig()
    if (!category || !configName || !config.categories.has(category)) throw new Error(`category: ${category} or configName: ${configName} are not valid.`)


    let configObj = config.config.find(it => it.category === category)?.settings?.find(it => it.name === configName)

    // Multicheckbox logic
    if (!configObj) {
        configObj = config.config.find(it => it.category === category)?.settings?.find(it => it.options?.some(n => n.configName === configName))
        if (configObj?.type === ConfigTypes.MULTICHECKBOX)
            configObj = configObj.options.find(it => it.configName === configName)
    }
    if (!configObj) return config

    let oldv = configObj.value
    configObj.value = value
    config.configsClass._normalizeSettings(config.settings)
}

function applyConfigChanges() {
    // const start = System.nanoTime()
    unloadConfig()
    makeConfig()
    // const end = System.nanoTime()
    // ChatLib.chat(`Reloading took ${(end - start) / 1000000}ms`)
}

function unloadConfig() {
    const defaultConfig = nodeCreation().getConfig().defaultConfig
    defaultConfig._saveToFile()
    if (defaultConfig.settingsInstance) {
        const gui = defaultConfig.settingsInstance.handler.ctGui
        if (gui.isOpen()) gui.close()

        defaultConfig.settingsInstance.handler = null
        defaultConfig.settingsInstance = null
    }
}

export default { setConfigValue, applyConfigChanges }