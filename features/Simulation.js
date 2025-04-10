import Settings from "../config"

let ping = 125
const S12PacketEntityVelocity = Java.type("net.minecraft.network.play.server.S12PacketEntityVelocity")

const simulation = register("tick", () => {
    // const denmark = Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111126_e()
    // if (denmark) ChatLib.chat(denmark)
    if (Server.getIP() !== "localhost" && Server.getIP() !== "127.0.0.1" && Server.getIP() !== "127.0.0.1:25564") return
    if (Settings().simulateSpeed) {
        Player.getPlayer().func_110148_a(net.minecraft.entity.SharedMonsterAttributes.field_111263_d).func_111128_a(0.50000000745)
        Player.getPlayer().field_71075_bZ.func_82877_b(0.50000000745) // Make hclip work correctly
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


function fireChannelRead(packet) {
    Client.getConnection().func_147298_b().channel().pipeline().fireChannelRead(packet);
}