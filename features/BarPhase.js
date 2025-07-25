import Tick from "../events/Tick";
import Vector3 from "../utils/Vector3";

const Blocks = Java.type("net.minecraft.init.Blocks");
const IronBars = Blocks.field_150411_aY;

export default new class BarPhase {
    constructor() {
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
        const properties = {}
        state.func_177228_b().forEach(property => properties[property.func_177701_a()] = state.func_177229_b(property))

        if ((properties.east || properties.west) && !properties.north && !properties.south) {
            // boundingBox.min.add(playerVec);
            // ChatLib.chat("You can phase through the bar on north south")
        }

        if ((properties.north || properties.south) && !properties.east && !properties.west) {
            // ChatLib.chat("You can phase through the bar on east west")
        }

        ChatLib.chat(JSON.stringify(properties))
        //  if ((properties.east || properties.west) && Player.)

    }

    _getBlockBounds(blockState, position) {
        return { min: new Vector3(blockState.func_149704_x(), blockState.func_149665_z(), blockState.func_149706_B()).add(position), max: new Vector3(blockState.func_149753_y(), blockState.func_149669_A(), blockState.func_149693_C()).add(position) }
    }

    _isIronBar(block) {
        return World.getWorld().func_180495_p(block.convertToBlockPos()).func_177230_c() === IronBars;
    }
}
