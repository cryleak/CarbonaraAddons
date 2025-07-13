import { Event } from "../events/CustomEvents"
import { registerSubCommand } from "../utils/commands"
import { chat, getEyeHeight, scheduleTask } from "../utils/utils"
import Vector3 from "../utils/Vector3"

const ArrowLandEvent = new Event()

const EntityArrow = Java.type("net.minecraft.entity.projectile.EntityArrow")
const MathHelper = Java.type("net.minecraft.util.MathHelper")
const MCNBTTagCompound = Java.type("net.minecraft.nbt.NBTTagCompound")
const C0APacketAnimation = Java.type("net.minecraft.network.play.client.C0APacketAnimation")
const JavaMath = Java.type("java.lang.Math")
const Mouse = Java.type("org.lwjgl.input.Mouse")
const S23PacketBlockChange = Java.type("net.minecraft.network.play.server.S23PacketBlockChange")
const Blocks = Java.type("net.minecraft.init.Blocks")

let ping = 100 // make this an optino idk

registerSubCommand("setbowping", velo => {
    if (Number.isNaN(velo)) return
    ping = parseFloat(velo)
    ChatLib.chat(`Set bow ping to ${ping}`)
})

const invincibilityItems = {
    MASK: "MASK",
    PHOENIX: "PHOENIX"
}

class DeviceManager {
    constructor() {
        this.pressurePlateVector = new Vector3(63, 127, 35)
        this.currentTarget = null
        this.blocks = [
            new Vector3(64.5, 126, 50.5),
            new Vector3(66.5, 126, 50.5),
            new Vector3(68.5, 126, 50.5),
            new Vector3(64.5, 128, 50.5),
            new Vector3(66.5, 128, 50.5),
            new Vector3(68.5, 128, 50.5),
            new Vector3(64.5, 130, 50.5),
            new Vector3(66.5, 130, 50.5),
            new Vector3(68.5, 130, 50.5)
        ]
        this.remainingBlocks = []
        this.deviceActive = false
        this.startTime = Date.now()
        this.lastArrowShoot = Date.now()
        this.holdingRightClick = false
        this.startCooldown = null
        this.nextDeathTick = null
        this.invincibilityItem = null
        this.phoenixUsed = false

        register("packetSent", () => this.tryShootBow(this.lastArrowShoot)).setFilteredClass(C0APacketAnimation)

        register(net.minecraftforge.client.event.MouseEvent, (event) => {
            const button = event.button
            const state = event.buttonstate
            if (button !== 1 || !state || !Client.isTabbedIn() || Client.isInGui() || !this.isOnDevice()) return
            if (Player?.getHeldItem()?.getID() === 261) {

                cancel(event)
                this.tryShootBow(this.lastArrowShoot)
                if (this.holdingRightClick) return
                this.holdingRightClick = true
                const exec = () => {
                    if (!Mouse.isButtonDown(1)) return this.holdingRightClick = false
                    this.tryShootBow(0)
                    scheduleTask(4, exec)
                }
                scheduleTask(4, exec)
            } else if (Player?.getHeldItem()?.getID() === 346 && this.deviceActive) {
                if (!this.invincibilityItem && !this.phoenixUsed) {
                    chat("Swapped to Phoenix")
                    this.invincibilityItem = invincibilityItems.PHOENIX
                    this.phoenixUsed = true
                }
                else if (this.invincibilityItem) {
                    chat("You swapped to Phoenix too early you fucking retard")
                    this.phoenixUsed = true
                }
            }
        })



        ArrowLandEvent.register(data => {
            if (!this.currentTarget) return
            const landPosition = data.hitPosition
            if (!landPosition.equals(this.currentTarget.copy().floor3D())) return
            this.updateTargetBlock(null)
            if (!this.remainingBlocks.length) {
                chat(`Fourth device completed in ${((Date.now() - this.startTime) / 1000).toFixed(2)}`)
                World.playSound("note.pling", 1, 1)
                this.stopDevice()
            }

        })

        this.devStarter = register("tick", () => {
            if (!this.isOnDevice) this.stopDevice()
            else if (!this.deviceActive) {
                this.startCooldown = Date.now() + 3000
                this.devStarter.unregister()
            }
        })

        this.deathTickTimer = register("step", () => {
            if (this.invincibilityItem) {
                if (this.invincibilityItem === invincibilityItems.MASK) {
                    chat("Spirit procced")
                } else chat("Phoenix procced")
                this.invincibilityItem = null
                this.nextDeathTick = Date.now() + 3000
            } else {
                World.playSound("note.pling", 1, 0.5)
                chat("You didn't have an invincibility item!")
                this.stopDevice()
            }
        }).setDelay(3).unregister()

        register("tick", (ticks) => {
            if (ticks % 5 !== 0) return
            if (!this.remainingBlocks.length || this.currentTarget) return
            this.chooseNewBlock()
        })

        register("renderOverlay", () => {
            if (this.startCooldown) {
                if (!this.isOnDevice()) {
                    this.devStarter.register()
                    this.startCooldown = null
                    return
                } else if (this.startCooldown - Date.now() < 0) {
                    this.startTime = Date.now()
                    this.startCooldown = null
                    this.devStarter.register()
                    this.deathTickTimer.register()
                    this.deviceActive = true
                    this.nextDeathTick = Date.now() + 3000
                    this.invincibilityItem = invincibilityItems.MASK
                    this.phoenixUsed = false
                    this.remainingBlocks = [...this.blocks]
                    this.chooseNewBlock()
                    return
                }
                Renderer.scale(3)
                Renderer.drawString(`§4${this.startCooldown - Date.now()}`, Renderer.screen.getWidth() / 6, Renderer.screen.getHeight() / 5.4, true)
            } else if (this.nextDeathTick) {
                Renderer.scale(3)
                Renderer.drawString(`§4${this.nextDeathTick - Date.now()}`, Renderer.screen.getWidth() / 6, Renderer.screen.getHeight() / 5.4, true)
            }
        })
    }

    updateTargetBlock(block) {
        if (block) {
            const blockState = Blocks.field_150475_bE.func_176223_P()
            this.triggerBlockUpdate(block.convertToBlockPos(), blockState)
        } else if (this.currentTarget) {
            const blockState = Blocks.field_150406_ce.func_176203_a(11)
            this.triggerBlockUpdate(this.currentTarget.convertToBlockPos(), blockState)
        }
        this.currentTarget = block
    }

    triggerBlockUpdate(position, blockState) {
        World.getWorld().func_175656_a(position, blockState)
        fireChannelRead(new S23PacketBlockChange(World.getWorld(), position)) // To trigger some i4 solvers, for example Soshimee's.
    }

    chooseNewBlock() {
        const index = Math.floor(Math.random() * this.remainingBlocks.length)
        this.updateTargetBlock(this.remainingBlocks[index])
        this.remainingBlocks.splice(index, 1)
    }

    tryShootBow(lastShot) {
        if (Date.now() - lastShot < 250 || Player?.getHeldItem()?.getID() !== 261) return
        const playerVec = new Vector3(Player)
        const yaw = Player.yaw
        const pitch = Player.pitch
        scheduleTask(Math.round(ping / 50), () => {
            new FakeArrow(playerVec, yaw, pitch, -5, false)
            new FakeArrow(playerVec, yaw, pitch, 0, true)
            new FakeArrow(playerVec, yaw, pitch, 5, false)
            World.playSound("random.bow", 1, 1)
        })
        this.lastArrowShoot = Date.now()
    }

    stopDevice() {
        this.updateTargetBlock(null)
        this.nextDeathTick = null
        this.deviceActive = false
        this.remainingBlocks = []
        this.deathTickTimer.unregister()
        this.devStarter.unregister()
        Client.scheduleTask(20, () => this.devStarter.register())
    }

    isOnDevice() {
        return new Vector3(Player).floor3D().equals(this.pressurePlateVector)
    }
}
const Device = new DeviceManager()
export default Device

class FakeArrow {
    constructor(position, yaw, pitch, yawOffset, middleArrow) {
        const velocity = (middleArrow ? 2.5 + 1 - (pitch + 90) / 180 : 3)
        this.arrow = new EntityArrow(World.getWorld(), Player.getPlayer(), velocity)

        const yawRadians = JavaMath.toRadians(yaw + yawOffset)
        const pitchRadians = JavaMath.toRadians(pitch)
        this.arrow.func_70012_b(position.x, position.y + getEyeHeight() - 0.1, position.z, yaw + yawOffset, pitch)

        this.arrow.field_70159_w = -sin(yawRadians) * cos(pitchRadians)
        this.arrow.field_70181_x = -sin(pitchRadians)
        this.arrow.field_70179_y = cos(yawRadians) * cos(pitchRadians)

        this.arrow.func_70186_c(this.arrow.field_70159_w, this.arrow.field_70181_x, this.arrow.field_70179_y, velocity, 0.5)

        this.arrow.field_70251_a = 2
        this.arrow.func_70071_h_()
        const x = this.arrow.field_70165_t
        const y = this.arrow.field_70163_u
        const z = this.arrow.field_70161_v
        Client.scheduleTask(0, () => World.getWorld().func_72838_d(this.arrow))

        this.arrowLandListener = register(net.minecraftforge.fml.common.gameevent.TickEvent.ClientTickEvent, (event) => {
            if (event.phase !== net.minecraftforge.fml.common.gameevent.TickEvent.Phase.END) return
            // This is probably more performant than using Reflection to retrieve private fields
            const tagCompound = new MCNBTTagCompound()
            this.arrow.func_70014_b(tagCompound)
            const ticksInGround = tagCompound.func_74762_e("life")
            if (ticksInGround === 0) return
            const xTile = tagCompound.func_74762_e("xTile")
            const yTile = tagCompound.func_74762_e("yTile")
            const zTile = tagCompound.func_74762_e("zTile")
            const hitPosition = new Vector3(xTile, yTile, zTile)
            ArrowLandEvent.trigger({ hitPosition })
            Client.scheduleTask(0, () => this.arrowLandListener.unregister()) // The game fucking crashes if I try to unregister it immediately?
            Client.scheduleTask(1, () => World.getWorld().func_72900_e(this.arrow))
        })
    }
}

function cos(value) {
    return MathHelper.func_76134_b(value)
}

function sin(value) {
    return MathHelper.func_76126_a(value)
}

function fireChannelRead(packet) {
    Client.getConnection().func_147298_b().channel().pipeline().fireChannelRead(packet);
}