import { Event } from "./CustomEvents"

const TerminalOpenEvent = new Event();
const TerminalCloseEvent = new Event();
export default { Open: TerminalOpenEvent, Close: TerminalCloseEvent };
