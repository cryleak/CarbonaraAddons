import Tick from "../events/Tick"
import { Event } from "../events/CustomEvents"
import { registerSubCommand } from "../utils/commands"
import { chat, fireChannelRead, getEyeHeight, inSingleplayer, playSound, scheduleTask } from "../utils/utils"
import Vector3 from "../utils/Vector3"
import RenderLibV2 from "../../RenderLibV2"

const ArrowLandEvent = new Event()

const MathHelper = Java.type("net.minecraft.util.MathHelper")
const MCNBTTagCompound = Java.type("net.minecraft.nbt.NBTTagCompound")
const C0APacketAnimation = Java.type("net.minecraft.network.play.client.C0APacketAnimation")
const JavaMath = Java.type("java.lang.Math")
const Mouse = Java.type("org.lwjgl.input.Mouse")
const S23PacketBlockChange = Java.type("net.minecraft.network.play.server.S23PacketBlockChange")
const Blocks = Java.type("net.minecraft.init.Blocks")
const CustomArrow = Java.type("me.cryleak.CustomArrow") // Class that extends EntityArrow but doesn't do anything when onUpdate() is called, so we have complete control over when the arrow is updated.
const C08PacketPlayerBlockPlacement = Java.type("net.minecraft.network.play.client.C08PacketPlayerBlockPlacement")
const SecureRandom = Java.type("java.security.SecureRandom");

const OdinSolver = Java.type("me.odinclient.features.impl.floor7.p3.ArrowsDevice$7");
function ResetOdinSolver() {
    try {
        const field = OdinSolver.class.getField("INSTANCE");
        field.setAccessible(true);
        const value = field.get(OdinSolver);
        value.invoke();
    } catch (e) { }
}

let ping = 100 // make this an optino idk
const updateTimer = 10 // how often to check whether we should send a new emerald block or not

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
        ];
        this.solution = []
        this.deviceActive = false
        this.startTime = Date.now()
        this.lastArrowShoot = Date.now()
        this.holdingRightClick = false
        this.startCooldown = null
        this.nextDeathTick = null
        this.invincibilityItem = null
        this.phoenixUsed = false
        this.landed = []
        this.remainingBlocks = [...this.blocks].sort(() => random() - 0.5)
        this.tickCounter = 0

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
                    this.invincibilityItem = invincibilityItems.PHOENIX
                }
            }
        })

        register("packetSent", (packet) => {
            if (packet.func_149568_f() !== 255 || !this.isOnDevice()) return
            this.tryShootBow(this.lastArrowShoot)
        }).setFilteredClass(C08PacketPlayerBlockPlacement)

        /*
        register("renderWorld", () => {
            this.remainingBlocks?.forEach(block => {
                RenderLibV2.drawEspBox(block.x, block.y, block.z, 1, 1, 1, 1, 1, 1, true)
            })
        })
        */

        ArrowLandEvent.register(data => {
            if (!this.deviceActive) {
                return;
            }
            const landPosition = data.hitPosition;
            this.landed.push(landPosition);
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
                    new Thread(() => {
                        playSound("random.eat", 0.8999999761581421, 0.5873016119003296)
                        playSound("mob.zombie.remedy", 1, 2)
                        Thread.sleep(1000)
                        playSound("random.eat", 0.8999999761581421, 0.6984127163887024)
                        Thread.sleep(1000)
                        playSound("random.eat", 0.8999999761581421, 0.7936508059501648)
                    }).start()
                } else {
                    chat("Phoenix procced")
                    playSound("random.fizz", 1, 1.4920635223388672)
                    playSound("mob.zombie.infect", 1, 1.1904761791229248)
                    playSound("mob.ghast.affectionate_scream", 1, 1.4126983880996704)
                }
                this.invincibilityItem = null
                this.nextDeathTick = Date.now() + 3000
            } else {
                World.playSound("note.pling", 1, 0.5)
                chat("You didn't have an invincibility item!")
                this.stopDevice()
            }
        }).setDelay(3).unregister()

        register("tick", () => {
            if (!this.deviceActive || !this.remainingBlocks.length) return;
            let unsend;
            while (this.remainingBlocks.length && this.landed.some(landed => landed.equals(this.remainingBlocks[0].copy().floor3D()))) {
                let curr = this.remainingBlocks.shift();
                if (!unsend) {
                    unsend = curr;
                }
            }

            if (unsend) {
                Client.scheduleTask(Math.round(ping / 50), () => {
                    const blockState = Blocks.field_150406_ce.func_176203_a(11);
                    this.triggerBlockUpdate(unsend.convertToBlockPos(), blockState);
                    this.noBlock = true;
                    if (!this.deviceActive) {
                        ResetOdinSolver()
                    }
                });
            }

            if (this.tickCounter++ % updateTimer && this.noBlock) {
                this.noBlock = false;
                const block = this.remainingBlocks[0];
                Tick.Pre.scheduleTask(Math.round(ping / 50), () => {
                    if (!this.deviceActive) {
                        return;
                    }

                    const blockState = Blocks.field_150475_bE.func_176223_P();
                    this.triggerBlockUpdate(block.convertToBlockPos(), blockState);
                });
            }

            this.landed = [];

            if (!this.remainingBlocks.length) {
                chat(`Fourth device completed in ${((Date.now() - this.startTime) / 1000).toFixed(2)}`)
                World.playSound("note.pling", 1, 1)
                this.stopDevice()
            }
        })

        register("renderOverlay", () => {
            const timer = (time) => (time / 1000).toFixed(2);
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
                    this.remainingBlocks = [...this.blocks].sort(() => random() - 0.5);
                    const blockState = Blocks.field_150475_bE.func_176223_P()
                    this.triggerBlockUpdate(this.remainingBlocks[0].convertToBlockPos(), blockState)
                    return
                }
                Renderer.scale(3)
                Renderer.drawString(`§a${timer(this.startCooldown - Date.now())}`, Renderer.screen.getWidth() / 6, Renderer.screen.getHeight() / 5.4, true)
            } else if (this.nextDeathTick) {
                Renderer.scale(3)
                Renderer.drawString(`§c${timer(this.nextDeathTick - Date.now())}`, Renderer.screen.getWidth() / 6, Renderer.screen.getHeight() / 5.4, true)
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

    tryShootBow(lastShot) {
        if (Date.now() - lastShot < 250) return
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
        if (this.remainingBlocks.length > 0) {
            const blockState2 = Blocks.field_150406_ce.func_176203_a(11)
            this.triggerBlockUpdate(this.remainingBlocks[0].convertToBlockPos(), blockState2)
        }
        this.nextDeathTick = null
        this.deviceActive = false
        this.deathTickTimer.unregister()
        this.devStarter.unregister()
        this.landed = []
        this.remainingBlocks = [...this.blocks].sort(() => random() - 0.5)
        ResetOdinSolver()
        Client.scheduleTask(20, () => this.devStarter.register())
    }

    isOnDevice() {
        if (!inSingleplayer()) return false
        return new Vector3(Player).floor3D().equals(this.pressurePlateVector)
    }
}
const Device = new DeviceManager()
export default Device

class FakeArrow {
    constructor(position, yaw, pitch, yawOffset, middleArrow) {
        const velocity = (middleArrow ? 2.5 + 1 - (pitch + 90) / 180 : 3)
        this.arrow = new CustomArrow(World.getWorld(), Player.getPlayer(), velocity)

        const yawRadians = JavaMath.toRadians(yaw + yawOffset)
        const pitchRadians = JavaMath.toRadians(pitch)
        this.arrow.func_70012_b(position.x, position.y + getEyeHeight() - 0.1, position.z, yaw + yawOffset, pitch)

        this.arrow.field_70159_w = -sin(yawRadians) * cos(pitchRadians)
        this.arrow.field_70181_x = -sin(pitchRadians)
        this.arrow.field_70179_y = cos(yawRadians) * cos(pitchRadians)

        this.arrow.func_70186_c(this.arrow.field_70159_w, this.arrow.field_70181_x, this.arrow.field_70179_y, velocity, 0.5)

        this.arrow.field_70251_a = 2
        const x = this.arrow.field_70165_t
        const y = this.arrow.field_70163_u
        const z = this.arrow.field_70161_v
        Client.scheduleTask(0, () => World.getWorld().func_72838_d(this.arrow))
        this.eventListener = Tick.Post // Change this if you want to change what event you want this shit to trigger on

        this.arrowLandListener = this.eventListener.register(() => this.updateArrow())
    }

    updateArrow() {
        this.arrow.performArrowTick()
        // This is probably more performant than using Reflection to retrieve private fields
        const tagCompound = new MCNBTTagCompound()
        this.arrow.func_70014_b(tagCompound)
        const ticksInGround = tagCompound.func_74762_e("life")
        if (ticksInGround === 0) return
        const xTile = tagCompound.func_74762_e("xTile")
        const yTile = tagCompound.func_74762_e("yTile")
        const zTile = tagCompound.func_74762_e("zTile")
        const hitPosition = new Vector3(xTile, yTile, zTile)
        /*
        const ticksInAirField = this.arrow.class.getDeclaredField("field_70257_an")
        ticksInAirField.setAccessible(true)
        const ticksInAir = ticksInAirField.get(this.arrow)
        for (let block of Device.blocks) {
            if (hitPosition.equals(block.copy().floor3D())) ChatLib.chat(`Arrow hit ${hitPosition.toString()} in ${ticksInAir} ticks`)
        }
        */
        ArrowLandEvent.trigger({ hitPosition })
        // this.arrowLandListener.unregister()
        this.eventListener.scheduleTask(0, () => this.arrowLandListener.unregister())
        Client.scheduleTask(1, () => World.getWorld().func_72900_e(this.arrow))
    }
}

function cos(value) {
    return MathHelper.func_76134_b(value)
}

function sin(value) {
    return MathHelper.func_76126_a(value)
}

function random() {
    return new SecureRandom().nextDouble()
}