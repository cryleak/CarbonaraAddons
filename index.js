import "./features/AutoP3"
import "./features/Simulation"
import "./features/FastLeap"
import "./features/Freecam"
import "./features/SecretAura"
import "./features/Relic"
import "./features/AutoRoutes"
import "./features/Doorless"
import "./features/BonzoSimulator"
import "./features/Doors"
import "./features/4thDevSimulator"


register("packetSent", (packet, event) => {
    Client.scheduleTask(0, () => {
        if (event.isCancelled()) return
        if (!packet./* getRotating */func_149463_k() && !packet.func_149466_j()) return
        let string = ""
        string += Date.now() + " "
        string += `x: ${packet./* getPositionX */func_149464_c()}, y: ${packet./* getPositionY */func_149467_d()}, z: ${packet./* getPositionZ */func_149472_e()}, yaw: ${packet./* getYaw */func_149462_g()}, pitch: ${packet./* getPitch */func_149470_h()}`
        // console.log(string)
    })
}).setFilteredClass(net.minecraft.network.play.client.C03PacketPlayer).unregister()
