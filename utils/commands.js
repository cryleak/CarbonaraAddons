import Settings from "../config"

import { chat } from "./utils"

const listeners = []
let lastCommandRegistered = Date.now()
/**
 * Registers a subcommand under the command /carbonara or /ca. There can only be 1 listener per subcommand.
 * @param {String[]} args 
 * @param {Function} listener 
 * @param {Function} tabCompletions
 */
export function registerSubCommand(args, listener, tabCompletions) {
    if (!Array.isArray(args)) args = [args]
    const subCommand = { args, listener }
    if (tabCompletions) subCommand.tabCompletions = tabCompletions
    listeners.push(subCommand)
    lastCommandRegistered = Date.now()
}

const commandListener = register("command", (...args) => {
    if (!args || !args.length) return Settings().getConfig().openGui()
    const action = args.shift()
    for (let listener of listeners) {
        if (listener.args.some(arg => arg === action)) return listener.listener(args)
    }
    chat("Unknown subcommand!")
})

const awaitLoading = register("tick", () => { // Bro why did i do this
    if (Date.now() - lastCommandRegistered < 1000) return
    commandListener.setTabCompletions(args => {
        if (args.length === 1) {
            const typedArgument = args[0]
            if (typedArgument.length) return listeners.reduce((acc, subCommand) => {
                const matchingArg = subCommand.args.find(arg => arg.startsWith(typedArgument))
                if (matchingArg) acc.push(`§f${matchingArg}`.toString())
                return acc
            }, [])
            else return listeners.map(listener => `§f${listener.args[0]}`.toString())
        } else if (args.length > 1) {
            const action = args.shift()
            for (let listener of listeners) {
                if (listener.args.some(arg => arg === action) && listener.tabCompletions) return listener.tabCompletions(args)
            }
        }
    })
    commandListener.setName("carbonara").setAliases("ca")
    awaitLoading.unregister()
})