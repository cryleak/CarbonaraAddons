import RenderLibV2 from "../../RenderLibV2J"
import { getEyeHeight, isBlockPassable, isWithinTolerence, scheduleTask, setVelocity } from "../utils/utils"
import Vector3 from "../utils/Vector3"

const MouseEvent = Java.type("net.minecraftforge.client.event.MouseEvent")

const BonzoSimulator = new class {
    constructor() {
        this.ping = 100
        this.playerPosition = new Vector3(Player)
        this.yaw = Player.yaw
        this.pitch = Player.pitch
        this.cancelInteractThisTick = false

        register(MouseEvent, (event) => {
            if (Server.getIP() !== "localhost" && Server.getIP() !== "127.0.0.1" && Server.getIP() !== "127.0.0.1:25564") return
            if (Player?.getHeldItem()?.getID() !== 369) return
            const button = event.button
            const state = event.buttonstate
            if (!state || button !== 1) return

            scheduleTask(Math.round(this.ping / 50), () => new BonzoProjectile(this.playerPosition.copy().add([0, getEyeHeight(), 0]), this.yaw, this.pitch))
        })

        register("command", (ping) => {
            if (!ping) return
            const delay = parseInt(ping)
            if (!delay) return
            this.ping = delay
        }).setName("setping")

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

    inBB(vector3) {
        const block = World.getBlockAt(Math.floor(vector3.x), Math.floor(vector3.y), Math.floor(vector3.z));
        if (isBlockPassable(block)) return false
        const mcBlock = block.type.mcBlock;
        const bb = mcBlock.func_180646_a(World.getWorld(), block.pos.toMCBlock());
        const vec = vector3.convertToVec3()
        return bb.func_72318_a(vec);
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

        this.renderer = register("renderWorld", () => {
            if (this.exploded) {
                for (let particle of this.particles) {
                    RenderLibV2.drawEspBox(particle.x, particle.y, particle.z, 0.1, 0.1, 1, 0, 0, 1, true)
                }
            } else {
                RenderLibV2.drawEspBox(this.currentPosition.x, this.currentPosition.y, this.currentPosition.z, 0.5, 0.5, 1, 1, 1, 1, true)
            }
        })

        this.movementSimulator = register("tick", () => {
            this.currentPosition.add(this.velocityVector)

            if (BonzoSimulator.inBB(this.currentPosition)) {
                this.movementSimulator.unregister()
                this.exploded = true
                this.particles = BonzoSimulator.generateExplosionParticles(this.currentPosition, 50, 2)
                scheduleTask(30, () => {
                    this.renderer.unregister()
                })
                const playerVec = BonzoSimulator.playerPosition.copy()
                if (playerVec.distance3D(this.currentPosition) > 12.25) return // squared distance
                const motionVector = playerVec.subtract(this.currentPosition)
                const vectorLength = Math.sqrt(motionVector.x ** 2 + motionVector.z ** 2)
                motionVector.multiply(isWithinTolerence(vectorLength, 0) ? 0 : 1 / vectorLength) // Multiply by 0 if the length is 0
                const motionX = motionVector.x * 1.5
                const motionZ = motionVector.z * 1.5
                setVelocity(motionX, 0.5, motionZ)
            }
        }).unregister()
        scheduleTask(0, () => this.movementSimulator.register())
    }
}