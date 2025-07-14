import Settings from "../config"
import { registerSubCommand } from "../utils/commands"
import { chat, fireChannelRead, inSingleplayer } from "../utils/utils"

let ping = 125
let speed = 500
const S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity")

const simulation = register("tick", () => {
    // const denmark = Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111126_e()
    // if (denmark) ChatLib.chat(denmark)
    if (!inSingleplayer()) return
    if (Settings().simulateSpeed) {
        Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111128_a(speed / 1000)
        Player.getPlayer().field_71075_bZ.func_82877_b(speed / 1000) // Make hclip work correctly
    }

    // Lava bounce
    if (Settings().simulateLavaBounce) {
        if (Player.getPlayer().func_180799_ab() || World.getBlockAt(Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())).type.getRegistryName().includes("rail") && Player.getY() - Math.floor(Player.getY()) < 0.1) {
            simulation.unregister()

            setTimeout(() => {
                // Player.getPlayer().func_70016_h(Player.getPlayer().field_70159_w, yVelo, Player.getPlayer().field_70179_y)
                fireChannelRead(new S12PacketEntityVelocity(Player.getPlayer().func_145782_y(), 0, 3.5, 0))
            }, ping)
            setTimeout(() => simulation.register(), ping + 150)
        }
    }
})

registerSubCommand("setsimulationmovementspeed", (movementspeed) => {
    const requestSpeed = parseInt(movementspeed)
    if (isNaN(requestSpeed)) return
    speed = requestSpeed
    chat(`Set speed to ${speed}. (This doesn't last after you CT load)`)
})