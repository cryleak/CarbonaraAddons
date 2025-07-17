import { CancellableEvent, Event } from "./CustomEvents";

const events = Java.type("me.cryleak.carbonaraloader.event.Events");

register("gameUnload", () => {
    events.unregisterAll();
});

/** @type {Event} */
export const PostPacketSend = events.PostPacketSend;
/** @type {CancellableEvent} */
export const BowItemRightClick = events.BowItemRightClick;