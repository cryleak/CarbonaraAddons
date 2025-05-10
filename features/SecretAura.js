const MCBlockPos = Java.type("net.minecraft.util.BlockPos")

export default new class SecretAura {
    constructor() {
        this.range = 6.2


        register("tick", () => {
            if (!World.isLoaded()) return
            // if (indungeunfej)
            const boxEdge1 = new MCBlockPos(Player.getX() - this.range, Player.getY() + Player.getPlayer().func_70047_e)
        })
    }

}