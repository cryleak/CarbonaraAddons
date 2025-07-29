import TerminalEvents from "../events/TerminalEvents"

const S2DPacketOpenWindow = Java.type("net.minecraft.network.play.server.S2DPacketOpenWindow")
const S2EPacketCloseWindow = Java.type("net.minecraft.network.play.server.S2EPacketCloseWindow")
const C0DPacketCloseWindow = Java.type("net.minecraft.network.play.client.C0DPacketCloseWindow")

export const termNames = [
    /^Click in order!$/,
    /^Select all the (.+?) items!$/,
    /^What starts with: '(.+?)'\?$/,
    /^Change all to same color!$/,
    /^Correct all the panes!$/,
    /^Click the button on time!$/
];

class TerminalHandler {
    constructor() {
        this.inTerminal = false
        this.currentWindowName = null

        register("packetReceived", (packet, _) => {
            const windowName = packet.func_179840_c().func_150254_d().removeFormatting()
            if (termNames.some(regex => windowName.match(regex))) {
                this.inTerminal = true;
                this.currentWindowName = windowName;
                TerminalEvents.Open.trigger(windowName);
            }
            else if (this.inTerminal) {
                this.inTerminal = false;
                TerminalEvents.Close.trigger(this.currentWindowName);
            }
        }).setFilteredClass(S2DPacketOpenWindow);

        register("packetReceived", () => {
            if (!this.inTerminal) {
                return;
            }

            this.inTerminal = false;
            TerminalEvents.Close.trigger(this.currentWindowName);
        }).setFilteredClass(S2EPacketCloseWindow);

        register("packetSent", () => {
            if (!this.inTerminal) {
                return;
            }

            this.inTerminal = false;
            TerminalEvents.Close.trigger(this.currentWindowName);
        }).setFilteredClass(C0DPacketCloseWindow);

        register("worldUnload", () => {
            if (!this.inTerminal) {
                return;
            }

            this.inTerminal = false;
            TerminalEvents.Close.trigger(this.currentWindowName);
        })
    }
}

export default new TerminalHandler();
