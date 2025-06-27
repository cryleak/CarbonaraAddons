
import Settings from "../config"
import Vector3 from "../../BloomCore/utils/Vector3"

import { debugMessage, chat, getDistance2DSq } from "./utils"

const renderManager = Client.getMinecraft().func_175598_ae()
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")

/**
 * Swaps to an item in your hotbar with the specified name.
 * @param {String} targetItemName - Target item name
 * @returns An array containing 2 items: the success of the swap and the slot index.
 */
export const swapFromName = (targetItemName) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(targetItemName.removeFormatting().toLowerCase()))
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find "${targetItemName}" in your hotbar`)
        return ["CANT_FIND", itemSlot]
    } else {
        return swapToSlot(itemSlot)
    }
}

/**
 * Swaps to an item in your hotbar with the specified Item ID.
 * @param {String} targetItemID - Target Item ID
 * @returns An array containing 2 items: the success of the swap and the slot index.
 */
export const swapFromItemID = (targetItemID) => {
    const itemSlot = Player.getInventory().getItems().findIndex(item => item?.getID() == targetItemID)
    if (itemSlot === -1 || itemSlot > 7) {
        chat(`Unable to find Item ID ${targetItemID} in your hotbar`)
        return ["CANT_FIND", itemSlot]
    } else {
        return swapToSlot(itemSlot)
    }
}

let lastSwap = Date.now()
const swapToSlot = (slot) => {
    if (Player.getHeldItemIndex() === slot) return ["ALREADY_HOLDING", slot]
    debugMessage(`Time since last swap is ${Date.now() - lastSwap}ms.`)
    lastSwap = Date.now()
    Player.setHeldItemIndex(slot)
    return ["SWAPPED", slot]
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

export const setWalking = (state) => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74351_w.func_151463_i(), state)

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

export const releaseMovementKeys = () => {
    WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, false))
    wrappedWASDKeys.forEach(keybind => keybind.setState(false)) // I have no clue if this does anything but keybind behavior is so fucking weird
}
export const repressMovementKeys = () => WASDKeys.forEach(keybind => KeyBinding.func_74510_a(keybind, Keyboard.isKeyDown(keybind)))


const leftClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147116_af", null)
leftClickMethod.setAccessible(true)

export const leftClick = () => leftClickMethod.invoke(Client.getMinecraft(), null)


const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
/**
 * Sends a C08 with no target block.
 * @param {Function} exec A specified function to run before the C08 is sent
 * @returns Success of the air click, false if it didn't click, true if it did
 */
export const sendAirClick = (exec) => {
    // c08 packets somehow cause illegalstateexceptions in ct modules sometimes also the playerinteract register in ct triggers whenever forge's playerinteract event triggers but for some fucking reason if i register the forge event directly it only works when i manually right click?????????
    // im using them anyways cause using right click with server rotations is a fucking awful idea
    // nevermind it only happens in singleplayer (for some reason playerinteract triggers on the server thread when you send a c08 and that gets registered by ct so shoutout)
    if (exec) exec()
    syncCurrentPlayItem() // sends c09 if you arent holding the correct item already
    Client.sendPacket(new C08PacketPlayerBlockPlacement(Player.getHeldItem()?.getItemStack() ?? null))
    return true
}

export const getEyeHeightSneaking = () => { // Peak schizo
    return 1.5399999618530273
}

export const getEyeHeight = () => {
    return Player.getPlayer().func_70047_e()
}

/**
 * Retarded way to get center of block cause I couldn't think when I made this
 * @param {Array} blockCoords 
 * @returns {Array} Centered blockCoords 
 */
export const centerCoords = (blockCoords) => {
    return [Math.floor(blockCoords[0]) + (Math.sign(blockCoords[0] === 1) ? -0.5 : 0.5), Math.floor(blockCoords[1]), Math.floor(blockCoords[2]) + (Math.sign(blockCoords[2] === 1) ? -0.5 : 0.5)]
}

const rightClickMethod = Client.getMinecraft().getClass().getDeclaredMethod("func_147121_ag", null)
rightClickMethod.setAccessible(true);
export const rightClick = () => rightClickMethod.invoke(Client.getMinecraft(), null);

const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP")

const syncCurrentPlayItemMethod = PlayerControllerMP.class.getDeclaredMethod("func_78750_j")
syncCurrentPlayItemMethod.setAccessible(true)
export const syncCurrentPlayItem = () => syncCurrentPlayItemMethod.invoke(Client.getMinecraft().field_71442_b, null)


const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")
const C0EPacketClickWindow = Java.type("net.minecraft.network.play.client.C0EPacketClickWindow")
const MathHelper = Java.type("net.minecraft.util.MathHelper")

export function jump() {
    /*
    KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), true)
    scheduleTask(1, () => KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), false))
    */
    if (!Player.getPlayer().field_70122_E) return chat("You aren't on the ground!")
    Player.getPlayer().func_70664_aZ()
}

/**
 * Checks if the coordinates is inside of a terminal phase.
 * @param {Number[]} coords 
 * @returns What terminals set a set of coordinates is in, or 0 if it isn't in any.
 */
export function getTermPhase(coords) {
    if (isCoordsWithinBox(coords, [113, 160, 48], [89, 100, 122])) return 1
    else if (isCoordsWithinBox(coords, [91, 160, 145], [19, 100, 121])) return 2
    else if (isCoordsWithinBox(coords, [-6, 160, 123], [19, 100, 50])) return 3
    else if (isCoordsWithinBox(coords, [17, 160, 27], [90, 100, 54])) return 4
    else return 0
}

function isCoordsWithinBox(coords, corner1, corner2) {
    return (coords[0] >= Math.min(corner1[0], corner2[0]) && coords[0] <= Math.max(corner1[0], corner2[0]) &&
        coords[1] >= Math.min(corner1[1], corner2[1]) && coords[1] <= Math.max(corner1[1], corner2[1]) &&
        coords[2] >= Math.min(corner1[2], corner2[2]) && coords[2] <= Math.max(corner1[2], corner2[2]))
}

export function getHeldItemID() {
    return Player?.getHeldItem()?.getNBT()?.get("tag")?.get("ExtraAttributes")?.getString("id")
}

export const termNames = [
    /^Click in order!$/,
    /^Select all the (.+?) items!$/,
    /^What starts with: '(.+?)'\?$/,
    /^Change all to same color!$/,
    /^Correct all the panes!$/,
    /^Click the button on time!$/
]

export function setVelocity(x, y, z) {
    if (typeof x === "number") Player.getPlayer().field_70159_w = x
    if (typeof y === "number") Player.getPlayer().field_70181_x = y
    if (typeof z === "number") Player.getPlayer().field_70179_y = z
}

export const findAirOpening = () => { // For use in lavaclip
    const playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())]
    for (let i = Math.floor(playerPos[1]); i > 0; i--) {
        let block1 = World.getBlockAt(playerPos[0], i, playerPos[2]).type.getID()
        let block2 = World.getBlockAt(playerPos[0], i - 1, playerPos[2]).type.getID()
        let block3 = World.getBlockAt(playerPos[0], i - 2, playerPos[2]).type.getID()
        if (block1 === 0 && block2 === 0 && block3 !== 0) return i - 1
    }
    return null
}

class Terminal {
    constructor() {
        this.inTerminal = false
        this.currentWindowName = null
        this.lastMelodyClick = Date.now()

        register("packetReceived", (packet, event) => {
            const windowName = packet.func_179840_c().func_150254_d().removeFormatting()
            if (termNames.some(regex => windowName.match(regex))) this.inTerminal = true
            else this.inTerminal = false
            this.currentWindowName = packet.func_179840_c().func_150254_d().removeFormatting()
        }).setFilteredClass(S2DPacketOpenWindow)

        register("packetReceived", () => {
            this.inTerminal = false
            this.currentWindowName = null
        }).setFilteredClass(S2EPacketCloseWindow)

        register("packetSent", () => {
            this.inTerminal = false
            this.currentWindowName = null
        }).setFilteredClass(C0DPacketCloseWindow)

        register("packetSent", () => {
            if (this.currentWindowName === "Click the button on time!") this.lastMelodyClick = Date.now()
        }).setFilteredClass(C0EPacketClickWindow)

        register("worldUnload", () => {
            this.inTerminal = false
            this.currentWindowName = null
        })
    }
}

const terminalInstance = new Terminal()
export { terminalInstance as Terminal }

export function getDistanceToEntity(entity) {
    if (entity instanceof Entity) entity = entity.getEntity()
    return Player.getPlayer().func_70032_d(entity)
}

export function setPlayerPositionNoInterpolation(x, y, z) {
    const player = Player.getPlayer()
    player.func_70107_b(x, y, z)
    player.field_70169_q = x
    player.field_70142_S = x
    player.field_70167_r = y
    player.field_70137_T = y
    player.field_70166_s = z
    player.field_70136_U = z
}

global.System = Java.type("java.lang.System")
global.loadct = ChatTriggers.loadCT // HEre cause im lazy



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
    const startHorizontalDistance = getDistance2DSq(start.x, start.z, target.x, target.z)
    const startVerticalDistance = Settings().triggerFromBelow ? Math.abs(start.y - target.y) : start.y - target.y

    const endHorizontalDistance = getDistance2DSq(end.x, end.z, target.x, target.z)
    const endVerticalDistance = Settings().triggerFromBelow ? Math.abs(end.y - target.y) : end.y - target.y
    if ((startHorizontalDistance <= horizontalTolerance && startVerticalDistance <= verticalTolerance && startVerticalDistance >= 0) || (endHorizontalDistance <= horizontalTolerance && endVerticalDistance <= verticalTolerance && endVerticalDistance >= 0)) return true

    const direction = end.subtract(start).normalize()
    const directionLength = direction.getLength()
    const normalizedDirection = direction.normalize()

    const toTarget = target.subtract(start)
    const t = toTarget.x * normalizedDirection.x + toTarget.y * normalizedDirection.y + toTarget.z * normalizedDirection.z

    if (t < 0 || t > directionLength) return false


    const closestPoint = new Vector3(start.x + t * normalizedDirection.x, start.y + t * normalizedDirection.y, start.z + t * normalizedDirection.z)
    const horizontalDistance = getDistance2DSq(closestPoint.x, closestPoint.z, target.x, target.z)
    const yDistance = Settings().triggerFromBelow ? Math.abs(closestPoint.y - target.y) : closestPoint.y - target.y
    return horizontalDistance <= horizontalTolerance && yDistance <= verticalTolerance && yDistance >= 0
}