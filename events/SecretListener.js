import SecretAuraBlockClickEventPost from "./SecretAuraBlockClick/SecretAuraBlockClickEventPost"
import BatSpawnEvent from "./BatSpawn"

import { getDistanceToEntity } from "../../BloomCore/utils/utils"
import { movementKeys } from "../utils/utils"
import { Event } from "./CustomEvents"

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
export default SecretEvent = new Event();

let moveKeyCooldown = Date.now()

// This probably shouldn't be here?
SecretAuraBlockClickEventPost.register(event => {
    //if (!SecretEvent.hasListeners()) return
    Client.sendPacket(new C08PacketPlayerBlockPlacement(event.itemStack));

    SecretEvent.trigger()
});


const drops = ["item.item.monsterPlacer", "item.item.bone", "item.tile.weightedPlate_heavy", "item.item.enderPearl", "item.item.potion", "item.item.skull.char", "item.item.shears", "item.item.paper", "item.tile.tripWireSource"]

let entitiesLastTick = []

register("tick", () => { // Schizo solution for item pickup listener
    const itemEntities = World.getAllEntitiesOfType(net.minecraft.entity.item.EntityItem)

    for (let entity of entitiesLastTick) {
        if (itemEntities.some(oldEntity => oldEntity.getUUID().toString() === entity.getUUID().toString())) continue

        if (!drops.includes(entity.getName())) continue

        if (getDistanceToEntity(entity) > 10) continue

        SecretEvent.trigger()
        break
    }
    entitiesLastTick = itemEntities
})

register(net.minecraftforge.client.event.MouseEvent, (event) => { // Trigger await secret on left click
    const button = event.button
    const state = event.buttonstate
    if (button !== 0 || !state || !Client.isTabbedIn() || Client.isInGui()) return

    if (SecretEvent.hasListeners()) {
        SecretEvent.trigger()
        cancel(event)
        // todo: implement cleartriggeredodes
    } else if (BatSpawnEvent.hasListeners()) {
        BatSpawnEvent.trigger()
        cancel(event)
    }
})

register(net.minecraftforge.fml.common.gameevent.InputEvent.KeyInputEvent, (event) => {
    if (Date.now() - moveKeyCooldown < 150) return
    if (Client.isInGui() || !World.isLoaded()) return
    if (!Keyboard.getEventKeyState()) return
    const keyCode = Keyboard.getEventKey()
    if (!keyCode) return

    if (!movementKeys.includes(keyCode)) return

    if (!SecretEvent.hasListeners()) cancel(event)
})
