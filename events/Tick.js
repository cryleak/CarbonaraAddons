import WrappedJavaEvent from "./WrappedJavaEvent"

const events = Java.type("me.cryleak.carbonaraloader.event.Events")

export default { Pre: new WrappedJavaEvent(events.TickPre), Post: new WrappedJavaEvent(events.TickPost) }