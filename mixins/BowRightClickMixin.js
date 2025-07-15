import Mixin from "./Mixin.js";

export default Mixin(
    "net.minecraft.item.ItemBow",
    "func_77659_a",
    "(Lnet/minecraft/item/ItemStack;Lnet/minecraft/world/World;Lnet/minecraft/entity/player/EntityPlayer;)Lnet/minecraft/item/ItemStack;",
    "Terminator",
    ASM => ASM.At(ASM.At.HEAD)
);
