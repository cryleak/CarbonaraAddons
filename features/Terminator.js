import AsmUtils from "../utils/AsmUtils.js";

export default ASM => {
    const {
        desc, L, OBJECT, JumpCondition
    } = ASM;
    const className = "net.minecraft.item.ItemBow";

    console.log(`Injecting into ${className}...`);
    ASM.injectBuilder(
        className,
        "func_77659_a",
        "(Lnet/minecraft/item/ItemStack;Lnet/minecraft/world/World;Lnet/minecraft/entity/player/EntityPlayer;)Lnet/minecraft/item/ItemStack;",
        ASM.At(ASM.At.HEAD)
    ).instructions($ => {
        let stack = 5;

        const variables = {
            itemName: stack++
        };

        $.aload(1)
            .invokeVirtual("net/minecraft/item/ItemStack", "func_82833_r", "()Ljava/lang/String;")
            .astore(variables.itemName);

        stack = AsmUtils.chat($, variables.itemName, stack);

        variables.compareString = stack++;

        $.new("java/lang/String")
            .dup()
            .ldc("Terminator")
            .invokeSpecial("java/lang/String", "<init>", "(Ljava/lang/String;)V")
            .astore(variables.compareString);

        $.aload(variables.itemName)
            .aload(variables.compareString)
            .invokeVirtual("java/lang/String", "contains", "(Ljava/lang/CharSequence;)Z")
            .ifClause([JumpCondition.FALSE], $ => {
                //stack = AsmUtils.chat($, "Is holding terminator", stack);
                $.aload(1).areturn();
            });
    }).execute();
}
