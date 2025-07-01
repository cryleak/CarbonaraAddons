import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import RenderLibV2 from "../../RenderLibV2"
import { chat, playerCoords, setPlayerPositionNoInterpolation, setVelocity } from "../utils/utils"
import { registerSubCommand } from "../utils/commands"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const C07PacketPlayerDigging = Java.type("net.minecraft.network.play.client.C07PacketPlayerDigging")
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const S08PacketPlayerPosLook = Java.type("net.minecraft.network.play.server.S08PacketPlayerPosLook")

export default new class Freecam {
    constructor() {
        this.toggled = false
        this.realPlayerPosition = playerCoords().player
        this.eventCancellers = [
            register("packetSent", (packet, event) => cancel(event)).setFilteredClasses([C03PacketPlayer, C07PacketPlayerDigging, C08PacketPlayerBlockPlacement]).unregister(),
            register("playerInteract", (action, position, event) => cancel(event)).unregister(),
            register("hitBlock", (block, event) => cancel(event)).unregister(),
            register("renderWorld", () => {
                RenderLibV2.drawEspBoxV2(... this.realPlayerPosition, 0.5, 2, 0.5, 1, 1, 1, 1, true)
                RenderLibV2.drawInnerEspBoxV2(...this.realPlayerPosition, 0.5, 2, 0.5, 1, 1, 1, 0.5, true)
            }).unregister(),
            register("packetReceived", () => {
                this.toggle(false)
                chat("You got lagbacked for some reason. Freecam has been disabled.")
            }).setFilteredClass(S08PacketPlayerPosLook).unregister()
        ]

        registerSubCommand("togglefreecam", () => {
            this.toggle()
            chat(`Freecam ${this.toggled ? "enabled" : "disabled"}.`)
        })
        fakeKeybinds.onKeyPress("freecamKeybind", () => {
            this.toggle()
            chat(`Freecam ${this.toggled ? "enabled" : "disabled"}.`)
        })
    }

    toggle(state = !this.toggled) {
        if (state === this.toggled) return
        this.toggled = state
        if (!this.toggled) {
            const currentGamemode = Client.getMinecraft().field_71442_b.func_178889_l().toString()
            const isInSurvival = currentGamemode === "ADVENTURE" || currentGamemode === "SURVIVAL"
            Player.getPlayer().field_71075_bZ.field_75101_c = isInSurvival ? false : true
            if (isInSurvival) Player.getPlayer().field_71075_bZ.field_75100_b = false
            setPlayerPositionNoInterpolation(...this.realPlayerPosition)
            setVelocity(0, 0, 0)
            this.eventCancellers.forEach(register => register.unregister())
        } else {
            this.realPlayerPosition = playerCoords().player
            Player.getPlayer().field_71075_bZ.field_75101_c = true
            this.eventCancellers.forEach(register => register.register())
        }
    }
}