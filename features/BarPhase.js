import Tick from "../events/Tick";
import Vector3 from "../utils/Vector3";

const Blocks = Java.type("net.minecraft.init.Blocks");
const MathHelper = Java.type("net.minecraft.util.MathHelper");
const IronBars = Blocks.field_150411_aY;

export default new class BarPhase {
    constructor() {
        ChatLib.chat("a")
        Tick.Pre.register(() => {
            this._onTick()
        })
    }

    _onTick() {
        const playerVec = new Vector3(Player).floor3D()
        const ironBarBlock = this._isIronBar(playerVec) ? playerVec : this._isIronBar(playerVec.add(0, 1, 0)) ? playerVec : null
        if (!ironBarBlock) return
        const blockState = World.getWorld().func_180495_p(ironBarBlock.convertToBlockPos());
        const block = blockState.func_177230_c();
        const state = block.func_176221_a(blockState, World.getWorld(), ironBarBlock.convertToBlockPos())
        const boundingBox = this._getBlockBounds(block, ironBarBlock)
        ChatLib.chat(JSON.stringify(boundingBox))
        const properties = {}
        state.func_177228_b().forEach(property => properties[property.func_177701_a()] = state.func_177229_b(property))
        //  if ((properties.east || properties.west) && Player.)

    }

    _getBlockBounds(blockState, position) {
        return { min: new Vector3(blockState.func_149704_x(), blockState.func_149665_z(), blockState.func_149706_B()).add(position), max: new Vector3(blockState.func_149753_y(), blockState.func_149669_A(), blockState.func_149693_C()).add(position) }
    }

    _isIronBar(block) {
        return World.getWorld().func_180495_p(block.convertToBlockPos()).func_177230_c() === IronBars;
    }
}