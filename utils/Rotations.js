import OnUpdateWalkingPlayerPre from "../events/onUpdateWalkingPlayerPre"

const C03PacketPlayer = Java.type("net.minecraft.network.play.client.C03PacketPlayer")

export default new class Rotations {
    constructor() {
        this.yaw = null
        this.pitch = null
        this.postPacketSend = null
        this.noMove = false
        OnUpdateWalkingPlayerPre.register(event => {
            if (event.cancelled) return
            if (this.yaw === null || this.pitch === null) return

            const data = event.data
            const packet = data.packet

            event.cancelled = true
            let replacementPacket
            if (packet.func_149466_j() && !this.noMove) replacementPacket = new C03PacketPlayer.C06PacketPlayerPosLook(packet.func_149464_c(), packet.func_149467_d(), packet.func_149472_e(), this.yaw, this.pitch, packet.func_149465_i())
            else replacementPacket = new C03PacketPlayer.C05PacketPlayerLook(this.yaw, this.pitch, packet.func_149465_i())
            Client.sendPacket(replacementPacket)
            const postPacketSend = this.postPacketSend
            this.clearRotation()
            if (postPacketSend) postPacketSend()
        }, 0)
    }

    rotate(yaw, pitch, postPacketSend = null, noMove = false) {
        if (isNaN(yaw) || isNaN(pitch)) throw new TypeError("Nigga it needs to be a number")
        this.yaw = yaw
        this.pitch = pitch
        this.postPacketSend = postPacketSend
        this.noMode = noMove

        /*
        if (global.carbonara.autop3.missingPackets.length > 0) {
            Client.sendPacket(new C03PacketPlayer.C05PacketPlayerLook(this.yaw, this.pitch, Player.asPlayerMP().isOnGround()))
            const postPacketSend = this.postPacketSend
            this.clearRotation()
            if (postPacketSend) postPacketSend()
        }
        */
    }

    clearRotation() {
        this.yaw = null
        this.pitch = null
        this.postPacketSend = null
        this.noMove = null
    }

}
