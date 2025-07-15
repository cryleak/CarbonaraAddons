import Mixin from "./Mixin";

Mixin(
    "net/minecraft/network/NetworkManager",
    "func_179290_a",
    "(Lnet/minecraft/network/Packet;)V",
    "PostPacketSend",
    ASM => ASM.At(ASM.At.HEAD)
)
