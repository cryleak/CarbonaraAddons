import Dungeons from "../utils/Dungeons"
import RenderLibV2 from "../../RenderLibV2J"
import { chat, setPlayerPosition, setVelocity } from "../utils/utils"
import Vector3 from "../utils/Vector3"
import Module, { registerModule } from "./PhoenixModule"

const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat")
const IceFillSolver = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.IceFillSolver").INSTANCE
const currentPatternsField = IceFillSolver.class.getDeclaredField("currentPatterns")
currentPatternsField.setAccessible(true)


registerModule(class PhoenixIcefill extends Module {
    constructor(phoenix) {
        super("AutoIcefill", phoenix)
        this._tryLoadConfig();

        this.currentPatterns = false

        register("tick", () => {
            if (this.isToggled()) {
                this._scan();
            }
        })

        register("renderWorld", () => {
            if (this.isToggled()) {
                this._render();
            }
        })

        register("packetReceived", (packet, event) => {
            if (this.isToggled()) {
                this._handleChatPacket(packet, event);
            }
        }).setFilteredClass(S02PacketChat)
    }

    _handleChatPacket(packet, event) {
        if (packet.func_179841_c() === 2) return
        const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c())

        if (!message.startsWith("[Phoenix] serenity-autoicefill setpos: ")) return
        const pos = message.split("[Phoenix] serenity-autoicefill setpos: ")[1].split(",").map(pos => parseFloat(pos))
        if (pos.length !== 3) return
        setPlayerPosition(...pos)
        setVelocity(0, 0, 0)
        cancel(event)
    }

    _render() {
        if (!this.scanned) return
        if (Dungeons.getRoomName() !== "Ice Fill") return

        for (let i = 0; i < this.currentPatterns.length; i++) {
            let currentBlock = this.currentPatterns[i]
            RenderLibV2.drawEspBox(currentBlock.x, currentBlock.y, currentBlock.z, 0.05, 0.05, 0, 1, 1, 1, true)

            let previousBlock = this.currentPatterns[i - 1]
            if (!previousBlock) continue
            RenderLibV2.drawLine(previousBlock.x, previousBlock.y, previousBlock.z, currentBlock.x, currentBlock.y, currentBlock.z, 1, 1, 1, 1, true, 1)
        }
    }

    _scan() {
        // if (!isOnPhoenix()) return
        if (Dungeons.getRoomName() !== "Ice Fill") return this.scanned = false
        if (this.scanned) return
        this.currentPatterns = currentPatternsField.get(IceFillSolver)
        if (!this.currentPatterns.length) return
        this.currentPatterns = this.currentPatterns.map(pattern => new Vector3(pattern).add(0, -0.1, 0))
        let xOffset = 0
        let zOffset = 0
        for (let i = this.currentPatterns.length - 1; i >= 0; i--) { // Fix the solution so we can actually use it
            let previousBlock = this.currentPatterns[i + 1]
            if (!previousBlock) {
                continue
            }
            let currentBlock = this.currentPatterns[i]
            if (previousBlock.y === currentBlock.y) {
                continue
            }
            xOffset = currentBlock.x - previousBlock.x
            zOffset = currentBlock.z - previousBlock.z
            let stair = new Vector3(currentBlock.x + (xOffset * -0.25), currentBlock.y + 0.5, currentBlock.z + (zOffset * -0.25))
            let stair2 = new Vector3(currentBlock.x + (xOffset * -0.5), currentBlock.y + 1, currentBlock.z + (zOffset * -0.5))
            this.currentPatterns.splice(i + 1, 0, stair2)
            this.currentPatterns.splice(i + 1, 0, stair)
        }
        this.currentPatterns.splice(0, 0, new Vector3(this.currentPatterns[0].x + (xOffset * 0.5), this.currentPatterns[0].y, this.currentPatterns[0].z + (zOffset * 0.5)))
        this.scanned = true
        this._phoenix.customPayload("serenity-autoicefill", this.currentPatterns)
        chat("Sent Icefill solution to the proxy.")
    }
});
