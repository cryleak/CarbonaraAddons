import Settings from "../config"

import { chat } from "./utils"

const listeners = []

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
        if (listener.args.some(arg => arg === action)) listener.listener(args)
    }
}).setName("carbonara").setAliases("cb")