import Settings from "../config"
import Vector3 from "./Vector3"
import Tick from "../events/Tick"
import LivingUpdate from "../events/LivingUpdate"

const renderManager = Client.getMinecraft().func_175598_ae()
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")


const defaultColor = "§f"

const colors = ["§4", "§c", "§6", "§e", "§2", "§a", "§b", "§3", "§1", "§9", "§d", "§5", "§f", "§7", "§8", "§0"]
/**
 * Prints in chat a message with a prefix
 * @param {String} message 
 */
export function chat(message) {
    if (!Settings().randomColors) ChatLib.chat("§0[§4Carbonara§0] " + defaultColor + message.toString().replaceAll(/(?:&r|§r)/gi, defaultColor))
    else {
        let string = ChatLib.removeFormatting(`[Carbonara] ${message.toString()}`)
        for (let i = string.length - 1; i >= 0; i--) {
            let color = colors[Math.floor(Math.random() * colors.length)]
            string = string.substring(0, i) + color + string.substring(i)
        }
        ChatLib.chat(string)
    }
}

/*
register("chat", event => {
    if (!Settings().randomColors) return
    cancel(event)
    let message = ChatLib.getChatMessage(event, false).toString()
    for (let i = message.length - 1; i >= 0; i--) {
        let color = colors[Math.floor(Math.random() * colors.length)]
        message = message.substring(0, i) + color + message.substring(i)
    }
    ChatLib.chat(message)
})
*/

/**
 * Prints in chat a debug message if debug messages are enabled.
 * @param {String} message 
 */
export function debugMessage(message) {
    // if (!Settings().debugMessages) return
    return
    ChatLib.chat("§0[§4CarbonaraDebug§0] " + defaultColor + message.toString().replaceAll("&r", defaultColor))
}

const mcTessellator = Java.type("net.minecraft.client.renderer.Tessellator")
const tessellatorInstance = mcTessellator.func_178181_a()
const worldRenderer = tessellatorInstance.func_178180_c()

/**
 * Renders a box made out of squares.
 * @param {Array} pos 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Array} colors An array of any number of arrays which consist each of 3 floats containing color values from 0-1
 */
export function renderBox(pos, width, height, colors) {
    for (let i = 0; i < colors.length; i++) {
        let yOffset = i * (1 / (colors.length - 1))
        renderSquare(pos[0], pos[1] + yOffset * height + 0.01, pos[2], width, colors[i], 3, false)
    }
}

import RenderLibV2 from "../../RenderLibV2J"

/**
 * Draws a box that looks like a scandinavian flag with specified colors.
 * @param {Array} pos 
 * @param {Number} width 
 * @param {Number} height 
 * @param {Array} color1 An array of 3 floats containing color values from 0-1
 * @param {Array} color2 An array of 3 floats containing color values from 0-1
 */
export function renderScandinavianFlag(pos, width, height, color1, color2) {
    RenderLibV2.drawInnerEspBoxV2(...pos, width, height, width, ...color1, 0.5, false)
    RenderLibV2.drawLine(pos[0] + width / 6, pos[1], pos[2], pos[0] + width / 6, pos[1] + height, pos[2], ...color2, 1, false, 10)
    RenderLibV2.drawLine(pos[0] + width / 2, pos[1] + height / 2, pos[2], pos[0] - width / 2, pos[1] + height / 2, pos[2], ...color2, 1, false, 10)
}


/**
 * Renders a square with the specified properties
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @param {Number} width Width of the square
 * @param {Array} color An array of 3 floats containing color values from 0-1
 * @param {Number} thickness Thickness of the lines
 * @param {Boolean} phase Whether to phase through blocks or not
 */
function renderSquare(x, y, z, width, color, thickness, phase = true) {
    GlStateManager.func_179140_f() // disableLighting
    GlStateManager.func_179147_l() // enableBlend
    GlStateManager.func_179112_b(770, 771) // blendFunc
    GL11.glLineWidth(thickness)

    if (phase) GlStateManager.func_179097_i() // disableDepth

    GlStateManager.func_179090_x() // disableTexture2D

    GlStateManager.func_179094_E() // pushMatrix

    GlStateManager.func_179137_b(-renderManager.field_78730_l, -renderManager.field_78731_m, -renderManager.field_78728_n) // translate

    worldRenderer.func_181668_a(3, net.minecraft.client.renderer.vertex.DefaultVertexFormats.field_181705_e) // begin

    GlStateManager.func_179131_c(color[0], color[1], color[2], 1) // color

    const halfWidth = width
    worldRenderer.func_181662_b(x + halfWidth, y, z + halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x + halfWidth, y, z - halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x - halfWidth, y, z - halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x - halfWidth, y, z + halfWidth).func_181675_d()
    worldRenderer.func_181662_b(x + halfWidth, y, z + halfWidth).func_181675_d()

    tessellatorInstance.func_78381_a() // draw

    GlStateManager.func_179121_F() // popMatrix

    GlStateManager.func_179098_w() // enableTexture2D
    GlStateManager.func_179126_j() // enableDepth
    GlStateManager.func_179084_k() // disableBlend
}

// This actually fucking works btw it lets you make nested scheduleTasks
const codeToExec = []
/**
 * Schedules a task to run in the specified number of ticks. This variant of scheduleTask lets you nest scheduleTasks inside of eachother. Note that it won't work if you trigger it inside a Client.scheduleTask.
 * @param {Number} delay Delay in ticks
 * @param {Function} task Code to execute
 */
export function scheduleTask(delay, task) {
    Client.scheduleTask(delay, () => codeToExec.push(task))
}

Tick.register(() => {
    swappedThisTick = false
    while (codeToExec.length) codeToExec.shift()()
}, 13482384929348)

export const getDistance2DSq = (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2

export const getDistance3DSq = (x1, y1, z1, x2, y2, z2) => (x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2

export function getYawBetweenPoints(from, to) {
    const MathHelper = Java.type("net.minecraft.util.MathHelper");
    const MathJava = Java.type("java.lang.Math");

    let yaw = -90.0 - MathJava.toDegrees(MathJava.atan2(-(to.z - from.z), to.x - from.x));
    return yaw;
}

/**
 * Clamps the yaw to between -180 and 180.
 * @param {Number} yaw 
 * @returns {Number} clampedYaw
 */
export function clampYaw(yaw) {
    return (yaw % 360 + 360) % 360
}

/**
 * Checks if a straight line between a start and end vector intersects with an object of specified size, height and position.
 * @author ChatGPT
 * @param {Vector3} start 
 * @param {Vector3} end 
 * @param {Vector3} target 
 * @param {Number} horizontalTolerance 
 * @param {Number} verticalTolerance 
 * @returns {Boolean} Whether it intersected or not
 */
export function checkIntersection(start, end, target, horizontalTolerance, verticalTolerance) {
    horizontalTolerance *= horizontalTolerance

    const isPointInBounds = (point) => {
        const intersectedHorizontally = getDistance2DSq(point.x, point.z, target.x, target.z) <= horizontalTolerance
        const verticalDist = Settings().triggerFromBelow ? Math.abs(point.y - target.y) : point.y - target.y
        let intersectedVertically = verticalDist <= verticalTolerance && verticalDist >= 0
        if (!intersectedVertically) {
            const minY = Settings().triggerFromBelow ? Math.min(start.y, end.y) : start.y
            const maxY = Settings().triggerFromBelow ? Math.max(start.y, end.y) : end.y
            if (target.y >= minY && target.y <= maxY) intersectedVertically = true
        }
        return intersectedHorizontally && intersectedVertically
    }

    if (isPointInBounds(start) || isPointInBounds(end)) return true

    const direction = end.subtract(start).normalize()
    const dotProduct = target.subtract(start).dotProduct(direction)

    if (dotProduct < 0 || dotProduct > direction.getLength()) return false

    const closestPoint = new Vector3(start.x + dotProduct * direction.x, start.y + dotProduct * direction.y, start.z + dotProduct * direction.z)

    return isPointInBounds(closestPoint)
}

export function setPlayerPosition(x, y, z) {
    Player.getPlayer().func_70107_b(x, y, z)
}

export function removeCameraInterpolation() {
    const { x, y, z } = Player
    const player = Player.getPlayer()
    player.field_70169_q = x
    player.field_70142_S = x
    player.field_70167_r = y
    player.field_70137_T = y
    player.field_70166_s = z
    player.field_70136_U = z
}

export function getDistanceToEntity(entity) {
    if (entity instanceof Entity) entity = entity.getEntity()
    return Player.getPlayer().func_70032_d(entity)
}

export const findAirOpening = () => {
    const playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())]
    for (let i = Math.floor(playerPos[1]); i > 0; i--) {
        let block1 = World.getBlockAt(playerPos[0], i, playerPos[2]).type.getID()
        let block2 = World.getBlockAt(playerPos[0], i - 1, playerPos[2]).type.getID()
        let block3 = World.getBlockAt(playerPos[0], i - 2, playerPos[2]).type.getID()
        if (block1 === 0 && block2 === 0 && block3 !== 0) return i - 1
    }
    return null
}

export function setVelocity(x, y, z) {
    if (typeof x === "number") Player.getPlayer().field_70159_w = x
    if (typeof y === "number") Player.getPlayer().field_70181_x = y
    if (typeof z === "number") Player.getPlayer().field_70179_y = z
}

const leftClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af", null)
leftClickMethod.setAccessible(true)
export const leftClick = () => leftClickMethod.invoke(Client.getMinecraft(), null)

const rightClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147121_ag", null)
rightClickMethod.setAccessible(true);
export const rightClick = () => rightClickMethod.invoke(Client.getMinecraft(), null);

const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP")

const syncCurrentPlayItemMethod = PlayerControllerMP.class.getDeclaredMethod("func_78750_j")
syncCurrentPlayItemMethod.setAccessible(true)
export const syncCurrentPlayItem = () => syncCurrentPlayItemMethod.invoke(Client.getMinecraft().field_71442_b, null)

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
/**
 * Sends a C08 with no target block.
 */
export const sendAirClick = () => {
    // syncCurrentPlayItem() // sends c09 if you arent holding the correct item already
    Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack() ?? null))
}

export const getEyeHeightSneaking = () => { // Peak schizo
    return 1.5399999618530273
}

export const getEyeHeight = () => {
    return Player.getPlayer().func_70047_e()
}

export const releaseMovementKeys = () => {
    WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, false))
    wrappedWASDKeys.forEach(keybind => keybind.setState(false)) // I have no clue if this does anything but keybind behavior is so fucking weird
}

export const WASDKeys = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i()
]

export const wrappedWASDKeys = [
    new KeyBind(Client.getMinecraft().field_71474_y.field_74351_w),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74370_x),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74366_z),
    new KeyBind(Client.getMinecraft().field_71474_y.field_74368_y)
]

export const movementKeys = [
    Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74370_x.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74366_z.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74368_y.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(),
    Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i()
]
export const repressMovementKeys = () => WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, Keyboard.isKeyDown(keybind)))

export const sneakKey = Client.getMinecraft().field_71474_y.field_74311_E.func_151463_i()
const sneakKeybind = new KeyBind(Client.getMinecraft().field_71474_y.field_74311_E)

let desiredState = false
export const getDesiredSneakState = () => {
    return desiredState
}

export const setSneaking = (state) => {
    desiredState = state
    sneakKeybind.setState(state)
    KeyBinding.func_74510_a(sneakKey, state)
}

register("worldUnload", () => desiredState = false)

export const setWalking = (state) => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), state)

/**
 * Calculates yaw and pitch of a specified block from the player position
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @param {Number} sneaking - Whether to calculate based off the fact that you are sneaking or not, otherwise it uses eye height
 * @returns The yaw and pitch to aim at the specified coordinates.
 */
export const calcYawPitch = (x, y, z, sneaking = false) => {
    let d = {
        x: x - Player.getX(),
        y: y - (Player.getY() + (sneaking ? getEyeHeightSneaking() : getEyeHeight())),
        z: z - Player.getZ()
    }
    let yaw = 0
    let pitch = 0
    if (d.x != 0) {
        if (d.x < 0) { yaw = 1.5 * Math.PI; } else { yaw = 0.5 * Math.PI; }
        yaw = yaw - Math.atan(d.z / d.x)
    } else if (d.z < 0) { yaw = Math.PI }
    d.xz = Math.sqrt(Math.pow(d.x, 2) + Math.pow(d.z, 2))
    pitch = -Math.atan(d.y / d.xz)
    yaw = -yaw * 180 / Math.PI
    pitch = pitch * 180 / Math.PI
    if (pitch < -90 || pitch > 90 || isNaN(yaw) || isNaN(pitch) || yaw == null || pitch == null || yaw == undefined || pitch == null) return;

    return { yaw, pitch }

}

/**
 * Gets the player coordinates
 * @returns An object containing the current coordinates of the Player and the camera
 */
export const playerCoords = () => {
    return {
        camera: [renderManager.field_78730_l, renderManager.field_78731_m, renderManager.field_78728_n],
        player: [Player.getX(), Player.getY(), Player.getZ()]
    }
}

/**
 * Rotates the camera clientside to a specified yaw and pitch. Will also update serverside rotation on the next tick if nothing else is affecting it.
 * @param {Number} origYaw - Yaw 
 * @param {Number} origPitch - Pitch
 * @returns 
 */
export function rotate(origYaw, origPitch) {
    const player = Player.getPlayer()

    const yaw = parseFloat(origYaw)
    const pitch = parseFloat(origPitch)
    if (!yaw && yaw !== 0 || !pitch && pitch !== 0) return chat("Invalid rotation!")
    player.field_70177_z = parseFloat(yaw)
    player.field_70125_A = parseFloat(pitch)
}


let swappedThisTick = false

export const itemSwapSuccess = {
    FAIL: "CANT_FIND",
    SUCCESS: "SWAPPED",
    ALREADY_HOLDING: "ALREADY_HOLDING"
}

/**
 * Swaps to an item in your hotbar with the specified name.
 * @param {String} targetItemName - Target item name
 * @returns {String} Success of item swap
 */
export const swapFromName = (targetItemName, callback) => {
    const items = Player.getInventory().getItems()
    let itemSlot = null
    for (let i = 0; i < 8; i++) {
        let item = items[i]
        if (!item) {
            continue
        }
        if (item?.getName()?.removeFormatting()?.toLowerCase()?.includes(targetItemName.removeFormatting().toLowerCase())) {
            itemSlot = i
            break
        }
    }
    if (itemSlot === null) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        if (callback) callback(itemSwapSuccess.FAIL)
        return itemSwapSuccess.FAIL
    } else {
        return swapToSlot(itemSlot, callback)
    }
}

/**
 * Swaps to an item in your hotbar with the specified Item ID.
 * @param {String} targetItemID - Target Item ID
 * @returns {String} Success of item swap
 */
export const swapFromItemID = (targetItemID, callback) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getID() == targetItemID)
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find Item ID ${targetItemID} in your hotbar`)
        if (callback) callback(itemSwapSuccess.FAIL)
        return itemSwapSuccess.FAIL
    } else {
        return swapToSlot(itemSlot, callback)
    }
}

let lastSwap = Date.now()
export const swapToSlot = (slot, callback) => {
    if (Player.getHeldItemIndex() === slot) {
        if (callback) callback(itemSwapSuccess.ALREADY_HOLDING)
        return itemSwapSuccess.ALREADY_HOLDING
    }

    if (swappedThisTick) {
        const done = LivingUpdate.register(() => {
            done.unregister()
            swapToSlot(slot, callback)
            debugMessage(`Awaiting before swap`)
        }, -1000)
    }
    else {
        Player.setHeldItemIndex(slot)
        swappedThisTick = true
        debugMessage(`Time since last swap is ${Date.now() - lastSwap}ms.`)
        lastSwap = Date.now()
        if (callback) {
            callback(itemSwapSuccess.SUCCESS)
        }
    }
    return itemSwapSuccess.SUCCESS
}

export function getHeldItemID() {
    return Player?.getHeldItem()?.getNBT()?.get("tag")?.get("ExtraAttributes")?.getString("id")
}

export const isWithinTolerence = (n1, n2) => Math.abs(n1 - n2) < 1e-4;

export function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

global.System = Java.type("java.lang.System")
global.loadct = ChatTriggers.loadCT // HEre cause im lazy
