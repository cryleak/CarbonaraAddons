import Settings from "../config"
import LeapHelper from "../utils/leapUtils"
import Dungeons from "../utils/Dungeons"
import MouseEvent from "../events/MouseEvent"

import { getTermPhase, Terminal } from "./AutoP3/autoP3Utils"
import { getHeldItemID, playerCoords, sendAirClick } from "../utils/utils"
import { chat } from "../utils/utils"
import { getDistanceToCoord } from "../../BloomCore/utils/Utils"

const classes = ["Archer", "Berserk", "Mage", "Healer", "Tank"]


export default new class FastLeap {
    constructor() {
        this.queuedLeap = false

        MouseEvent.register(event => {
            const { button, state } = event.data
            if (!state || button !== 1) return


            if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return

            LeapHelper.clearQueue()
            this.queuedLeap = false
        }, 0)

        MouseEvent.register(event => {
            if (!Settings().fastLeap) return
            const { button, state } = event.data
            if (!state || button !== 0) return

            if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return

            if (Terminal.inTerminal) {
                if (!Settings().queueFastLeap) return
                this.queuedLeap = true
                event.cancelled = true
                event.breakChain = true
                return chat("Queued a leap after the terminal closes.")
            }

            this.queuedLeap = false
            const player = this.getPlayerToLeapTo()
            if (player === null) return
            if (!player || !player.length) return
            sendAirClick()
            LeapHelper.queueLeap(player)
            event.cancelled = true
            event.breakChain = true
        })

        register("tick", () => {
            if (Terminal.inTerminal || !this.queuedLeap) return
            if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return
            sendAirClick()

            this.queuedLeap = false
            const player = this.getPlayerToLeapTo()
            if (!player) return
            LeapHelper.queueLeap(player)
        })

        register("worldUnload", () => {
            this.queuedLeap = false
        })
    }

    getPlayerToLeapTo(relic = false) {
        const termPhase = getTermPhase(playerCoords().player)
        let target = Settings()["fastLeapS" + termPhase]
        if (relic) target = Settings().autoLeapOnRelicName
        else if (!target && Settings().pyFastLeap && getDistanceToCoord(97, 166.5, 94) < 10) target = Settings().fastLeapPP
        let player
        if (classes.includes(target)) {
            const party = Dungeons.teamMembers
            player = Object.keys(party).find(teamMember => party[teamMember]["dungeonClass"] === target)
            if (!player) {
                chat(`§cCan't find a player with the class "${target}"!`)
                return null
            }
        } else player = target
        if (!player) chat("§cCouldn't get player or something idk")
        return player
    }

}
