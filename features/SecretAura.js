import RenderLibV2 from "../../RenderLibV2"
import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import Dungeons from "../utils/Dungeons"

import { registerSubCommand } from "../utils/commands"
import { chat } from "../utils/utils"
import { LivingUpdate } from "../utils/autoP3Utils"

const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const System = Java.type("java.lang.System")
const Vec3 = Java.type("net.minecraft.util.Vec3")
const BlockChest = Java.type("net.minecraft.block.BlockChest")
const BlockLever = Java.type("net.minecraft.block.BlockLever")
const BlockSkull = Java.type("net.minecraft.block.BlockSkull")
const BlockCompressedPowered = Java.type("net.minecraft.block.BlockCompressedPowered") // Redstone block
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const SecretAuraScanner = Java.type("me.cryleak.SecretAura")
const HashSet = Java.type("java.util.HashSet")
const EnumFacing = Java.type("net.minecraft.util.EnumFacing")
const horizontalEnumFacings = [EnumFacing.NORTH, EnumFacing.EAST, EnumFacing.SOUTH, EnumFacing.WEST]
const dungeonUtils = Java.type("me.odinmain.utils.skyblock.dungeon.DungeonUtils").INSTANCE

export default new class SecretAura {
    constructor() {
        this.range = 6.0
        this.skullRange = 4.5
        this.clickedBlocks = new HashSet()
        this.blocksToClick = []
        this.toggled = false
        // this.renderShit = []
        this.clickableBlocksInRange = []
        this.threadRunning = false
        this.redstoneKeyPickedUp = false
        this.ignoreRooms = ["Water Board", "Three Weirdos"]

        register("tick", () => {
            const runStart = System.nanoTime()
            if (!Settings().secretAuraEnabled || !World.isLoaded() || !Dungeons.inDungeon && Settings().secretAuraDungeonsOnly || this.ignoreRooms.includes(dungeonUtils.currentRoomName)) return

            const blockPos = SecretAuraScanner.findClickableBlock(this.clickedBlocks, this.redstoneKeyPickedUp)
            if (blockPos) {
                const blockState = World.getWorld()./* getBlockState */func_180495_p(blockPos)
                const block = blockState./* getBlock */func_177230_c()

                const heldItemIndex = Player.getHeldItemIndex()
                let secretAuraItemIndex
                if (!isNaN(Settings().secretAuraItem)) secretAuraItemIndex = parseInt(Settings().secretAuraItem)
                else {
                    secretAuraItemIndex = Player.getInventory().getItems().findIndex(item => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(Settings().secretAuraItem?.toLowerCase()))
                    if (secretAuraItemIndex === -1 || secretAuraItemIndex > 7) return
                }
                if (!isNaN(secretAuraItemIndex)) Player.setHeldItemIndex(secretAuraItemIndex)

                LivingUpdate.scheduleTask(0, () => { // This runs right before the next living update (same tick)
                    this.rightClickBlock(block, blockPos)
                    if (block instanceof BlockSkull) {
                        const tileEntity = World.getWorld()./* getTileEntity */func_175625_s(blockPos)
                        const skullId = tileEntity?./* getPlayerProfile */func_152108_a()?.getId()?.toString()
                        if (skullId === "fed95410-aba1-39df-9b95-1d4f361eb66e") this.redstoneKeyPickedUp = true
                    }
                })
                Client.scheduleTask(0, () => { // This runs next tick
                    if (Settings().secretAuraSwapBack) Player.setHeldItemIndex(heldItemIndex)
                })
                this.clickedBlocks.add(blockPos)
            }
            console.log(`Checking blocks took ${(System.nanoTime() - runStart) / 1000000}ms`)
        })

        register("packetSent", (packet, event) => {
            let hitvec = [packet./* getPlacedBlockOffsetX */func_149573_h(), packet./* getPlacedBlockOffsetY */func_149569_i(), packet./* getPlacedBlockOffsetZ */func_149575_j()]
            hitvec = new Vec3(...hitvec)./* add */func_178787_e(new Vec3(packet./* getPosition */func_179724_a()))
            // this.renderShit.push(hitvec)
            // const blockpos = new Vec3(packet.func_179724_a())
            // const distance = blockpos.func_72438_d(new Vec3(pos[0], pos[1] + Player.getPlayer().func_70047_e(), pos[2]))
            // ChatLib.chat(`click ${new Vec3(packet.func_179724_a()).toString()} distance ${distance}`)
        }).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)

        register("worldUnload", () => {
            // while (this.renderShit.length) this.renderShit.pop()
            this.clickedBlocks.clear()
            this.redstoneKeyPickedUp = false
        })


        registerSubCommand("testsecretaura", () => this.toggle(!Settings().secretAuraEnabled))

        fakeKeybinds.onKeyPress("secretAuraToggleKeybind", () => this.toggle(!Settings().secretAuraEnabled))

        fakeKeybinds.onKeyPress("secretAuraClearBlocksKeybind", () => {
            this.clickedBlocks.clear()
            chat("Blocks cleared.")
        })
    }

    isDoubleChest(blockPos) {
        if (!(World.getWorld()./* getBlockState */func_180495_p(blockPos)./* getBlock */func_177230_c() instanceof BlockChest)) return false
        else {
            for (let enumFacing of horizontalEnumFacings) {
                if (World.getWorld()./* getBlockState */func_180495_p(blockPos./* offset */func_177972_a(enumFacing))./* getBlock */func_177230_c() instanceof BlockChest) return true
            }
        }
        return false
    }

    toggle(state) {
        if (state === Settings().secretAuraEnabled) return
        new Thread(() => Settings().getConfig().setConfigValue("Block Aura", "secretAuraEnabled", state)).start()
        chat(`Secret aura ${state ? "enabled" : "disabled"}`)
        this.clickedBlocks.clear()
        // while (this.renderShit.length) this.renderShit.pop()
    }

    rightClickBlock(block, blockPos, eyePosition = Player.getPlayer()./* getPositionEyes */func_174824_e(1)) {
        const adjacentBlocks = []
        if (this.isDoubleChest(blockPos)) horizontalEnumFacings.forEach(enumFacing => { // Fix double chest hitvecs... This is schizo as fuck I know
            const adjacentBlockPos = blockPos./* offset */func_177972_a(enumFacing)
            adjacentBlocks.push({ blockPos: adjacentBlockPos, blockState: World.getWorld()./* getBlockState */func_180495_p(adjacentBlockPos) })
            World.getWorld()./* setBlockToAir */func_175698_g(adjacentBlockPos)
        })
        const blockPosVec3 = new Vec3(blockPos)
        block./* setBlockBoundsBasedOnState */func_180654_a(World.getWorld(), blockPos)
        const centerPosition = new Vec3((block./* getBlockBoundsMaxX */func_149753_y() + block./* getBlockBoundsMinX */func_149704_x()) / 2, (block./* getBlockBoundsMinY */func_149665_z() + block./* getBlockBoundsMaxY */func_149669_A()) / 2, (block./* getBlockBoundsMinZ */func_149706_B() + block./* getBlockBoundsMaxZ */func_149693_C()) / 2)./* add */func_178787_e(blockPosVec3)
        const movingObjectPosition = block./* collisionRayTrace */func_180636_a(World.getWorld(), blockPos, eyePosition, centerPosition)
        let [mopBlockPos, entityHit, hitVec, sideHit, typeOfHit] = [movingObjectPosition./* blockPos */field_178783_e, movingObjectPosition./* entityHit */field_72308_g, movingObjectPosition./* hitVec */field_72307_f./* subtract */func_178788_d(blockPosVec3), movingObjectPosition./* sideHit */field_178784_b, movingObjectPosition./* typeOfHit */field_72313_a]
        Client.sendPacket(new C08PacketPlayerBlockPlacement(blockPos, sideHit./* getIndex */func_176745_a(), Player.getHeldItem()?.getItemStack() ?? null, hitVec./* xCoord */field_72450_a, hitVec./* yCoord */field_72448_b, hitVec./* zCoord */field_72449_c))
        if (!Player.isSneaking() && !(block instanceof BlockCompressedPowered || block instanceof BlockSkull)) Player.getPlayer()./* swingItem */func_71038_i()
        if (adjacentBlocks.length) adjacentBlocks.forEach(({ blockPos, blockState }) => World.getWorld()./* setBlockState */func_175656_a(blockPos, blockState))
    }
}