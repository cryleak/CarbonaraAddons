import AsmUtils from "../utils/AsmUtils.js";

export const callables = [];

export const atTarget = {
    head: ASM => ASM.At(ASM.At.HEAD),
    tail: ASM => ASM.At(ASM.At.TAIL)
};

export default function Mixin(className, method, descriptor, callbackName, target = atTarget.head) {
    const { parameters, returnType } = parseDescriptor(descriptor);
    const parameterCount = parameters.length;

    console.log(`Injecting into ${className}.${method} 1`);
    callables.push(ASM => {
        console.log(`Injecting into ${className}.${method} 2`);

        const {
            OBJECT, JumpCondition
        } = ASM;

        ASM.injectBuilder(
            className,
            method,
            descriptor,
            target(ASM)
        ).instructions($ => {
            const paramArray = $.bipush(parameterCount + 5).anewarray(OBJECT).astore().index;

            // store the callback name as the first parameter
            $.new("java/lang/String")
                .dup()
                .ldc(callbackName)
                .invokeSpecial("java/lang/String", "<init>", "(Ljava/lang/String;)V")
                .aload(paramArray)
                .swap()
                .iconst_0()
                .swap()
                .aastore();

            // store the cir as the second parameter
            const cancelled = $.new("java/util/concurrent/atomic/AtomicBoolean")
                .dup()
                .iconst_0()
                .invokeSpecial("java/util/concurrent/atomic/AtomicBoolean", "<init>", "(Z)V")
                .astore().index;

            $.aload(paramArray)
                .iconst_1()
                .aload(cancelled)
                .aastore();

            const returnValuePresent = $.new("java/util/concurrent/atomic/AtomicBoolean")
                .dup()
                .iconst_0()
                .invokeSpecial("java/util/concurrent/atomic/AtomicBoolean", "<init>", "(Z)V")
                .astore().index;

            $.aload(paramArray)
                .iconst_2()
                .aload(returnValuePresent)
                .aastore();

            const returnValue = $.new("java/util/concurrent/atomic/AtomicReference")
                .dup()
                .aconst_null()
                .invokeSpecial("java/util/concurrent/atomic/AtomicReference", "<init>", "(Ljava/lang/Object;)V")
                .astore().index;

            $.aload(paramArray)
                .iconst_3()
                .aload(returnValue)
                .aastore();

            // store this as the second parameter
            $.aload(paramArray).iconst_4().aload(0).aastore();

            // store all the parameters
            for (let i = 0; i < parameterCount; i++) {
                $.aload(paramArray).bipush(i + 5);
                loadAsObject($, i + 1, parameters[i]);
                $.aastore();
            }

            // invoke the mixin callback
            $.aload(paramArray).invokeJS("mixinCallback").pop();

            // handle the cir logic
            $.aload(cancelled).invokeVirtual("java/util/concurrent/atomic/AtomicBoolean", "get", "()Z");
            $.ifClause([JumpCondition.FALSE], $ => {
                $.aload(returnValuePresent).invokeVirtual("java/util/concurrent/atomic/AtomicBoolean", "get", "()Z");
                $.ifElseClause([JumpCondition.TRUE], $ => {
                    $.ifCode($ => {
                        $.aload(returnValue).invokeVirtual("java/util/concurrent/atomic/AtomicReference", "get", "()Ljava/lang/Object;");
                        returnFromObject($, returnType);
                        returnInsn($, returnType);
                    }).elseCode($ => {
                        zeroValueInsn($, returnType);
                        returnInsn($, returnType);
                    });
                });
            });
        }).execute();
    });
};

function parseDescriptor(descriptor) {
    // skip the first character which is always '('
    let i = 1;

    const parser = () => {
        // Skip leading '[' characters - they are for dimensions of arrays and such, I really do not care.
        let dimensions = 0;
        while (i < descriptor.length && descriptor[i] === '[') {
            dimensions++;
            i++;
        }

        const c = descriptor[i];

        switch (c) {
            case 'L':
                const end = descriptor.indexOf(";", i + 1);
                const object = descriptor.substring(i + 1, end);
                i = end + 1;
                return { type: "Object", dimensions, object };
            case 'B':
                return { type: "Byte", dimensions };
            case 'C':
                return { type: "Char", dimensions };
            case 'D':
                return { type: "Double", dimensions };
            case 'F':
                return { type: "Float", dimensions };
            case 'I':
                return { type: "Int", dimensions };
            case 'J':
                return { type: "Long", dimensions };
            case 'S':
                return { type: "Short", dimensions };
            case 'Z':
                return { type: "Boolean", dimensions };
            case 'V':
                return { type: "Void" }
            default:
                throw new Error(`Unknown type: ${c}`);
        }

        return i;
    }

    const parameters = [];
    while (descriptor[i] !== ')') {
        parameters.push(parser());
    }

    i++; // skip the closing parenthesis

    const returnType = parser();

    return {
        parameters,
        returnType
    };
}

function zeroValueInsn($, type) {
    const defaults = {
        Array: () => $.aconst_null(),
        Object: () => $.aconst_null(),
        Byte: () => $.iconst_0(),
        Char: () => $.iconst_0(),
        Double: () => $.dconst_0(),
        Float: () => $.fconst_0(),
        Int: () => $.iconst_0(),
        Long: () => $.lconst_0(),
        Short: () => $.iconst_0(),
        Boolean: () => $.iconst_0(),
        Void: () => $
    };

    if (type.dimensinos > 0) {
        return defaults.Array();
    }

    if (!defaults[type.type]) {
        throw new Error(`Unknown type: ${type.type}`);
    }

    return defaults[type.type]();
}

function returnInsn($, type) {
    const defaults = {
        Array: () => $.areturn(),
        Object: () => $.areturn(),
        Byte: () => $.ireturn(),
        Char: () => $.ireturn(),
        Double: () => $.dreturn(),
        Float: () => $.freturn(),
        Int: () => $.ireturn(),
        Long: () => $.lreturn(),
        Short: () => $.ireturn(),
        Boolean: () => $.ireturn(),
        Void: () => $.return()
    };

    if (type.dimensinos > 0) {
        return defaults.Array();
    }

    if (!defaults[type.type]) {
        throw new Error(`Unknown type: ${type.type}`);
    }

    return defaults[type.type]();
};

function loadAsObject($, local, type) {
    const defaults = {
        Array: () => $.aload(local),
        Object: () => $.aload(local),
        Byte: () => {
            return $.new("java/lang/Byte")
                .iload(local)
                .invokeSpecial("java/lang/Byte", "<init>", "(B)V")
        },
        Char: () => {
            return $.new("java/lang/Character")
                .iload(local)
                .invokeSpecial("java/lang/Character", "<init>", "(C)V")
        },
        Double: () => {
            return $.new("java/lang/Double")
                .dload(local)
                .invokeSpecial("java/lang/Double", "<init>", "(D)V")
        },
        Float: () => {
            return $.new("java/lang/Float")
                .fload(local)
                .invokeSpecial("java/lang/Float", "<init>", "(F)V")
        },
        Int: () => {
            return $.new("java/lang/Integer")
                .iload(local)
                .invokeSpecial("java/lang/Integer", "<init>", "(I)V")
        },
        Long: () => {
            return $.new("java/lang/Long")
                .lload(local)
                .invokeSpecial("java/lang/Long", "<init>", "(J)V")
        },
        Short: () => {
            return $.new("java/lang/Short")
                .iload(local)
                .invokeSpecial("java/lang/Short", "<init>", "(S)V")
        },
        Boolean: () => {
            return $.new("java/lang/Boolean")
                .iload(local)
                .invokeSpecial("java/lang/Boolean", "<init>", "(Z)V")
        },
        Void: () => $
    };

    if (type.dimensinos > 0) {
        return defaults.Array();
    }

    if (!defaults[type.type]) {
        throw new Error(`Unknown type: ${type.type}`);
    }

    return defaults[type.type]();
};

function returnFromObject($, type) {
    const defaults = {
        Byte: () => $.invokeVirtual("java/lang/Byte", "byteValue", "()B"),
        Char: () => $.invokeVirtual("java/lang/Character", "charValue", "()C"),
        Double: () => $.invokeVirtual("java/lang/Double", "doubleValue", "()D"),
        Float: () => $.invokeVirtual("java/lang/Float", "floatValue", "()F"),
        Int: () => $.invokeVirtual("java/lang/Integer", "intValue", "()I"),
        Long: () => $.invokeVirtual("java/lang/Long", "longValue", "()J"),
        Short: () => $.invokeVirtual("java/lang/Short", "shortValue", "()S"),
        Boolean: () => $.invokeVirtual("java/lang/Boolean", "booleanValue", "()Z"),
        Void: () => $
    };

    if (type.dimensions > 0) {
        throw new Error("Array return type override is not supported yet.");
    }

    if (defaults[type.type]) {
        return defaults[type.type]($);
    }

    return $.checkcast(type.object);
};
