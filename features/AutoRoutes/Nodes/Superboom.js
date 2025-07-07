import Dungeons from "../../../utils/Dungeons"
import Vector3 from "../../../utils/Vector3"
import NodeManager from "../NodeManager"
import SecretAura from "../../SecretAura"
import LivingUpdate from "../../../events/LivingUpdate"
import tpManager from "../TeleportManager"

import { Node } from "../Node"
import { chat, itemSwapSuccess, swapFromItemID, syncCurrentPlayItem } from "../../../utils/utils"

const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const BlockAir = Java.type("net.minecraft.block.BlockAir")

NodeManager.registerNode(class SuperboomNode extends Node {
    static identifier = "superboom"
    static priority = 0
    constructor(args) {
        const raytrace = Dungeons.rayTraceEtherBlock(new Vector3(Player), Player.getYaw(), Player.getPitch(), false)
        if (!raytrace) throw new Error("Superboom raytrace failed. (Are you looking at a block?)")

        super(this.constructor.identifier, args)
        this.superBoomBlock = Dungeons.convertToRelative(Dungeons.rayTraceEtherBlock(new Vector3(Player), Player.getYaw(), Player.getPitch(), false))
        this.defineTransientProperties()
    }

    _trigger(execer) {
        swapFromItemID(46, result => {
            if (result === itemSwapSuccess.FAIL) return execer.execute(this)
            const eyePosition = new Vector3(Player.getX(), Player.getY() + Player.getPlayer().func_70047_e(), Player.getZ())

            if (eyePosition.distance3D(this.realSuperBoomBlock) <= 36) {
                const javaBlockPos = this.realSuperBoomBlock.convertToBlockPos()
                const blockState = World.getWorld().func_180495_p(javaBlockPos)
                const block = blockState.func_177230_c()
                tpManager.sync(this.realYaw, this.pitch, false);
                if (!(block instanceof BlockAir)) {
                    SecretAura.rightClickBlock(block, this.realSuperBoomBlock)
                    execer.execute(this)
                } else {
                    chat("Can't superboom on a block that doesn't exist.")
                    execer.execute(this)
                }
            } else {
                chat("You are too far from the block.")
                execer.execute(this)
            }
        })
    }

    _handleRotate() {
        return
    }

    defineTransientProperties() {
        super.defineTransientProperties()
        if (!this.superBoomBlock) return
        const realBlock = Dungeons.convertFromRelative(this.superBoomBlock)
        Object.defineProperties(this, {
            realSuperBoomBlock: {
                value: realBlock,
                enumerable: false,
                writable: true,
                configurable: true
            },
        })
    }
})
