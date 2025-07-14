export default new class {
    chat(asm, $, str) {
        const { desc, OBJECT, L } = asm;
        $.invokeStatic("com/chattriggers/ctjs/minecraft/libs/ChatLib", "chat", desc('V', OBJECT |> L), $ => {
            $.ldc("Hello, world!").wrap(OBJECT);
        });
    }
}
