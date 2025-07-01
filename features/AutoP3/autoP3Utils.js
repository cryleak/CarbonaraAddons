
import Settings from "../../config"
import Vector3 from "../../../BloomCore/utils/Vector3"

import { debugMessage, chat, getDistance2DSq } from "../../utils/utils"

const renderManager = Client.getMinecraft().func_175598_ae()
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")

/**
 * Retarded way to get center of block cause I couldn't think when I made this
 * @param {Array} blockCoords 
 * @returns {Array} Centered blockCoords 
 */
export const centerCoords = (blockCoords) => {
    return [Math.floor(blockCoords[0]) + (Math.sign(blockCoords[0] === 1) ? -0.5 : 0.5), Math.floor(blockCoords[1]), Math.floor(blockCoords[2]) + (Math.sign(blockCoords[2] === 1) ? -0.5 : 0.5)]
}


const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")
const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")

export function jump() {
    /*
    KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), true)
    scheduleTask(1, () => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), false))
    */
    if (!Player.getPlayer().field_70122_E) return chat("You aren't on the ground!")
    Player.getPlayer().func_70664_aZ()
}

/**
 * Checks if the coordinates is inside of a terminal phase.
 * @param {Number[]} coords 
 * @returns What terminals set a set of coordinates is in, or 0 if it isn't in any.
 */
export function getTermPhase(coords) {
    if (isCoordsWithinBox(coords, [113, 160, 48], [89, 100, 122])) return 1
    else if (isCoordsWithinBox(coords, [91, 160, 145], [19, 100, 121])) return 2
    else if (isCoordsWithinBox(coords, [-6, 160, 123], [19, 100, 50])) return 3
    else if (isCoordsWithinBox(coords, [17, 160, 27], [90, 100, 54])) return 4
    else return 0
}

function isCoordsWithinBox(coords, corner1, corner2) {
    return (coords[0] >= Math.min(corner1[0], corner2[0]) && coords[0] <= Math.max(corner1[0], corner2[0]) &&
        coords[1] >= Math.min(corner1[1], corner2[1]) && coords[1] <= Math.max(corner1[1], corner2[1]) &&
        coords[2] >= Math.min(corner1[2], corner2[2]) && coords[2] <= Math.max(corner1[2], corner2[2]))
}

export const termNames = [
    /^Click in order!$/,
    /^Select all the (.+?) items!$/,
    /^What starts with: '(.+?)'\?$/,
    /^Change all to same color!$/,
    /^Correct all the panes!$/,
    /^Click the button on time!$/
]

class Terminal {
    constructor() {
        this.inTerminal = false
        this.currentWindowName = null
        this.lastMelodyClick = Date.now()

        register("packetReceived", (packet, event) => {
            const windowName = packet.func_179840_c().func_150254_d().removeFormatting()
            if (termNames.some(regex => windowName.match(regex))) this.inTerminal = true
            else this.inTerminal = false
            this.currentWindowName = packet.func_179840_c().func_150254_d().removeFormatting()
        }).setFilteredClass(S2DPacketOpenWindow)

        register("packetReceived", () => {
            this.inTerminal = false
            this.currentWindowName = null
        }).setFilteredClass(S2EPacketCloseWindow)

        register("packetSent", () => {
            this.inTerminal = false
            this.currentWindowName = null
        }).setFilteredClass(C0DPacketCloseWindow)

        register("packetSent", () => {
            if (this.currentWindowName === "Click the button on time!") this.lastMelodyClick = Date.now()
        }).setFilteredClass(C0EPacketClickWindow)

        register("worldUnload", () => {
            this.inTerminal = false
            this.currentWindowName = null
        })
    }
}

const terminalInstance = new Terminal()
export { terminalInstance as Terminal }