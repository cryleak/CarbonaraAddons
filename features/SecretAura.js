import RenderLibV2 from "../../RenderLibV2"
import Settings from "../config"
import { registerSubCommand } from "../utils/commands"
import fakeKeybinds from "../utils/fakeKeybinds"
import { chat } from "../utils/utils"

const MCBlockPos = Java.type("net.minecraft.util.BlockPos")
const Blocks = Java.type("net.minecraft.init.Blocks")
const System = Java.type("java.lang.System")
const Vec3 = Java.type("net.minecraft.util.Vec3")
const BlockChest = Java.type("net.minecraft.block.BlockChest")
const BlockLever = Java.type("net.minecraft.block.BlockLever")
const EnumFacing = Java.type("net.minecraft.util.EnumFacing")
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const horizontalEnumFacings = [EnumFacing.NORTH, EnumFacing.EAST, EnumFacing.SOUTH, EnumFacing.WEST]

export default new class SecretAura {
    constructor() {
        this.range = 6.2
        this.clickedBlocks = []
        this.blocksToClick = []
        this.toggled = false
        this.renderShit = []


        register(net.minecraftforge.fml.common.gameevent.TickEvent.ClientTickEvent, (event) => {
            const runStart = System.nanoTime()
            if (event.phase !== net.minecraftforge.fml.common.gameevent.TickEvent.Phase.END || !Settings().secretAuraEnabled || !World.isLoaded()) return
            const eyePosition = Player.getPlayer().func_174824_e(1)
            const boxCorner1 = new MCBlockPos(eyePosition.field_72450_a - this.range, eyePosition.field_72448_b - this.range, eyePosition.field_72449_c - this.range)
            const boxCorner2 = new MCBlockPos(eyePosition.field_72450_a + this.range, eyePosition.field_72448_b + this.range, eyePosition.field_72449_c + this.range)

            let clicked = false
            MCBlockPos.func_177980_a(boxCorner1, boxCorner2).forEach(blockPos => {
                if (clicked || eyePosition.func_72438_d(new Vec3(blockPos)) > this.range) return
                const blockState = World.getWorld().func_180495_p(blockPos)
                const block = blockState.func_177230_c()
                if (block instanceof BlockChest || block instanceof BlockLever) {
                    const position = [blockPos.func_177958_n(), blockPos.func_177956_o(), blockPos.func_177952_p()]
                    if (!this.clickedBlocks.some(block => position[0] === block[0] && position[1] === block[1] && position[2] === block[2])) {
                        if (!this.isDoubleChest(blockPos)) {
                            clicked = true
                            this.clickBlock(block, blockPos)
                        }
                        this.clickedBlocks.push(position)
                    }
                }
            })
            console.log(`Scanning took ${(System.nanoTime() - runStart) / 1000000}ms`)
        })

        register("renderWorld", () => {
            this.renderShit.forEach(thing => {
                RenderLibV2.drawEspBoxV2(thing.field_72450_a, thing.field_72448_b, thing.field_72449_c, 0.1, 0.1, 0.1, 1, 1, 1, 1, true)
            })
        })

        register("packetSent", (packet, event) => {
            let hitvec = [packet.func_149573_h(), packet.func_149569_i(), packet.func_149575_j()]
            hitvec = new Vec3(...hitvec).func_178787_e(new Vec3(packet.func_179724_a()))
            this.renderShit.push(hitvec)
        }).setFilteredClass(net.minecraft.network.play.client.C08PacketPlayerBlockPlacement)


        registerSubCommand("testsecretaura", () => {
            this.toggle(!Settings().secretAuraEnabled)
        })

        fakeKeybinds.onKeyPress("secretAuraKeybind", () => {
            this.toggle(!Settings().secretAuraEnabled)
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
        while (this.clickedBlocks.length) this.clickedBlocks.pop()
        while (this.renderShit.length) this.renderShit.pop()
    }

    clickBlock(block, blockPos, eyePosition = Player.getPlayer().func_174824_e(1)) {
        const blockPosVec3 = new Vec3(blockPos)
        block.func_180654_a(World.getWorld(), blockPos)
        const centerPosition = new Vec3((block.func_149753_y() + block.func_149704_x()) / 2, (block.func_149665_z() + block.func_149669_A()) / 2, (block.func_149706_B() + block.func_149693_C()) / 2).func_178787_e(blockPosVec3)
        const movingObjectPosition = block.func_180636_a(World.getWorld(), blockPos, eyePosition, centerPosition)
        let [mopBlockPos, entityHit, hitVec, sideHit, typeOfHit] = [movingObjectPosition.field_178783_e, movingObjectPosition.field_72308_g, movingObjectPosition.field_72307_f.func_178788_d(blockPosVec3), movingObjectPosition.field_178784_b, movingObjectPosition.field_72313_a]
        this.renderShit.push(movingObjectPosition.field_72307_f)
        ChatLib.chat(`click ${blockPosVec3.toString()} distance ${eyePosition.func_72438_d(blockPosVec3)}`)
        Client.sendPacket(new C08PacketPlayerBlockPlacement(blockPos, sideHit.func_176745_a(), Player.getHeldItem()?.getItemStack() ?? null, hitVec.field_72450_a, hitVec.field_72448_b, hitVec.field_72449_c))
        Player.getPlayer().func_71038_i()
    }
}