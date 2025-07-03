package me.cryleak;

import com.mojang.authlib.GameProfile;
import net.minecraft.block.*;
import net.minecraft.block.state.IBlockState;
import net.minecraft.client.Minecraft;
import net.minecraft.client.entity.EntityPlayerSP;
import net.minecraft.tileentity.TileEntity;
import net.minecraft.tileentity.TileEntitySkull;
import net.minecraft.util.BlockPos;
import net.minecraft.util.Vec3;

import java.util.HashSet;

public class SecretAura {
    public static BlockPos findClickableBlock(HashSet<BlockPos> clickedBlocks, boolean redstoneKeyPickedUp) {
        Minecraft mc = Minecraft.getMinecraft();
        EntityPlayerSP player = mc.thePlayer;
        Vec3 eyePosition = player.getPositionEyes(1f);
        double scanRange = 6.0;
        BlockPos boxCorner1 = new BlockPos(eyePosition.xCoord - scanRange, eyePosition.yCoord - scanRange, eyePosition.zCoord - scanRange);
        BlockPos boxCorner2 = new BlockPos(eyePosition.xCoord + scanRange, eyePosition.yCoord + scanRange, eyePosition.zCoord + scanRange);
        Iterable<BlockPos> blocks = BlockPos.getAllInBox(boxCorner1, boxCorner2);

        for (BlockPos currentBlock : blocks) {
            if (clickedBlocks.contains(currentBlock)) continue;
            if (eyePosition.squareDistanceTo(new Vec3(currentBlock)) > 36) continue;
            IBlockState blockState = mc.theWorld.getBlockState(currentBlock);
            Block block = blockState.getBlock();

            if (block instanceof BlockLever || block instanceof BlockChest || block instanceof BlockCompressedPowered && redstoneKeyPickedUp)
                return currentBlock;
            else if (block instanceof BlockSkull) {
                if (eyePosition.squareDistanceTo(new Vec3(currentBlock)) > 20.25) continue;
                TileEntity tileEntity = mc.theWorld.getTileEntity(currentBlock);
                if (!(tileEntity instanceof TileEntitySkull)) continue;
                GameProfile profile = ((TileEntitySkull) tileEntity).getPlayerProfile();
                if (profile == null) continue;
                String skullId = profile.getId().toString();
                if (skullId.equals("e0f3e929-869e-3dca-9504-54c666ee6f23") || skullId.equals("fed95410-aba1-39df-9b95-1d4f361eb66e"))
                    return currentBlock;
            }
        }
        return null;
    }
}