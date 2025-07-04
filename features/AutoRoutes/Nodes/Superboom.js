import Dungeons from "../../../utils/Dungeons"
import Vector3 from "../../../utils/Vector3"
import { Node } from "../Node"
import NodeManager from "../NodeManager"
import SecretAura from "../../SecretAura"
import { chat, itemSwapSuccess, swapFromItemID } from "../../../utils/utils"

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
        const result = swapFromItemID(46)
        if (result === itemSwapSuccess.FAIL) return execer.execute(this)
        const eyePosition = new Vector3(Player.getX(), Player.getY() + Player.getPlayer().func_70047_e(), Player.getZ())
        if (eyePosition.distance3D(this.realSuperBoomBlock) <= 36) {
            const javaBlockPos = this.realSuperBoomBlock.convertToBlockPos()
            const blockState = World.getWorld().func_180495_p(javaBlockPos)
            const block = blockState.func_177230_c()
            if (!(block instanceof BlockAir)) {
                SecretAura.rightClickBlock(block, this.realSuperBoomBlock)
            } else chat("Can't superboom on a block that doesn't exist.")
        } else chat("You are too far from the block.")
        execer.execute(this)
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
