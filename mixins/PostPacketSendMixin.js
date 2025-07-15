import Mixin from "./Mixin";

export default Mixin(
    "net/minecraft/network/NetworkManager",
    "func_179290_a",
    "(Lnet/minecraft/network/Packet;)V",
    "PostPacketSend",
    ASM => ASM.At(ASM.At.TAIL)
)