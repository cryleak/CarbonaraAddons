import "./features/AutoP3"
import "./features/Simulation"
import "./features/FastLeap"
import "./features/ConfigConverter"
import "./features/Freecam"
import "./features/SecretAura"
import "./features/Relic"

// i was testing stuff for no reason
/*
import { C03PacketPlayer, S08PacketPlayerPosLook } from "../BloomCore/utils/Utils"


const ChannelDuplexHandler = Java.type("io.netty.channel.ChannelDuplexHandler")

let connection
if (Client.getConnection()) connection = Client.getConnection().func_147298_b().channel().pipeline()
register(net.minecraftforge.fml.common.network.FMLNetworkEvent.ClientConnectedToServerEvent, (event) => {
    connection = event.manager.channel().pipeline()
    console.log(connection.names())
    connection.addBefore("packet_handler", "carbonara_packet_handler_serverbound", new JavaAdapter(ChannelDuplexHandler, {
        write: function (ctx, msg, promise) {
            ctx.write(msg, promise);
            serverBoundListeners.forEach(listener => listener(msg))
        }
    }))
    connection.addBefore("packet_handler", "carbonara_packet_handler_clientbound", new JavaAdapter(ChannelDuplexHandler, {
        channelRead: function (ctx, msg) {
            ChatLib.chat("yo")
            ctx.fireChannelRead(msg);
            clientBoundListeners.forEach(listener => listener(msg))
            ChatLib.chat(msg.class.getSimpleName())
        }
    }))
    console.log(connection.names())
})

register("gameUnload", () => {
    if (!connection) return
    connection.remove("carbonara_packet_handler_serverbound")
    connection.remove("carbonara_packet_handler_clientbound")
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
    */