import { SyncHeldItem } from "../events/JavaEvents"
import fakeKeybinds from "../utils/fakeKeybinds"
import { chat, itemSwapSuccess, swapFromName } from "../utils/utils"


const C0APacketAnimation = Java.type("net.minecraft.network.play.client.C0APacketAnimation")

fakeKeybinds.onKeyPress("mosquitoShortbowSwapKeybind", () => {
    swapFromName("Mosquito Shortbow", result => {
        if (result === itemSwapSuccess.FAIL) return chat(`Couldn't find Mosquito Shortbow!`)
        SyncHeldItem.Post.scheduleTask(0, () => {
            const packet = new C0APacketAnimation()
            for (let i = 0; i < 140; i++) {
                Client.sendPacket(packet)
            }
            Client.scheduleTask(0, () => {
                swapFromName("Fabled End Sword")
            })
        })
    })
})

let lastArrowHit = Date.now()
let arrowsHit = 0

register("packetReceived", (packet) => {
    const name = packet.func_149212_c()

    if (Date.now() - lastArrowHit > 1000 && arrowsHit) {
        chat(`Hit ${arrowsHit} arrows.`)
        arrowsHit = 0
    }
    if (name !== "random.successful_hit") return
    lastArrowHit = Date.now()
    arrowsHit++
}).setFilteredClass(net.minecraft.network.play.server.S29PacketSoundEffect)