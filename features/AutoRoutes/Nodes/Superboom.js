import Dungeons from "../../../utils/Dungeons"
import Vector3 from "../../../utils/Vector3"
import NodeManager from "../NodeManager"
import SecretAura from "../../SecretAura"
import Tick from "../../../events/Tick"
import manager from "../NodeManager"
import tpManager from "../TeleportManager"

import { Node } from "../Node"
import { chat, itemSwapSuccess, swapFromItemID, syncCurrentPlayItem, debugMessage } from "../../../utils/utils"
import { UpdateWalkingPlayer } from "../../../events/JavaEvents"

const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const BlockAir = Java.type("net.minecraft.block.BlockAir")

NodeManager.registerNode(class SuperboomNode extends Node {
    static renderItem = new Item(46).itemStack;

    static identifier = "superboom"
    static priority = 100
    constructor(args) {
        const raytrace = Dungeons.rayTraceEtherBlock(new Vector3(Player), Player.getYaw(), Player.getPitch(), false)
        if (!raytrace) throw new Error("Superboom raytrace failed. (Are you looking at a block?)")

        super(this.constructor.identifier, args)
        this.superBoomBlock = Dungeons.convertToRelative(Dungeons.rayTraceEtherBlock(new Vector3(Player), Player.getYaw(), Player.getPitch(), false))
        this.defineTransientProperties(manager.currentRoom)
    }

    _trigger(execer) {
        swapFromItemID(46, result => {
            if (result === itemSwapSuccess.FAIL) return execer.execute(this)
            let player = tpManager.lastBlock ?? Player;
            const eyePosition = new Vector3(player.x, player.y + Player.getPlayer().func_70047_e(), player.z);

            // debugMessage(`${Player.x} ${Player.y} ${Player.z}`);
            tpManager.sync(this.realYaw, this.pitch, false);
            if (eyePosition.distance3D(this.realSuperBoomBlock) <= 36) {
                const javaBlockPos = this.realSuperBoomBlock.convertToBlockPos()
                const blockState = World.getWorld().func_180495_p(javaBlockPos)
                const block = blockState.func_177230_c()
                if (!(block instanceof BlockAir)) {
                    UpdateWalkingPlayer.Pre.scheduleTask(0, () => {
                        SecretAura.rightClickBlock(block, this.realSuperBoomBlock)
                        execer.execute(this)
                    });
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

    defineTransientProperties(room) {
        super.defineTransientProperties(room)
        if (!this.superBoomBlock) return
        Object.defineProperties(this, {
            realSuperBoomBlock: {
                value: room.type === "dungeons" ? Dungeons.convertFromRelative(this.superBoomBlock) : this.superBoomBlock,
                enumerable: false,
                writable: true,
                configurable: true
            },
        })
    }
})
