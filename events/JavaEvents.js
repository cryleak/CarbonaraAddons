import { Event, CancellableEvent } from "./CustomEvents";

const events = Java.type("me.cryleak.carbonaraloader.event.Events");

register("gameUnload", () => {
    events.unregisterAll();
});

export const PostPacketSend = events.PostPacketSend;
export const BowItemRightClick = events.BowItemRightClick;

/**
 * Represents data for an arrow that has landed on a block/tile.
 * Contains the arrow entity and the coordinates of the tile it landed on.
 * @class EntityArrowLandData
 * @property {EntityArrow} arrow - The arrow entity that landed
 * @property {number} xTile - The x-coordinate of the tile the arrow landed on
 * @property {number} yTile - The y-coordinate of the tile the arrow landed on
 * @property {number} zTile - The z-coordinate of the tile the arrow landed on
 */

/**
 * @type {Event<EntityArrowLandData>}
 */
export const EntityArrowLand = events.EntityArrowLand
