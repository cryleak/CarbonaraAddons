import Vector3 from "./Vector3"

const RenderShit = Java.type("me.cryleak.carbonaraloader.RenderShit")
const EntityOtherPlayerMP = Java.type("net.minecraft.client.entity.EntityOtherPlayerMP")

let player = null
const playerListener = register("tick", () => {
    if (!Player.player) return
    playerListener.unregister()
    player = new EntityOtherPlayerMP(World.getWorld(), Player.player.func_146103_bH())
})

/**
 * Draws a player model at the specified position with the given parameters.
 * @param {Vector3} position 
 * @param {Number} yaw 
 * @param {Number} pitch 
 * @param {Number} scale 
 * @param {Boolean} sneaking 
 * @param {MCItemStack} item 
 * @returns 
 */
export function drawPlayer(position, yaw, pitch, scale, sneaking = false, item = null) {
    if (!player) return

    RenderShit.drawPlayer(player, position.convertToVec3(), yaw, pitch, scale, sneaking, item)
}

/**
 * Rainbow Line renderer.
 * @type {{
 *   drawRainbowLine: (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, phase: boolean, lineWidth: number, speed: number) => void,
 * }}
 */
export const RainbowLine = Java.type("me.cryleak.carbonaraloader.RainbowLine")