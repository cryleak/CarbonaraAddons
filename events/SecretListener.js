import Settings from "../config"
import SecretAuraClick from "./SecretAuraClick"
import BatSpawnEvent from "./BatSpawn"

import { getDistanceToEntity, scheduleTask, debugMessage } from "../utils/utils"
import { Event } from "./CustomEvents"

const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const BlockSkull = Java.type("net.minecraft.block.BlockSkull")
export default SecretEvent = new Event();

SecretAuraClick.Post.register(data => {
    // if (!SecretEvent.hasListeners()) return
    Client.sendPacket(new C08PacketPlayerBlockPlacement(data.itemStack));

    if (Settings().secretAuraSwapOn === 1 && data.block instanceof BlockSkull || Settings().secretAuraSwapOn === 2) scheduleTask(0, () => SecretEvent.trigger())
    else SecretEvent.trigger()
});


const drops = ["item.item.monsterPlacer", "item.item.bone", "item.tile.weightedPlate_heavy", "item.item.enderPearl", "item.item.potion", "item.item.skull.char", "item.item.shears", "item.item.paper", "item.tile.tripWireSource"]

let entitiesLastTick = []

register("tick", () => { // Schizo solution for item pickup listener
    if (!SecretEvent.hasListeners()) return
    const itemEntities = World.getAllEntitiesOfType(net.minecraft.entity.item.EntityItem)

    for (let entity of entitiesLastTick) {
        if (!drops.includes(entity.getName())) continue

        if (itemEntities.some(oldEntity => oldEntity.getUUID().toString() === entity.getUUID().toString())) continue

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
