
import "./BowRightClickMixin.js";
import "./PostPacketSendMixin.js"
import { callables } from "./Mixin.js";


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

    callables.forEach(callable => callable(ASM));
};

