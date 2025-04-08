
import Settings from "../config"
import { debugMessage, chat, scheduleTask } from "./utils"

const renderManager = Client.getMinecraft().func_175598_ae()
const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding")
const File = Java.type("java.io.File")

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
 * @param {exec} exec A specified function to run before the C08 is sent
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

export const findAirOpening = () => { // For use in pearlclip
    const playerPos = [Math.floor(Player.getX()), Math.floor(Player.getY()), Math.floor(Player.getZ())]
    for (let i = Math.floor(playerPos[1]); i > 0; i--) {
        let block1 = World.getBlockAt(playerPos[0], i, playerPos[2]).type.getID()
        let block2 = World.getBlockAt(playerPos[0], i - 1, playerPos[2]).type.getID()
        let block3 = World.getBlockAt(playerPos[0], i - 2, playerPos[2]).type.getID()
        if (block1 === 0 && block2 === 0 && block3 !== 0) return i - 1
    }
    return null
}

const PlayerControllerMP = Java.type("net.minecraft.client.multiplayer.PlayerControllerMP")

const syncCurrentPlayItemMethod = PlayerControllerMP.class.getDeclaredMethod("func_78750_j")
syncCurrentPlayItemMethod.setAccessible(true)
export const syncCurrentPlayItem = () => syncCurrentPlayItemMethod.invoke(Client.getMinecraft().field_71442_b, null)


const airMotionFactor = 400
let airTicks = 0
let lastX = 0
let lastZ = 0

export function onMotionUpdate(yaw) {
    // const clickingMelody = (System.currentTimeMillis() - melodyClicked < 300)
    const clickingMelody = false

    if (Player.getPlayer().field_70122_E) airTicks = 0
    else airTicks += 1

    const speed = Player.isSneaking() ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3 : Player.getPlayer().field_71075_bZ.func_75094_b()

    const radians = yaw * Math.PI / 180
    const x = -Math.sin(radians) * speed * 2.806
    const z = Math.cos(radians) * speed * 2.806

    if (airTicks < 2) {
        lastX = x
        lastZ = z
        if (!clickingMelody) {
            Player.getPlayer().field_70159_w = x
            Player.getPlayer().field_70179_y = z
        }
    } else {
        //assume max acceleration
        const factor = airMotionFactor / 10000
        lastX = lastX * 0.91 + factor * speed * -Math.sin(radians)
        lastZ = lastZ * 0.91 + factor * speed * Math.cos(radians)
        if (!clickingMelody) {
            Player.getPlayer().field_70159_w = lastX * 0.91 + factor * speed * -Math.sin(radians)
            Player.getPlayer().field_70179_y = lastZ * 0.91 + factor * speed * Math.cos(radians)
        }
    }
}

export function hclip(direction) {
    const clip = () => {
        releaseMovementKeys()
        Player.getPlayer().field_70159_w = 0
        Player.getPlayer().field_70179_y = 0
        livingUpdate.scheduleExec(1, () => {
            const speed = Player.getPlayer().field_71075_bZ.func_75094_b() * 2.806
            const radians = direction * Math.PI / 180
            Player.getPlayer().field_70159_w = -Math.sin(radians) * speed
            Player.getPlayer().field_70179_y = Math.cos(radians) * speed
        })
        livingUpdate.scheduleExec(2, repressMovementKeys)
    }

    if (Player.getPlayer().field_70122_E === "adhjskh") {
        jump()
        Client.scheduleTask(1, hclip)
    } else {
        clip()
    }
}

export function jump() {
    KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), true)
    scheduleTask(1, () => {
        KeyBinding.func_74510_a(Client.getMinecraft().field_71474_y.field_74314_A.func_151463_i(), false)
    })
}

const listeners = []
const scheduledTasks = []
export const livingUpdate = {
    addListener: func => listeners.push(func),
    scheduleExec: (ticks, func) => scheduledTasks.push({ ticks, func })

}

export function onLivingUpdate() {
    for (let i = 0; i < listeners.length; i++) {
        listeners[i]()
    }

    for (let i = scheduledTasks.length - 1; i >= 0; i--) {
        let task = scheduledTasks[i]
        if (task.ticks === 0) {
            task.func()
            scheduledTasks.splice(i, 1)
        }
        task.ticks--
    }
}

register(net.minecraftforge.event.entity.living.LivingEvent.LivingUpdateEvent, (event) => {
    if (event.entity !== Player.getPlayer()) return
    onLivingUpdate()
})

let blinkRoutes = {}

register("step", () => {
    updateBlinkRoutes()
}).setFps(1)

export const getBlinkRoutes = () => blinkRoutes

export function updateBlinkRoutes() {
    const routes = {}
    new File("./config/ChatTriggers/modules/CarbonaraAddons/blinkroutes")?.list()?.forEach(file => {
        routes[file] = parseBlinkFile(file)
    })
    if (!routes) return
    blinkRoutes = routes
}

export function packetGetXYZ(packet) {
    return [packet.func_149464_c(), packet.func_149467_d(), packet.func_149472_e()]
}

export function parseBlinkFile(fileName) {
    try {
        const packets = FileLib.read("CarbonaraAddons/BlinkRoutes", fileName).split("\n").map(str => str.split(", "))
        packets.shift() // First line is always empty and I cba to make a better solution
        return packets
    } catch (e) {
        return null
    }
}