import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import Dungeons from "../utils/Dungeons"
import LivingUpdate from "../events/LivingUpdate"
import SecretAuraClick from "../events/SecretAuraClick"

import { chat } from "../utils/utils"
import Vector3 from "../utils/Vector3"
import RenderLib from "../../RenderLibV2J"

const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const Vec3 = Java.type("net.minecraft.util.Vec3")
const BlockChest = Java.type("net.minecraft.block.BlockChest")
const BlockLever = Java.type("net.minecraft.block.BlockLever")
const BlockSkull = Java.type("net.minecraft.block.BlockSkull")
const BlockCompressedPowered = Java.type("net.minecraft.block.BlockCompressedPowered") // Redstone block
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const SecretAuraScanner = Java.type("me.cryleak.carbonaraloader.helpers.SecretAuraScanner")
const HashSet = Java.type("java.util.HashSet")
const EnumFacing = Java.type("net.minecraft.util.EnumFacing")
const horizontalEnumFacings = [EnumFacing.NORTH, EnumFacing.EAST, EnumFacing.SOUTH, EnumFacing.WEST]
const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils").INSTANCE

export default new class SecretAura {
    constructor() {
        this.clickedBlocks = new HashSet()
        this.blocksToClick = []
        this.toggled = false
        this.clickableBlocksInRange = []
        this.threadRunning = false
        this.redstoneKeyPickedUp = false
        this.ignoreRooms = ["Water Board", "Three Weirdos"]
        this.renderShit = []

        register("tick", () => {
            if (!Settings().secretAuraEnabled || !World.isLoaded() || !Dungeons.inDungeon && Settings().secretAuraDungeonsOnly || this.ignoreRooms.includes(dungeonUtils.currentRoomName)) return

            const javaBlockPos = SecretAuraScanner.findClickableBlock(this.clickedBlocks, this.redstoneKeyPickedUp)
            if (javaBlockPos) {
                const blockPos = new Vector3(javaBlockPos)
                const blockState = World.getWorld().func_180495_p(javaBlockPos)
                const block = blockState.func_177230_c()

                if (Settings().secretAuraSwapOn === 1 && block instanceof BlockSkull || Settings().secretAuraSwapOn === 2) {
                    const heldItemIndex = Player.getHeldItemIndex()
                    let secretAuraItemIndex
                    if (!isNaN(Settings().secretAuraItem)) secretAuraItemIndex = parseInt(Settings().secretAuraItem)
                    else {
                        secretAuraItemIndex = Player.getInventory().getItems().findIndex(item => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(Settings().secretAuraItem?.toLowerCase()))
                        if (secretAuraItemIndex === -1 || secretAuraItemIndex > 7) return
                    }
                    if (!isNaN(secretAuraItemIndex)) Player.setHeldItemIndex(secretAuraItemIndex)
                    Client.scheduleTask(0, () => { // This runs next tick
                        if (Settings().secretAuraSwapBack) Player.setHeldItemIndex(heldItemIndex)
                    })
                }

                LivingUpdate.scheduleTask(0, () => { // This runs right before the next living update (same tick)
                    this.rightClickBlock(block, blockPos)
                    if (block instanceof BlockSkull) {
                        const tileEntity = World.getWorld().func_175625_s(javaBlockPos)
                        const skullId = tileEntity?.func_152108_a()?.getId()?.toString()
                        if (skullId === "fed95410-aba1-39df-9b95-1d4f361eb66e") this.redstoneKeyPickedUp = true
                    }
                })
                this.clickedBlocks.add(javaBlockPos)
            }
        })

        /*
        register("packetSent", (packet, event) => {
            let hitvec = [packet.func_149573_h(), packet.func_149569_i(), packet.func_149575_j()]
            hitvec = new Vec3(...hitvec).func_178787_e(new Vec3(packet.func_179724_a()))
            this.renderShit.push(hitvec)
        }).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)

        register("renderWorld", () => {
            this.renderShit.forEach(thing => {
                const wrappedPos = new Vector3(thing)
                RenderLib.drawEspBoxV2(wrappedPos.x, wrappedPos.y, wrappedPos.z, 0.05, 0.05, 0.05, 1, 1, 1, 1, true, 2)
            })
        })
        */

        register("worldUnload", () => {
            // while (this.renderShit.length) this.renderShit.pop()
            this.clickedBlocks.clear()
            this.redstoneKeyPickedUp = false
        })

        fakeKeybinds.onKeyPress("secretAuraToggleKeybind", () => this.toggle(!Settings().secretAuraEnabled))

        fakeKeybinds.onKeyPress("secretAuraClearBlocksKeybind", () => {
            this.clickedBlocks.clear()
            chat("Blocks cleared.")
        })
    }

    isDoubleChest(blockPos) {
        if (!(World.getWorld().func_180495_p(blockPos).func_177230_c() instanceof BlockChest)) return false
        else {
            for (let enumFacing of horizontalEnumFacings) {
                if (World.getWorld().func_180495_p(blockPos.func_177972_a(enumFacing)).func_177230_c() instanceof BlockChest) return true
            }
        }
        return false
    }

    toggle(state) {
        if (state === Settings().secretAuraEnabled) return
        Settings().getConfig().setConfigValue("Block Aura", "secretAuraEnabled", state)
        chat(`Secret aura ${state ? "enabled" : "disabled"}`)
        this.clickedBlocks.clear()
        // while (this.renderShit.length) this.renderShit.pop()
    }

    /**
     * 
     * @param {Block} block 
     * @param {Vector3} blockPos 
     * @param {*} eyePosition 
     * @returns 
     */
    rightClickBlock(block, blockPos) {
        const javaBlockPos = blockPos.convertToBlockPos()
        const mop = this.getMOPOnBlock(block, javaBlockPos)
        const itemStack = Player.getHeldItem()?.getItemStack() ?? null

        if (SecretAuraClick.Pre.trigger({ block, blockPos, itemStack }).cancelled) return


        Client.sendPacket(new C08PacketPlayerBlockPlacement(javaBlockPos, mop.sideHit.func_176745_a(), itemStack, mop.hitVec.x, mop.hitVec.y, mop.hitVec.z))
        if (!Player.isSneaking() && !(block instanceof BlockCompressedPowered || block instanceof BlockSkull)) Player.getPlayer().func_71038_i()

        SecretAuraClick.Post.trigger({ block, blockPos, itemStack })
    }

    /**
     * Perform a raytrace to the center of the block's hitbox to get a valid HitVec.
     * @param {Block} block
     * @param {MCBlockPos} blockPos 
     * @returns Object containg information about the MovingObjectPosition
     */
    getMOPOnBlock(block, blockPos) {
        const eyePosition = Player.getPlayer().func_174824_e(1)
        const adjacentBlocks = []
        if (this.isDoubleChest(blockPos)) horizontalEnumFacings.forEach(enumFacing => { // Fix double chest hitvecs
            const adjacentBlockPos = blockPos.func_177972_a(enumFacing)
            adjacentBlocks.push({ blockPos: adjacentBlockPos, blockState: World.getWorld().func_180495_p(adjacentBlockPos) })
            World.getWorld().func_175698_g(adjacentBlockPos)
        })
        const blockPosVec3 = new Vec3(blockPos)
        block.func_180654_a(World.getWorld(), blockPos)
        const centerPosition = new Vec3((block.func_149753_y() + block.func_149704_x()) / 2, (block.func_149665_z() + block.func_149669_A()) / 2, (block.func_149706_B() + block.func_149693_C()) / 2).func_178787_e(blockPosVec3)
        const movingObjectPosition = block.func_180636_a(World.getWorld(), blockPos, eyePosition, centerPosition)
        if (adjacentBlocks.length) adjacentBlocks.forEach(({ blockPos, blockState }) => World.getWorld().func_175656_a(blockPos, blockState))
        return { mopBlockPos: movingObjectPosition.field_178783_e, entityHit: movingObjectPosition.field_72308_g, hitVec: new Vector3(movingObjectPosition.field_72307_f.func_178788_d(blockPosVec3)), sideHit: movingObjectPosition.field_178784_b, typeOfHit: movingObjectPosition.field_72313_a }
    }
}
