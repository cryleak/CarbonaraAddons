import Settings from "../../config"
import fakeKeybinds from "../../utils/fakeKeybinds"
import Module, { registerModule } from "../PhoenixModule"

const S2FPacketSetSlot = Java.type("net.minecraft.network.play.server.S2FPacketSetSlot")
const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
const S3FPacketCustomPayload = Java.type("net.minecraft.network.play.server.S3FPacketCustomPayload");

const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")

const Items = Java.type("net.minecraft.init.Items")

registerModule(class WardrobeToggle extends Module {
    constructor(phoenix) {
        super("Wardrobe", phoenix)
        this._tryLoadConfig();

        this.awaitingWardrobe = false
        this.equippedSlot = null
        this.inWardrobe = false
        this.currentWindowID = null

        register("packetReceived", (packet, event) => this._handleOpenWindow(packet, event)).setFilteredClass(S2DPacketOpenWindow)
        register("packetReceived", (packet) => this._handleSetSlot(packet)).setFilteredClass(S2FPacketSetSlot)

        register("packetReceived", () => this._resetWindow()).setFilteredClass(S2EPacketCloseWindow)
        register("packetSent", (_packet) => this._resetWindow()).setFilteredClass(C0DPacketCloseWindow)

        register("worldLoad", () => this._resetWindow())

        register("packetReceived", (packet, _) => {
            if (packet.func_149169_c() === "mi0-wd-close-gui") {
                Client.getMinecraft().field_71462_r = null;
            }
        }).setFilteredClass(S3FPacketCustomPayload);

        fakeKeybinds.onKeyPress("armorSetToggleKeybind", () => this._handleKeyBind())
    }

    _handleKeyBind() {
        if (!Settings().armorSetToggle) return

        ChatLib.command("wardrobe", false)
        if (this.isToggled()) {
            this._phoenix.customPayload("mi0-wardrobe", { slots: [Settings().armorSetToggleSlot1, Settings().armorSetToggleSlot2] });
            return;
        }
        this.awaitingWardrobe = true
    }

    _handleOpenWindow(packet, event) {
        this.currentWindowID = packet.func_148901_c()
        if (packet.func_179840_c().func_150260_c() !== "Wardrobe (1/2)") {
            this._resetWindow()
            return
        }
        if (!this.awaitingWardrobe) return
        cancel(event)
        Client.getMinecraft().field_71462_r = null
        this.awaitingWardrobe = false
        this.inWardrobe = true
    }

    _handleSetSlot(packet) {
        if (packet.func_149175_c() !== this.currentWindowID || !this.inWardrobe) return
        const itemStack = packet.func_149174_e()
        if (itemStack?.func_77973_b() !== Items.field_151100_aR) return
        const color = itemStack.func_77952_i()
        if (color !== 10) return

        const equippedSlot = packet.func_149173_d() - 36
        let slot
        if (Settings().armorSetToggleSlot1 === equippedSlot) slot = Settings().armorSetToggleSlot2
        else slot = Settings().armorSetToggleSlot1
        Client.sendPacket(new C0EPacketClickWindow(this.currentWindowID, slot + 36, 0, 0, null, 0))
        Client.sendPacket(new C0DPacketCloseWindow(this.currentWindowID))
        this._resetWindow()
    }

    _resetWindow() {
        this.awaitingWardrobe = false
        this.inWardrobe = false
        this.currentWindowID = null
    }
});
