import { playerCoords } from "./utils";

const EntityOtherPlayerMP = Java.type("net.minecraft.client.entity.EntityOtherPlayerMP");
const GLStateManager = Java.type("net.minecraft.client.renderer.GlStateManager");
const renderManager = Client.getMinecraft().func_175598_ae();

let player = null;
const gameLoad = register("gameLoad", () => {
    gameLoad.unregister();
    player = new EntityOtherPlayerMP(World.getWorld(), Player.getPlayer().func_146103_bH());
});

export function drawPlayer(position, yaw, pitch, scale, sneaking, item) {
    if (!player) {
        return;
    }

    position = position.subtract(playerCoords().camera);
    if (item) {
        player.field_71071_by.field_70462_a[0] = item;
    }

    if (sneaking === undefined) {
        sneaking = false;
    }
    player.func_70095_a(sneaking)

    player.field_70125_A = pitch;
    player.field_70127_C = pitch;
    GLStateManager.func_179094_E();

    GLStateManager.func_179109_b(position.x, position.y, position.z);
    GlStateManager.func_179139_a(scale, scale, scale);
    GLStateManager.func_179114_b(-yaw, 0, 1, 0);

    GLStateManager.func_179091_B();
    GlStateManager.func_179141_d();
    GLStateManager.func_179142_g();

    GlStateManager.func_179126_j();
    GlStateManager.func_179132_a(true);
    GlStateManager.func_179084_k();
    GlStateManager.func_179112_b(770, 771);
    GlStateManager.func_179092_a(516, 0.1);
    renderManager.func_147940_a(player, 0, 0, 0, yaw, 0);

    GLStateManager.func_179121_F();
}
