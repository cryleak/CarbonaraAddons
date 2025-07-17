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

            event.cancelled = true
            let replacementPacket
            if (data.isMoving && !this.noMove) replacementPacket = new C03PacketPlayer.C06PacketPlayerPosLook(data.x, data.y, data.z, this.yaw, this.pitch, data.onGround)
            else replacementPacket = new C03PacketPlayer.C05PacketPlayerLook(this.yaw, this.pitch, data.onGround)
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
