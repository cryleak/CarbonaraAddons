import { chat } from "../utils/utils"
import Dungeons from "../utils/Dungeons"

const classes = ["Archer", "Berserk", "Mage", "Healer", "Tank"]

const sendWindowClick = (windowId, slot, clickType, actionNumber = 0) => Client.sendPacket(new C0EPacketClickWindow(windowId ?? Player.getContainer().getWindowId(), slot, clickType ?? 0, 0, null, actionNumber))
const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot")
const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")

export default new class LeapHelper {
    constructor() {
        this.leapQueue = []
        this.menuOpened = false
        this.shouldLeap = false
        this.inProgress = false
        this.clickedLeap = false

        register("packetReceived", (packet, event) => {
            if (!this._inQueue() || !this.menuOpened) return


            const itemStack = packet.func_149174_e()
            const slot = packet.func_149173_d()
            const windowID = packet.func_149175_c()

            if (!windowID || !itemStack || !slot) return
            if (slot > 35) {
                chat("§cCould not find" + this._currentLeap())
                this._reloadGUI()
                return
            }
            cancel(event)

            const item = new Item(itemStack)
            const itemName = item?.getName()?.removeFormatting()?.toLowerCase()
            if (itemName !== this._currentLeap()?.toLowerCase()) return
            sendWindowClick(windowID, slot, 0, 0)
            this._reloadGUI()

        }).setFilteredClass(S2FPacketSetSlot)

        register("packetReceived", (packet, event) => {
            if (!this._inQueue()) return

            const title = ChatLib.removeFormatting(packet.func_179840_c().func_150254_d())
            this.WindowID = packet.func_148901_c()


            if (title !== "Spirit Leap") return
            this.menuOpened = true
            this.clickedLeap = false
            Client.getMinecraft().field_71462_r = null
            cancel(event)
        }).setFilteredClass(S2DPacketOpenWindow)

        register("chat", () => {
            this.clickedLeap = false
            this.inProgress = false
            this.leapQueue.pop()
        }).setChatCriteria(/^This ability is on cooldown for (\d+)s\.$/)
    }

    getPlayerToLeapTo(target) {
        if (classes.includes(target)) {
            const party = Dungeons.teamMembers
            player = Object.keys(party).find(teamMember => party[teamMember]["dungeonClass"] === target)
            if (!player) {
                chat(`§cCan't find a player with the class "${target}"!`)
                return null
            }

            return player;
        }

        return target;
    }

    _inQueue() {
        return this.leapQueue.length > 0
    }

    _currentLeap() {
        return this.leapQueue[0]
    }

    _reloadGUI() {
        this.menuOpened = false
        this.leapQueue.shift()
        this.inProgress = false
    }

    clearQueue() {
        this.leapQueue = []
    }

    queueLeap(name) {
        this.leapQueue.push(name)
        chat(`Attemping to leap to ${name}`)
    }

    autoLeap(name) {
        if (this.clickedLeap) return
        if (this.inProgress) return

        const leapID = Player.getInventory()?.getItems()?.find(a => a?.getName()?.removeFormatting() == "Infinileap")?.getID()
        if (!leapID) return
        const leapSlot = parseInt(Player.getInventory().indexOf(leapID))
        if (leapSlot > 7 || leapSlot < 0) return

        this.inProgress = true

        Player.setHeldItemIndex(leapSlot)

        Client.scheduleTask(0, () => {
            rightClick()
            this.clickedLeap = true
        })

        this.leapQueue.push(name)

    }

    clickInLeapMenu(name) {
        if (Player?.getContainer().getName() !== "Spirit Leap") return
        const item = Player.getContainer().getItems().findIndex(item => item?.getName()?.substring(2)?.toLowerCase() === name.toLowerCase())
        if (item === -1) return chat(`Could not find ${name}`)
        Player.getContainer().click(item)
        chat(`Attemping to leap to ${name}`)
    }
}
