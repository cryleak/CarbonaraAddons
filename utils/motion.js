const airMotionFactor = 400
let motionEnabled = false
let airTicks = 0
let lastX = 0
let lastZ = 0

export default function onMotionUpdate(yaw) {
    if (!motionEnabled) return
    // const clickingMelody = (System.currentTimeMillis() - melodyClicked < 300)
    const clickingMelody = false

    if (Player.getPlayer().field_70122_E) airTicks = 0
    else airTicks += 1

    const speed = Player.isSneaking() ? Player.getPlayer().field_71075_bZ.func_75094_b() * 0.3 : Player.getPlayer().field_71075_bZ.func_75094_b()

    const radians = yaw * Math.PI / 180
    const x = -Math.sin(radians) * speed * 2.806
    const z = Math.cos(radians) * speed * 2.806

    if (airTicks < 2) {
        lastX = x
        lastZ = z
        if (!clickingMelody) {
            Player.getPlayer().field_70159_w = x
            Player.getPlayer().field_70179_y = z
        }
    } else {
        //assume max acceleration
        const factor = airMotionFactor / 10000
        lastX = lastX * 0.91 + factor * speed * -Math.sin(radians)
        lastZ = lastZ * 0.91 + factor * speed * Math.cos(radians)
        if (!clickingMelody) {
            Player.getPlayer().field_70159_w = lastX * 0.91 + factor * speed * -Math.sin(radians)
            Player.getPlayer().field_70179_y = lastZ * 0.91 + factor * speed * Math.cos(radians)
        }
    }
}