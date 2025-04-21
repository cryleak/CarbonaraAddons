import Settings from "../config"

import { chat } from "./utils"

const listeners = []

/**
 * Registers a subcommand under the command /carbonara or /cb. There can only be 1 listener per subcommand.
 * @param {string[]} args 
 * @param {function} listener 
 */
export function registerSubCommand(args, listener) {
    if (!Array.isArray(args)) args = [args]
    listeners.push({ args, listener })
}

registerSubCommand("help", () => {
    chat(`List of subcommands:\n${listeners.map(listener => listener.args.join(", ") + (listener.args.length > 1 ? " (These all do the same thing)" : "")).join("\n")}`)
})

register("command", (...args) => {
    if (!args || !args.length) return Settings().getConfig().openGui()
    const action = args.shift()
    for (let i = 0; i < listeners.length; i++) {
        let listener = listeners[i]
        if (listener.args.some(arg => arg === action)) return listener.listener(args)
    }
    chat(`Unknown subcommand! List of subcommands:\n${listeners.map(listener => listener.args.join(", ") + (listener.args.length > 1 ? " (These all do the same thing)" : "")).join("\n")}`)
}).setName("carbonara").setAliases("ca")