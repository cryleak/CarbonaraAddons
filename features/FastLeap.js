import Settings from "../config"
import LeapHelper from "../utils/leapUtils"
import Dungeons from "../utils/Dungeons"

import { Terminal, getHeldItemID, getTermPhase, playerCoords, sendAirClick } from "../utils/autop3utils"
import { chat } from "../utils/utils"
import { getDistanceToCoord } from "../../BloomCore/utils/Utils"

const MouseEvent = Java.type("net.minecraftforge.client.event.MouseEvent")
const ArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand")
const classes = ["Archer", "Berserk", "Mage", "Healer", "Tank"]


export default new class FastLeap {
    constructor() {
        this.queuedLeap = false
        this.ignoreC02 = false

        register(MouseEvent, (event) => {
            const button = event.button
            const state = event.buttonstate
            if (!state || button !== 1) return


            if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return

            LeapHelper.clearQueue()
            this.queuedLeap = false
        })

        register(MouseEvent, (event) => {
            if (!Settings().fastLeap) return
            const button = event.button
            const state = event.buttonstate
            if (!state || button !== 0) return

            if (getHeldItemID() !== "INFINITE_SPIRIT_LEAP" && Player?.getHeldItem()?.getName()?.removeFormatting() !== "Spirit Leap") return

            if (Terminal.inTerminal) {
                if (!Settings().queueFastLeap) return
                this.queuedLeap = true
                cancel(event)
                return chat("Queued a leap after the terminal closes.")
            }

            this.queuedLeap = false
            const player = this.getPlayerToLeapTo()
            if (player === null) return
            if (!player || !player.length) return
            sendAirClick()
            LeapHelper.queueLeap(player)
            cancel(event)
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

        register("packetSent", (packet, event) => {
            if (this.ignoreC02) return
            if (!Settings().autoLeapOnRelic) return
            const entity = packet.func_149564_a(World.getWorld())
            if (!entity instanceof ArmorStand) return
            const entityWornHelmet = entity?.func_82169_q(3)
            if (!entityWornHelmet) return
            const helmetName = ChatLib.removeFormatting(new Item(entityWornHelmet).getName())
            if (!helmetName.includes("Relic")) return

            const player = this.getPlayerToLeapTo(true)
            if (player === null) return
            if (!player || !player.length) return

            cancel(event)
            this.ignoreC02 = true
            Client.sendPacket(packet)
            this.ignoreC02 = false

            const clickDelay = parseInt(Settings().autoLeapOnRelicDelay)
            if (isNaN(clickDelay) || clickDelay === 0) LeapHelper.clickInLeapMenu(player)
            else setTimeout(() => LeapHelper.clickInLeapMenu(player), clickDelay)

        }).setFilteredClass(net.minecraft.network.play.client.C02PacketUseEntity)
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