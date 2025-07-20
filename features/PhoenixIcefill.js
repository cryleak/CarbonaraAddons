import Settings from "../config"
import Dungeons from "../utils/Dungeons"
import RenderLibV2 from "../../RenderLibV2J"
import { chat, setPlayerPosition, setVelocity } from "../utils/utils"
import Vector3 from "../utils/Vector3"

const S02PacketChat = Java.type("net.minecraft.network.play.server.S02PacketChat")
const IceFillSolver = Java.type("me.odinmain.features.impl.dungeon.puzzlesolvers.IceFillSolver").INSTANCE
const currentPatternsField = IceFillSolver.class.getDeclaredField("currentPatterns")
currentPatternsField.setAccessible(true)


export default new class PhoenixIcefill {
    constructor() {
        this.scannedIcefill = false
        this.currentPatterns = false

        register("tick", () => {
            if (!Settings().autoIcefillEnabled) return
            // if (!isOnPhoenix()) return
            if (Dungeons.getRoomName() !== "Ice Fill") return scanned = false
            if (scanned) return
            currentPatterns = currentPatternsField.get(IceFillSolver)
            if (!currentPatterns.length) return
            currentPatterns = currentPatterns.map(pattern => new Vector3(pattern).add(0, -0.1, 0))
            let xOffset = 0
            let zOffset = 0
            for (let i = currentPatterns.length - 1; i >= 0; i--) { // Fix the solution so we can actually use it
                let previousBlock = currentPatterns[i + 1]
                if (!previousBlock) continue
                let currentBlock = currentPatterns[i]
                if (previousBlock[1] === currentBlock[1]) {
                    continue
                }
                xOffset = currentBlock.x - previousBlock.x
                zOffset = currentBlock.z - previousBlock.z
                let stair = [currentBlock.x + (xOffset * -0.25), currentBlock.y + 0.5, currentBlock.z + (zOffset * -0.25)]
                let stair2 = [currentBlock.x + (xOffset * -0.5), currentBlock.y + 1, currentBlock.z + (zOffset * -0.5)]
                currentPatterns.splice(i + 1, 0, stair2)
                currentPatterns.splice(i + 1, 0, stair)
            }
            currentPatterns.splice(0, 0, [currentPatterns[0].x + (xOffset * 0.5), currentPatterns[0].y, currentPatterns[0].z + (zOffset * 0.5)])
            scanned = true
            const buffer = new PacketBuffer(Unpooled.buffer())
            buffer.func_180714_a(JSON.stringify(currentPatterns))
            Client.sendPacket(new C17PacketCustomPayload("serenity-autoicefill", buffer))
            chat("Sent Icefill solution to the proxy.")
        })

        register("renderWorld", () => {
            if (!Settings().autoIcefillEnabled) return
            if (!scanned) return
            if (Dungeons.getRoomName() !== "Ice Fill") return

            for (let i = 0; i < currentPatterns.length; i++) {
                let currentBlock = currentPatterns[i]
                RenderLibV2.drawEspBox(currentBlock.x, currentBlock.y, currentBlock.z, 0.05, 0.05, 0, 1, 1, 1, true)

                let previousBlock = currentPatterns[i - 1]
                if (!previousBlock) continue
                RenderLibV2.drawLine(previousBlock.x, previousBlock.y, previousBlock.z, currentBlock.x, currentBlock.y, currentBlock.z, 1, 1, 1, 1, true, 1)
            }

        })

        register("packetReceived", (packet, event) => {
            if (packet.func_179841_c() === 2) return
            const message = ChatLib.removeFormatting(packet.func_148915_c().func_150260_c())

            if (!message.startsWith("serenity-autoicefill setpos: ")) return
            const pos = message.split("serenity-autoicefill setpos: ")[1].split(",").map(pos => parseFloat(pos))
            if (pos.length !== 3) return
            setPlayerPosition(...pos)
            setVelocity(0, 0, 0)
            cancel(event)
        }).setFilteredClass(S02PacketChat)
    }
}