import { Event } from "./CustomEvents"
import { getDistanceToEntity } from "../utils/utils"

export default BatSpawnEvent = new Event();

register("tick", () => {
    if (!BatSpawnEvent.hasListeners()) return
    const bats = World.getAllEntitiesOfType(net.minecraft.entity.passive.EntityBat)

    for (let bat of bats) {
        if (getDistanceToEntity(bat) > 225) continue

        BatSpawnEvent.trigger(bat)
        break
    }
})
