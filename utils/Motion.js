import Settings from "../config"
import { setVelocity } from "../utils/utils"
import { UpdatePlayer } from "../events/JavaEvents"

const MathHelper = Java.type("net.minecraft.util.MathHelper")

export default new class Motion {
    constructor() {
        this.airTicks = 0
        this.lastX = 0
        this.lastZ = 0
        this.running = false
        this.yaw = 0
        this.isReal = false
        this.jumping = false

        register(net.minecraftforge.event.entity.living.LivingEvent$LivingJumpEvent, (event) => {
            if (event.entity !== Player.getPlayer()) return
            if (!this.running) return
            this.jumping = true
        })

        UpdatePlayer.Pre.register((data) => {
            if (data.cancelled) {
                return;
            }

            this.onMotionUpdate()
        }, 0)
    }

    onMotionUpdate() {
        if (!this.running) return

        if (Player.getPlayer().field_70122_E) {
            this.airTicks = 0;
        } else {
            this.airTicks++;
        }

        if (Player.getPlayer().func_70090_H() || Player.getPlayer().func_180799_ab()) return;

        if (Settings().goonMotion) {
            const sprintMultiplier = 1.3;
            const speed = Player.isSneaking() ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3 : Player.getPlayer().field_71075_bZ.func_75094_b()

            if (this.airTicks < 1) {
                const rad = this.yaw * Math.PI / 180;
                let speedMultiplier = 2.806;

                if (this.jumping) {
                    this.jumping = false;
                    speedMultiplier += 2;
                    speedMultiplier *= 1.25;
                }

                Player.getPlayer().field_70159_w = -Math.sin(rad) * speed * speedMultiplier;
                Player.getPlayer().field_70179_y = Math.cos(rad) * speed * speedMultiplier;
                return;
            }

            const movementFactor = (Player.getPlayer().field_70122_E || (this.airTicks === 1 && Player.getPlayer().field_70181_x < 0)) ? speed * sprintMultiplier : 0.02 * sprintMultiplier;

            const sinYaw = MathHelper.func_76126_a(this.yaw * Math.PI / 180);
            const cosYaw = MathHelper.func_76134_b(this.yaw * Math.PI / 180);

            Player.getPlayer().field_70159_w -= movementFactor * sinYaw;
            Player.getPlayer().field_70179_y += movementFactor * cosYaw;
        } else {
            const speed = Player.isSneaking() ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3 : Player.getPlayer().field_71075_bZ.func_75094_b()

            const radians = this.yaw * Math.PI / 180
            const x = -Math.sin(radians) * speed * 2.806
            const z = Math.cos(radians) * speed * 2.806

            if (this.airTicks < 2) {
                this.lastX = x
                this.lastZ = z
                setVelocity(x, null, z)
            } else {
                const factor = 0.04
                this.lastX = this.lastX * 0.91 + factor * speed * -Math.sin(radians)
                this.lastZ = this.lastZ * 0.91 + factor * speed * Math.cos(radians)
                setVelocity(this.lastX * 0.91 + factor * speed * -Math.sin(radians), null, this.lastZ * 0.91 + factor * speed * Math.cos(radians))
            }
        }
    }
}
