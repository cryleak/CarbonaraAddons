import { CancellableEvent, Event } from "./CustomEvents"

const PrePhoenixAuthEvent = new CancellableEvent();
const PostPhoenixAuthEvent = new Event();
export default { Pre: PrePhoenixAuthEvent, Post: PostPhoenixAuthEvent };
