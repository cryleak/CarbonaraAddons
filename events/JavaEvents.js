const events = Java.type("me.cryleak.carbonaraloader.event.Events");

register("gameUnload", () => {
    events.unregisterAll();
});

/**
 * An event that is triggered when a player right-clicks with a bow item.
 * @const
 * @type {import('./CustomEvents').EventInstance<Packet>}
 */
export const PostPacketSend = events.PostPacketSend;

/**
 * Represents data for an arrow that has landed on a block/tile.
 * Contains the arrow entity and the coordinates of the tile it landed on.
 * @typedef {Object} BowItemRightClick
 * @property {ItemStack} itemStack - The item stack that was right-clicked
 * @property {World} world - The world in which the right-click occurred
 * @property {EntityPlayer} player - The player who right-clicked
 */

/**
 * An event that is triggered when a player right-clicks with a bow item.
 * @const
 * @type {import('./CustomEvents').EventInstance<import('./CustomEvents').Data<BowItemRightClick>>}
 */
export const BowItemRightClick = events.BowItemRightClick;

/**
 * Represents data for an arrow that has landed on a block/tile.
 * Contains the arrow entity and the coordinates of the tile it landed on.
 * @typedef {Object} EntityArrowLandData
 * @property {EntityArrow} arrow - The arrow entity that landed
 * @property {number} xTile - The x-coordinate of the tile the arrow landed on
 * @property {number} yTile - The y-coordinate of the tile the arrow landed on
 * @property {number} zTile - The z-coordinate of the tile the arrow landed on
 */

/**
 * @const
 * @type {import('./CustomEvents').EventInstance<import('./CustomEvents').Data<EntityArrowLandData>>}
 */
export const EntityArrowLand = events.EntityArrowLand

/**
 * @typedef {Object} UpdateWalkingPlayerData
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} yaw
 * @property {number} pitch
 * @property {boolean} onGround
 */

/**
 * @const
 * @type {import('./CustomEvents').EventInstance<import('./CustomEvents').Data<UpdateWalkingPlayerData>>}
 */
export const UpdateWalkingPlayerPre = events.UpdateWalkingPlayerPre

/**
 * @const
 * @type {import('./CustomEvents').EventInstance<import('./CustomEvents').Data<UpdateWalkingPlayerData>>}
 */
export const UpdateWalkingPlayerPost = events.UpdateWalkingPlayerPost