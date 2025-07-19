import RenderLibV2 from "../../RenderLibV2J"
import Mouse from "../events/Mouse"
import Vector3 from "../utils/Vector3"

import { registerSubCommand } from "../utils/commands"
import { chat, inSingleplayer, isBlockPassable, isWithinTolerence, scheduleTask, setVelocity } from "../utils/utils"

const BonzoSimulator = new class {
    constructor() {
        this.ping = 100
        this.extraDelay = 50
        this.playerPosition = new Vector3(Player)
        this.yaw = Player.yaw
        this.pitch = Player.pitch
        this.cancelInteractThisTick = false

        Mouse.register((event) => {
            if (!inSingleplayer()) return
            if (Player?.getHeldItem()?.getID() !== 369) return
            const { button, state } = event.data
            if (!state || button !== 1) return

            scheduleTask(Math.round(this.ping / 50), () => new BonzoProjectile(this.playerPosition.copy().add([0, 1, 0]), this.yaw, this.pitch))
        }, 0)

        registerSubCommand("setbonzoping", (ping) => {
            if (isNaN(ping)) return
            this.ping = parseInt(ping)
            chat(`Set Bonzo's Staff ping to ${this.ping}ms`)
        })

        registerSubCommand("setbonzoextradelay", (delay) => {
            if (isNaN(delay)) return
            this.extraDelay = parseInt(delay)
            chat(`Set Bonzo's Staff extra delay to ${this.extraDelay}ms`)
        })

        register("tick", () => {
            const position = new Vector3(Player)
            const yaw = Player.yaw
            const pitch = Player.pitch
            Client.scheduleTask(Math.round(this.ping / 50), () => {
                this.playerPosition = position
                this.yaw = yaw
                this.pitch = pitch
            })
        })
    }

    intersectsWithSolid(rayStart, rayEnd) { // Only works with vectors with a length of less than like 2 or something
        return this.intersectsWithBB(rayStart, rayStart, rayEnd) || this.intersectsWithBB(rayEnd, rayStart, rayEnd)
    }

    intersectsWithBB(blockPosition, rayStart, rayEnd) {
        const block = World.getBlockAt(Math.floor(blockPosition.x), Math.floor(blockPosition.y), Math.floor(blockPosition.z));
        if (isBlockPassable(block)) return false
        const mcBlock = block.type.mcBlock;
        const bb = mcBlock.func_180646_a(World.getWorld(), block.pos.toMCBlock());
        const previousVec = rayStart.convertToVec3()
        const currentVec = rayEnd.convertToVec3()
        const intercept = bb.func_72327_a(previousVec, currentVec)
        return intercept
    }

    /**
     * Generates particle positions in a spherical explosion pattern. (Chatgpt made this btw cause i was lazy)
     *
     * @param {Vector3} originPosition - X coordinate of explosion center
     * @param {number} particleCount - Number of particles to generate
     * @param {number} radius - Maximum radius of explosion
     * @returns {Array<{x: number, y: number, z: number}>} - Array of particle positions
     */
    generateExplosionParticles(originPosition, particleCount, radius) {
        const particles = []

        if (particleCount === 1) {
            particles.push(originPosition.copy())
        } else {
            for (let i = 0; i < particleCount; i++) {
                let theta = Math.random() * 2 * Math.PI
                let phi = Math.acos(2 * Math.random() - 1)
                let r = Math.random() * radius

                let x = originPosition.x + r * Math.sin(phi) * Math.cos(theta)
                let y = originPosition.y + r * Math.cos(phi)
                let z = originPosition.z + r * Math.sin(phi) * Math.sin(theta)

                particles.push(new Vector3(x, y, z))
            }
        }

        return particles
    }
}
export default BonzoSimulator

class BonzoProjectile {
    constructor(startPosition, yaw, pitch) {
        this.currentPosition = startPosition
        this.startPosition = startPosition.copy()
        this.velocityVector = Vector3.fromPitchYaw(pitch, yaw)
        this.exploded = false
        this.particles = []
        this.ticksInAir = 0

        this.renderer = register("renderWorld", () => {
            if (this.exploded) {
                for (let particle of this.particles) {
                    RenderLibV2.drawEspBox(particle.x, particle.y, particle.z, 0.1, 0.1, 1, 0, 0, 1, true)
                }
            } else {
                RenderLibV2.drawEspBox(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z, 1, 1, 1, 1, 1, 1, true)
            }
        })

        this.movementSimulator = register("tick", () => {
            this.onUpdate()
        }).unregister()
        Client.scheduleTask(Math.round(BonzoSimulator.extraDelay / 50), () => this.movementSimulator.register())
    }

    onUpdate() {
        this.ticksInAir++
        const previousPosition = this.currentPosition
        const nextPosition = this.currentPosition.copy().add(this.velocityVector)
        const collision = BonzoSimulator.intersectsWithSolid(previousPosition, nextPosition)
        if (collision) {
            this.currentPosition = new Vector3(collision.field_72307_f)
            this.movementSimulator.unregister()
            this.exploded = true
            this.particles = BonzoSimulator.generateExplosionParticles(this.currentPosition, 1, 2)
            scheduleTask(40, () => {
                this.renderer.unregister()
            })
            const playerVec = BonzoSimulator.playerPosition.copy()
            if (playerVec.distance3D(this.currentPosition) > 9) return // squared distance
            const motionVector = playerVec.subtract(this.currentPosition)
            const vectorLength = Math.sqrt(motionVector.x ** 2 + motionVector.z ** 2)
            motionVector.multiply(isWithinTolerence(vectorLength, 0) ? 0 : 1 / vectorLength) // Multiply by 0 if the length is 0
            const motionX = motionVector.x * 1.5
            const motionZ = motionVector.z * 1.5
            ChatLib.chat([motionX, 0.5, motionZ].toString())
            setVelocity(motionX, 0.5, motionZ)
            return
        } else {
            this.currentPosition = nextPosition
        }
    }
}
