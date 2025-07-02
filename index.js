import "./features/AutoP3"
import "./features/Simulation"
import "./features/FastLeap"
import "./features/Freecam"
import "./features/SecretAura"
import "./features/Relic"
import "./features/AutoRoutes"


/*
// i was testing stuff for no reason
import { C03PacketPlayer, S08PacketPlayerPosLook } from "../BloomCore/utils/Utils"


const ChannelDuplexHandler = Java.type("io.netty.channel.ChannelDuplexHandler")
const ChannelOutboundHandlerAdapter = Java.type("io.netty.channel.ChannelOutboundHandlerAdapter")

let connection
if (Client.getConnection()) connection = Client.getConnection().func_147298_b().channel().pipeline()
register(net.minecraftforge.fml.common.network.FMLNetworkEvent.ClientConnectedToServerEvent, (event) => {
    connection = event.manager.channel().pipeline()
    console.log(connection.names())
    connection.addBefore("packet_handler", "carbonara_packet_handler_serverbound", new JavaAdapter(ChannelOutboundHandlerAdapter, {
        write: function (ctx, msg, promise) {
            ctx.write(msg, promise);
            serverBoundListeners.forEach(listener => listener(msg))
        }
    }))
    console.log(connection.names())
})

register("gameUnload", () => {
    if (!connection) return
    connection.remove("carbonara_packet_handler_serverbound")
})

const clientBoundListeners = []
const serverBoundListeners = []
function onPacketReceive(listener) {
    clientBoundListeners.push(listener)
}

function onPacketSent(listener) {
    serverBoundListeners.push(listener)
}

onPacketReceive((packet) => {
    if (!(packet instanceof S08PacketPlayerPosLook)) return
    ChatLib.chat(`${(Player.getX() + Player.getZ() + Player.getY()) - (packet.func_148932_c() + packet.func_148928_d() + packet.func_148933_e())}`)
})

onPacketSent(packet => {
    ChatLib.chat(packet.class.getSimpleName())
})
    */

register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (event.isCancelled()) return
        if (!packet./* getRotating */func_149463_k() && !packet.func_149466_j()) return
        let string = ""
        string += Date.now() + " "
        string += `x: ${packet./* getPositionX */func_149464_c()}, y: ${packet./* getPositionY */func_149467_d()}, z: ${packet./* getPositionZ */func_149472_e()}, yaw: ${packet./* getYaw */func_149462_g()}, pitch: ${packet./* getPitch */func_149470_h()}`
        // console.log(string)
    })
}).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer)