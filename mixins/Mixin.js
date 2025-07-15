
import AsmUtils from "../utils/AsmUtils.js";

export default function Mixin(className, method, description, callbackName) {
    parameterCount = description.split(";").length - 2;
    return ASM => {
        console.log(`Injecting into ${className}.${method}`);

        const {
            OBJECT, JumpCondition
        } = ASM;

        ASM.injectBuilder(
            className,
            method,
            description,
            ASM.At(ASM.At.HEAD)
        ).instructions($ => {
            $.bipush(parameterCount + 2).anewarray(OBJECT);
            const parameters = $.astore(variables.parameters);

            $.new("java/lang/String")
                .dup()
                .ldc(callbackName)
                .invokeSpecial("java/lang/String", "<init>", "(Ljava/lang/String;)V")
                .aload(parameters)
                .swap()
                .iconst_0()
                .swap()
                .aastore();

            for (let i = 0; i <= parameterCount; i++) {
                $.aload(parameters).bipush(i+1).aload(i).aastore();
            }

            $.aload(parameters).invokeJS("mixinCallback");
        }).execute();
    };
};
