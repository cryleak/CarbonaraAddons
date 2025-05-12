import RenderLibV2 from "../../RenderLibV2"
import Settings from "../config"
import fakeKeybinds from "../utils/fakeKeybinds"
import Dungeons from "../utils/Dungeons"

import { registerSubCommand } from "../utils/commands"
import { chat } from "../utils/utils"
import { LivingUpdate } from "../utils/autoP3Utils"

const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const Blocks = Java.type("net.minecraft.init.Blocks")
const System = Java.type("java.lang.System")
const Vec3 = Java.type("net.minecraft.util.Vec3")
const BlockChest = Java.type("net.minecraft.block.BlockChest")
const BlockLever = Java.type("net.minecraft.block.BlockLever")
const BlockSkull = Java.type("net.minecraft.block.BlockSkull")
const BlockCompressedPowered = Java.type("net.minecraft.block.BlockCompressedPowered") // Redstone block
const EnumFacing = Java.type("net.minecraft.util.EnumFacing")
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const HashSet = Java.type("java.util.HashSet")
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
            if (this.threadRunning) return
            this.threadRunning = true
            new Thread(() => {
                const runStart = System.nanoTime()
                if (!Settings().secretAuraEnabled || !World.isLoaded() || !Dungeons.inDungeon && Settings().secretAuraDungeonsOnly) return this.threadRunning = false
                const eyePosition = Player.getPlayer().func_174824_e(1)
                const scanRange = 12.5 // Takes about 17ms to scan on my 5800X3D
                const boxCorner1 = new MCBlockPos(eyePosition.field_72450_a - scanRange, eyePosition.field_72448_b - scanRange, eyePosition.field_72449_c - scanRange)
                const boxCorner2 = new MCBlockPos(eyePosition.field_72450_a + scanRange, eyePosition.field_72448_b + scanRange, eyePosition.field_72449_c + scanRange)

                const squaredRange = scanRange ** 2

                const clickableBlocks = []
                MCBlockPos.func_177980_a(boxCorner1, boxCorner2).forEach(blockPos => {
                    if (eyePosition.func_72436_e(new Vec3(blockPos)) > squaredRange) return
                    const blockState = World.getWorld().func_180495_p(blockPos)
                    const block = blockState.func_177230_c()
                    if (block instanceof BlockChest || block instanceof BlockLever || block instanceof BlockCompressedPowered && this.redstoneKeyPickedUp) clickableBlocks.push({ blockPos, isSkull: false })
                    else if (block instanceof BlockSkull) {
                        const tileEntity = World.getWorld().func_175625_s(blockPos)
                        if (!tileEntity || !tileEntity.func_152108_a()) return
                        const skullId = tileEntity.func_152108_a().getId().toString()
                        if (skullId === "e0f3e929-869e-3dca-9504-54c666ee6f23" || skullId === "fed95410-aba1-39df-9b95-1d4f361eb66e") clickableBlocks.push({ blockPos, isSkull: true })
                    }
                })
                this.clickableBlocksInRange = clickableBlocks
                console.log(`Scanning took ${(System.nanoTime() - runStart) / 1000000}ms`)
                this.threadRunning = false
            }).start()
        })

        register("tick", () => {
            const runStart = System.nanoTime()
            ChatLib.chat(this.ignoreRooms.includes(dungeonUtils.currentRoomName))
            ChatLib.chat(dungeonUtils.currentRoomName)
            if (!Settings().secretAuraEnabled || !World.isLoaded() || !Dungeons.inDungeon && Settings().secretAuraDungeonsOnly || this.ignoreRooms.includes(dungeonUtils.currentRoomName)) return
            const eyePosition = Player.getPlayer().func_174824_e(1)
            const squaredRange = this.range ** 2
            const squaredSkullRange = this.skullRange ** 2

            let clicked = false
            this.clickableBlocksInRange?.forEach(({ blockPos, isSkull }) => {
                if (clicked || eyePosition.func_72436_e(new Vec3(blockPos)) > (isSkull ? squaredSkullRange : squaredRange)) return
                const blockState = World.getWorld().func_180495_p(blockPos)
                const block = blockState.func_177230_c()
                if (this.clickedBlocks.contains(blockPos)) return

                clicked = true
                const adjacentBlocks = []
                if (this.isDoubleChest(blockPos)) horizontalEnumFacings.forEach(enumFacing => { // Fix double chest hitvecs... This is schizo as fuck I know
                    const adjacentBlockPos = blockPos.func_177972_a(enumFacing)
                    adjacentBlocks.push({ blockPos: adjacentBlockPos, blockState: World.getWorld().func_180495_p(adjacentBlockPos) })
                    World.getWorld().func_175698_g(adjacentBlockPos)
                })

                const heldItemIndex = Player.getHeldItemIndex()
                let secretAuraItemIndex
                if (!isNaN(Settings().secretAuraItem)) secretAuraItemIndex = parseInt(Settings().secretAuraItem)
                else {
                    secretAuraItemIndex = Player.getInventory().getItems().findIndex(item => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(Settings().secretAuraItem?.toLowerCase()))
                    if (secretAuraItemIndex === -1) return
                }
                if (!isNaN(secretAuraItemIndex)) Player.setHeldItemIndex(secretAuraItemIndex)

                LivingUpdate.scheduleTask(0, () => { // This runs right before the next living update (same tick)
                    this.rightClickBlock(block, blockPos)
                    if (adjacentBlocks.length) adjacentBlocks.forEach(({ blockPos, blockState }) => World.getWorld().func_175656_a(blockPos, blockState))
                    if (block instanceof BlockSkull) {
                        const tileEntity = World.getWorld().func_175625_s(blockPos)
                        const skullId = tileEntity?.func_152108_a()?.getId()?.toString()
                        if (skullId === "fed95410-aba1-39df-9b95-1d4f361eb66e") this.redstoneKeyPickedUp = true
                    }
                })
                Client.scheduleTask(0, () => { // This runs next tick
                    if (Settings().secretAuraSwapBack) Player.setHeldItemIndex(heldItemIndex)
                })
                this.clickedBlocks.add(blockPos)
            })
            console.log(`Checking blocks took ${(System.nanoTime() - runStart) / 1000000}ms`)
        })

        register("renderWorld", () => {
            this.renderShit?.forEach(thing => RenderLibV2.drawEspBoxV2(thing.field_72450_a, thing.field_72448_b, thing.field_72449_c, 0.1, 0.1, 0.1, 1, 1, 1, 1, true))
            this.clickableBlocksInRange?.forEach(({ blockPos, isSkull }) => RenderLibV2.drawEspBoxV2(blockPos.func_177958_n() + 0.5, blockPos.func_177956_o(), blockPos.func_177952_p() + 0.5, 1, 1, 1, 1, 1, 1, 1, true))
        })

        register("packetSent", (packet, event) => {
            let hitvec = [packet.func_149573_h(), packet.func_149569_i(), packet.func_149575_j()]
            hitvec = new Vec3(...hitvec).func_178787_e(new Vec3(packet.func_179724_a()))
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
        new Thread(() => Settings().getConfig().setConfigValue("Block Aura", "secretAuraEnabled", state)).start()
        chat(`Secret aura ${state ? "enabled" : "disabled"}`)
        this.clickedBlocks.clear()
        // while (this.renderShit.length) this.renderShit.pop()
    }

    rightClickBlock(block, blockPos, eyePosition = Player.getPlayer().func_174824_e(1)) {
        const blockPosVec3 = new Vec3(blockPos)
        block.func_180654_a(World.getWorld(), blockPos)
        const centerPosition = new Vec3((block.func_149753_y() + block.func_149704_x()) / 2, (block.func_149665_z() + block.func_149669_A()) / 2, (block.func_149706_B() + block.func_149693_C()) / 2).func_178787_e(blockPosVec3)
        const movingObjectPosition = block.func_180636_a(World.getWorld(), blockPos, eyePosition, centerPosition)
        let [mopBlockPos, entityHit, hitVec, sideHit, typeOfHit] = [movingObjectPosition.field_178783_e, movingObjectPosition.field_72308_g, movingObjectPosition.field_72307_f.func_178788_d(blockPosVec3), movingObjectPosition.field_178784_b, movingObjectPosition.field_72313_a]
        Client.sendPacket(new C08PacketPlayerBlockPlacement(blockPos, sideHit.func_176745_a(), Player.getHeldItem()?.getItemStack() ?? null, hitVec.field_72450_a, hitVec.field_72448_b, hitVec.field_72449_c))
        if (!Player.isSneaking() && !(block instanceof BlockCompressedPowered || block instanceof BlockSkull)) Player.getPlayer().func_71038_i()
    }
}

/*
let pos = [0, 0, 0]

register("soundPlay", (pos, name, vol, pitch, category, event) => {
    if (name !== "random.click" || vol !== 0.30000001192092896) return
    ChatLib.chat("clicked lever")
})

register("packetSent", (packet, event) => { // This only triggers on C03's sent from a Motion Update.
    if (packet.func_149466_j()) {// If moving
        const currentPosition = { x: packet.func_149464_c(), y: packet.func_149467_d(), z: packet.func_149472_e() }
        pos[0] = currentPosition.x
        pos[1] = currentPosition.y
        pos[2] = currentPosition.z
    }
}).setFilteredClass(C03PacketPlayer)
*/