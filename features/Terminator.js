import Mixin from "../mixins/Mixin.js";

export default Mixin(
    "net.minecraft.item.ItemBow",
    "func_77659_a",
    "(Lnet/minecraft/item/ItemStack;Lnet/minecraft/world/World;Lnet/minecraft/entity/player/EntityPlayer;)Lnet/minecraft/item/ItemStack;",
    "Terminator"
);

/*
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
        let stack = 4;

        const variables = {
            objects: stack++,
            itemName: stack++
        };

        //$.iconst_3().anewarray(OBJECT).astore(variables.objects);
        //$.aload(variables.objects).iconst_0().aload(1).aastore();
        //$.aload(variables.objects).iconst_1().aload(2).aastore();
        //$.aload(variables.objects).iconst_2().aload(3).aastore();
        //$.aload(variables.objects).invokeJS("printMessage");

        $.aload(1)
            .invokeVirtual("net/minecraft/item/ItemStack", "func_82833_r", "()Ljava/lang/String;")
            .astore(variables.itemName);

        // stack = AsmUtils.chat($, variables.itemName, stack);

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
*/
