import AsmUtils from '../utils/Asm.js';

export default ASM => {
    const {
        desc, L, ITEMSTACK, WORLD, ENTITYPLAYER,
    } = ASM;
    const className = "net.minecraft.item.ItemBow";

    ASM.injectBuilder(
        className,
        'onItemRightClick',
        desc(L(ITEMSTACK), L(ITEMSTACK), L(WORLD), L(ENTITYPLAYER)),
        ASM.At(ASM.At.HEAD)
    ).instructions($ => {
        AsmUtils.chat(ASM, $, "You right-clicked with a bow!");
    });
};
