export default new class AsmUtils {
    chat($, msg, stack = 1) {
        const variables = {
            mc: stack++,
            player: stack++,
            message: stack++
        };

        $.invokeStatic("net/minecraft/client/Minecraft", "func_71410_x", "()Lnet/minecraft/client/Minecraft;")
            .astore(variables.mc);

        $.aload(variables.mc)
             .getField("net/minecraft/client/Minecraft", "field_71439_g", "Lnet/minecraft/client/entity/EntityPlayerSP;")
             .astore(variables.player);

        $.new("net/minecraft/util/ChatComponentText")
            .dup();

        if (typeof msg === "number") {
            $.aload(msg);
        } else if (typeof msg === "string") {
            $.ldc(msg);
        }

        $.invokeSpecial("net/minecraft/util/ChatComponentText", "<init>", "(Ljava/lang/String;)V")
            .astore(variables.message);

        $.aload(variables.player)
            .aload(variables.message)
            .invokeVirtual("net/minecraft/client/entity/EntityPlayerSP", "func_145747_a", "(Lnet/minecraft/util/IChatComponent;)V");

        return stack;
    }
};
