import BowRightClickMixin from "./BowRightClickMixin.js"
import PostPacketSendMixin from "./PostPacketSendMixin.js";
import AsmUtils from "../utils/AsmUtils.js";

const callables = [BowRightClickMixin, PostPacketSendMixin]

export default ASM => {
    const {
        OBJECT, JumpCondition
    } = ASM;

    /*
    ASM.injectBuilder(
        "com/chattriggers/ctjs/engine/langs/js/JSLoader",
        "asmInvokeLookup",
        "(Lcom/chattriggers/ctjs/engine/module/Module;Ljava/net/URI;)Ljava/lang/invoke/MethodHandle;",
        ASM.At(ASM.At.HEAD)
    ).instructions($ => {
        const split = $.aload(3)
            .invokeVirtual("java/net/URI", "toString", "()Ljava/lang/String;")
            .ldc(":")
            .invokeVirtual("java/lang/String", "split", "(Ljava/lang/String;)[Ljava/lang/String;")
            .astore().index;

        $.aload(split)
            .iconst_0()
            .aaload();

        $.ldc("carbonaraaddons");
        $.ifClause([JumpCondition.NEQ], $ => {
            $.aload(1)
                .invokeVirtual("com/chattriggers/ctjs/engine/module/Module", "getName", "()Ljava/lang/String;");
            const scriptable = $.aload(2)
                .invokeVirtual("com/chattriggers/ctjs/engine/langs/js/JSLoader$CTRequire", "loadCTModule", "(Ljava/lang/String;Ljava/net/URI;)Lorg/mozilla/javascript/Scriptable;")
                .astore().index;

            $.aload(scriptable);
            $.aload(split)
                .iconst_1()
                .aaload();

            $.invokeStatic("org/mozilla/javascript/ScriptableObject", "getProperty", "(Lorg/mozilla/javascript/Scriptable;Ljava/lang/String;)Ljava/lang/Object;");

            const fn = $.checkCast("org/mozilla/javascript/Callable")
                .astore().index;

            $.invokeStatic("com/chattriggers/ctjs/engine/langs/js/JSLoader", "access$getINVOKE_JS_CALL$p", "()Ljava/lang/invoke/MethodHandle;");
            $.aload(fn);
            $.invokeVirtual("java/lang/invoke/MethodHandle", "bindTo", "(Ljava/lang/Object;)Ljava/lang/invoke/MethodHandle");
            $.areturn();
        });
    }).execute();
    */

    /*
    ASM.injectBuilder(
        "net/minecraft/network/NetworkManager",
        "func_179290_a",
        "(Lnet/minecraft/network/Packet;)Vs",
        ASM.At(ASM.At.HEAD)
    ).instructions($ => {
        console.log("Packet send head!");
        //AsmUtils.chat($, "Packet send head!");
    }).execute();

    ASM.injectBuilder(
        "net/minecraft/network/NetworkManager",
        "func_179290_a",
        "(Lnet/minecraft/network/Packet;)V",
        ASM.At(ASM.At.TAIL)
    ).instructions($ => {
        console.log("Packet send tail!");
        //AsmUtils.chat($, "Packet send tail!");
    }).execute();
    */

    console.log(`Length of callables: ${callables.length}`);
    for (let callable of callables) {
        callable(ASM);
    }
};

