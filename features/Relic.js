import Settings from "../config"
import FastLeap from "./FastLeap"
import LeapHelper from "../utils/leapUtils"
import SecretAura from "./SecretAura"
import Blink from "./AutoP3/Blink"
import LivingUpdate from "../events/LivingUpdate"

import { getDistanceToEntity, releaseMovementKeys, setVelocity } from "../utils/utils"
import { onChatPacket } from "../../BloomCore/utils/Events"
import { getDistanceToCoord } from "../../BloomCore/utils/Utils"
import Vector3 from "../utils/Vector3"

const ArmorStand = Java.type("net.minecraft.entity.item.EntityArmorStand")
const Vec3 = Java.type("net.minecraft.util.Vec3")

export default new class Relic {
    constructor() {
        this.cauldrons = {
            "Green": new Vector3(49, 7, 44),
            "Red": new Vector3(51, 7, 42),
            "Purple": new Vector3(54, 7, 41),
            "Orange": new Vector3(57, 7, 42),
            "Blue": new Vector3(59, 7, 44)
        }
        this.pickedUpRelic = null

        this.relicPickupAura = register("renderWorld", () => {
            const armorStands = World.getAllEntitiesOfType(ArmorStand)
            let entity = armorStands.find(e => new EntityLivingBase(e?.getEntity()).getItemInSlot(4)?.getNBT()?.toString()?.includes("Relic") && getDistanceToEntity(e) < 20.25)
            if (!entity) return
            entity = entity.getEntity()
            this.relicPickupAura.unregister()
            const objectMouseOver = Client.getMinecraft().field_71476_x.field_72307_f
            const dx = objectMouseOver.xCoord - entity.field_70165_t
            const dy = objectMouseOver.yCoord - entity.field_70163_u
            const dz = objectMouseOver.zCoord - entity.field_70161_v
            const packet = new net.minecraft.network.play.client.C02PacketUseEntity(entity, new Vec3(dx, dy, dz))
            Client.sendPacket(packet)
            const helmetName = ChatLib.removeFormatting(new Item(entity.func_82169_q(3)).getName())
            const relicColorPickedUp = Object.keys(this.cauldrons).find(relicName => helmetName.includes(relicName))
            if (relicColorPickedUp) this.pickedUpRelic = this.cauldrons[relicColorPickedUp]


            if (Settings().blinkRelics && getDistanceToCoord(90.075, 6, 55.700) < 1.4) {
                Blink.executeBlink("Orange", true)
                setVelocity(0, null, 0)
                releaseMovementKeys()
                return
            }

            const player = FastLeap.getPlayerToLeapTo(true)
            if (player === null) return
            if (!player || !player.length) return
            const clickDelay = parseInt(Settings().autoLeapOnRelicDelay)
            if (isNaN(clickDelay) || clickDelay === 0) LeapHelper.clickInLeapMenu(player)
            else setTimeout(() => LeapHelper.clickInLeapMenu(player), clickDelay)
        }).unregister()

        this.relicPlaceAura = register("tick", () => {
            if (!this.pickedUpRelic) return
            const eyePosition = Player.getPlayer().func_174824_e(1)
            const blockPos = this.pickedUpRelic
            const javaBlockPos = blockPos.convertToBlockPos()
            if (eyePosition.func_72438_d(new Vec3(javaBlockPos)) > 6) return
            const blockState = World.getWorld().func_180495_p(javaBlockPos)
            const block = blockState.func_177230_c()
            Player.setHeldItemIndex(8)
            LivingUpdate.scheduleTask(0, () => SecretAura.rightClickBlock(block, blockPos))
            this.relicPlaceAura.unregister()
        }).unregister()

        register("worldUnload", () => {
            this.pickedUpRelic = null
            this.relicPickupAura.unregister()
            this.relicPlaceAura.unregister()
        })

        onChatPacket((name, relicColorPickedUp) => {
            if (name !== Player.getName()) return
            this.pickedUpRelic = this.cauldrons[relicColorPickedUp]
        }).setCriteria(/^(\w{3,16}) picked the Corrupted (\w{3,6}) Relic!$/)

        onChatPacket(() => {
            if (Settings().relicPickupAura) this.relicPickupAura.register()
            if (Settings().relicPlaceAura) this.relicPlaceAura.register()
            this.pickedUpRelic = null
        }).setCriteria("[BOSS] Necron: All this, for nothing...")
    }

}