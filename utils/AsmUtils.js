export default new class AsmUtils {
    chat($, msg) {
        const mc = $.invokeStatic("net/minecraft/client/Minecraft", "func_71410_x", "()Lnet/minecraft/client/Minecraft;")
            .astore().index;

        const player = $.aload(mc)
             .getField("net/minecraft/client/Minecraft", "field_71439_g", "Lnet/minecraft/client/entity/EntityPlayerSP;")
             .astore().index;

        $.new("net/minecraft/util/ChatComponentText")
            .dup();

        if (typeof msg === "number") {
            $.aload(msg);
        } else if (typeof msg === "string") {
            $.ldc(msg);
        }

        const message = $.invokeSpecial("net/minecraft/util/ChatComponentText", "<init>", "(Ljava/lang/String;)V")
            .astore().index;

        $.aload(player)
            .aload(message)
            .invokeVirtual("net/minecraft/client/entity/EntityPlayerSP", "func_145747_a", "(Lnet/minecraft/util/IChatComponent;)V");
    }
};
