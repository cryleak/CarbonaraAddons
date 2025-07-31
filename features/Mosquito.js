import { SyncHeldItem } from "../events/JavaEvents"
import fakeKeybinds from "../utils/fakeKeybinds"
import { chat, hasSwappedThisTick, itemSwapSuccess, swapFromName, swapHelmets } from "../utils/utils"
import ServerTick from "../events/ServerTick"


const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")

const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")

const packet = new net.minecraft.network.play.client.C0APacketAnimation()


export default new class MosquitoShooter {
    constructor() {
        fakeKeybinds.onKeyPress("mosquitoShortbowSwapKeybind", () => Client.scheduleTask(0, () => this._doSwap()))

        this.inGUI = false
        register("packetReceived", () => this.inGUI = true).setFilteredClass(S2DPacketOpenWindow)

        register("packetReceived", () => this.inGUI = false).setFilteredClass(S2EPacketCloseWindow)
        register("packetSent", () => this.inGUI = false).setFilteredClass(C0DPacketCloseWindow)
        register("worldLoad", () => this.inGUI = false)
    }

    _doSwap() {
        if (hasSwappedThisTick()) return chat(`Why is this happening`)
        if (!Player?.getHeldItem()?.getName()?.includes("Awkward")) return chat(`You're not holding an Awkward bow.`)
        if (this.inGUI) return chat(`You're in a GUI!`)
        if (Player.getInventory().getItems()[39]?.getName()?.removeFormatting()?.includes("Warden Helmet")) return chat(`You have the wrong helmet on!`)
        swapFromName("Mosquito Shortbow", result => {
            if (result === itemSwapSuccess.FAIL) return chat(`Couldn't find Mosquito Shortbow!`)
            let start = Date.now()
            SyncHeldItem.Post.scheduleTask(1, () => {
                ChatLib.chat(Date.now() - start)
                for (let i = 0; i < 140; i++) {
                    Client.sendPacket(packet)
                }
                Client.scheduleTask(0, () => swapFromName("Fabled End Sword"))
                const wardenSlot = Player.getInventory().getItems().findIndex((item, index) => index < 36 && index >= 0 && item?.getName()?.removeFormatting()?.includes("Warden Helmet"))
                if (wardenSlot === -1) return
                swapHelmets(wardenSlot)
                ServerTick.scheduleTask(19, () => {
                    if (this.inGUI) return chat(`Failed to swap back to your preivous helmet; you're in a GUI for some reason`)
                    swapHelmets(wardenSlot)
                })
            })
        })
    }
}