const events = Java.type("me.cryleak.carbonaraloader.event.Events");

register("gameUnload", () => {
    events.unregisterAll();
});

export const PostPacketSend = events.PostPacketSend;
export const BowItemRightClick = events.BowItemRightClick;
