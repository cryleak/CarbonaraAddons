import Settings from "../config"
import LeapHelper from "../utils/leapUtils"
import Dungeons from "../../Atomx/skyblock/Dungeons"

import { getHeldItemID, getTermPhase, playerCoords, sendAirClick, termNames } from "../utils/autop3utils"
import { chat } from "../utils/utils"
import { getDistanceToCoord } from "../../BloomCore/utils/Utils"

const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")
const MouseEvent = Java.type("net.minecraftforge.client.event.MouseEvent")
const classes = ["Archer", "Berserk", "Mage", "Healer", "Tank"]

let inTerminal = false
let queuedLeap = false

register(MouseEvent, (event) => {
    const button = event.button
    const state = event.buttonstate
    if (!state || button !== 1) return


    if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return

    LeapHelper.clearQueue()
    queuedLeap = false
})

register(MouseEvent, (event) => {
    if (!Settings().fastLeap) return
    const button = event.button
    const state = event.buttonstate
    if (!state || button !== 0) return

    if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return

    if (inTerminal) {
        if (!Settings().queueFastLeap) return
        queuedLeap = true
        cancel(event)
        return chat("Queued a leap after the terminal closes.")
    }

    sendAirClick()
    queuedLeap = false
    const player = getPlayerToLeapTo()
    if (player === null) return
    if (!player || !player.length) return
    LeapHelper.queueLeap(player)
    cancel(event)
})

function getPlayerToLeapTo() {
    const termPhase = getTermPhase(playerCoords().player)
    let target = Settings()["fastLeapS" + termPhase]
    if (!termPhase && Settings().pyFastLeap && getDistanceToCoord(97, 166.5, 94) < 10) target = Settings().fastLeapPP
    else return
    let player
    if (classes.includes(target)) {
        const party = Dungeons.getTeamMembers()
        player = Object.keys(party).find(teamMember => party[teamMember]["class"] === target)
        if (!player) {
            chat(`§cCan't find a player with the class "${target}"!`)
            return null
        }
    } else player = target
    if (!player) chat("§cCouldn't get player or something idk")
    return player
}

register("tick", () => {
    if (inTerminal || !queuedLeap) return
    if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return
    sendAirClick()

    queuedLeap = false
    const player = getPlayerToLeapTo()
    if (!player) return
    LeapHelper.queueLeap(player)
})


register("packetReceived", (packet, event) => {
    const windowName = packet.func_179840_c().func_150254_d().removeFormatting()
    if (termNames.some(regex => windowName.match(regex))) inTerminal = true
    else inTerminal = false
}).setFilteredClass(S2DPacketOpenWindow)

register("packetReceived", () => {
    inTerminal = false
}).setFilteredClass(S2EPacketCloseWindow)

register("packetSent", () => {
    inTerminal = false
}).setFilteredClass(C0DPacketCloseWindow)

register("worldUnload", () => {
    inTerminal = false
    queuedLeap = false
})