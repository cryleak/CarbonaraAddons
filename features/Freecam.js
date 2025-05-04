import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import RenderLibV2 from "../../RenderLibV2"
import { playerCoords, setVelocity } from "../utils/autoP3Utils"
import { chat } from "../utils/utils"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")
const C07PacketPlayerDigging = Java.type("net.minecraft.network.play.client.C07PacketPlayerDigging")
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")

let toggled = false
let playerPosition = playerCoords().player

register("packetSent", (packet, event) => {
    if (toggled) cancel(event)
}).setFilteredClasses([C03PacketPlayer, C07PacketPlayerDigging, C08PacketPlayerBlockPlacement])

register("playerInteract", (action, position, event) => {
    if (toggled) cancel(event)
})

register("hitBlock", (block, event) => {
    if (toggled) cancel(event)
})

register("renderWorld", () => {
    if (!toggled) return
    RenderLibV2.drawEspBoxV2(...playerPosition, 0.5, 2, 0.5, 1, 1, 1, 1, true)
    RenderLibV2.drawInnerEspBoxV2(...playerPosition, 0.5, 2, 0.5, 1, 1, 1, 0.5, true)
})

register("command", toggleFreecam).setName("togglefreecam")
fakeKeybinds.onKeyPress("freecamKeybind", toggleFreecam)

function toggleFreecam() {
    toggled = !toggled
    if (!toggled) {
        Player.getPlayer().field_71075_bZ.field_75101_c = false
        Player.getPlayer().field_71075_bZ.field_75100_b = false
        Player.getPlayer().func_70107_b(...playerPosition)
        setVelocity(0, 0, 0)
    } else Player.getPlayer().field_71075_bZ.field_75101_c = true

    playerPosition = playerCoords().player
    chat(`Freecam ${toggled ? "enabled" : "disabled"}.`)
}