import Settings from "../config";
import LeapHelper from "../utils/leapUtils";
import Vector3 from "../utils/Vector3";
import MouseEvent from "../events/MouseEvent";
import RenderLibV2 from "RenderLibV2J";
import Terminal from "./Terminal";

import Module, { registerModule } from "./PhoenixModule";
import { getHeldItemID, sendAirClick } from "../utils/utils";
import { chat } from "../utils/utils";

const S3FPacketCustomPayload = Java.type("net.minecraft.network.play.server.S3FPacketCustomPayload");

class PositionalLeapHandler {
	constructor() {
		this.module = "carbonaraaddons";
		this.path = "data/leaps.json";
		this.leaps = [];
		this._start = null;

		this._assureLeaps();
		register("renderWorld", () => { if (Settings().positionalLeap && Settings().drawPositionalLeap) { this._renderPositions(); } });
	}

	start() {
		this._start = new Vector3(Player);
	}

	end(name, prio) {
		if (!name || !this._start) {
			return;
		}

		this.addLeap({
			p1: this._start,
			p2: new Vector3(Player),
			to: name,
			prio
		});

		this._start = null;
	}

	_assureLeaps() {
		if (!FileLib.exists(this.module, this.path)) {
			FileLib.write(this.module, this.path, JSON.stringify([]));
			this.leaps = [];
			return;
		}

		const data = FileLib.read(this.module, this.path);
		if (!data) {
			return;
		}

		this.leaps = JSON.parse(data, (_, value) => {
            if (value && typeof (value.x) === "number" && typeof (value.y) === "number" && typeof (value.z) === "number") {
                return new Vector3(value.x, value.y, value.z);
            }
            return value;
        });
	}

	remove(to) {
		const currPos = new Vector3(Player);
		let closestDistance = Infinity;
		let closestLeapIndex = -1;

		this.leaps.forEach((leap, i) => {
			if (to && leap.to !== to) {
				return;
			}

			const midPoint = new Vector3(
				leap.low.x + (leap.high.x - leap.low.x) / 2,
				leap.low.y + (leap.high.y - leap.low.y) / 2,
				leap.low.z + (leap.high.z - leap.low.z) / 2
			);

			const dist = currPos.distance3D(midPoint);
			if (dist < closestDistance) {
				closestDistance = dist;
				closestLeapIndex = i;
			}
		});

		if (closestLeapIndex === -1) {
			chat(`&cNo leap to remove.`);
			return;
		}

		const removedLeap = this.leaps.splice(closestLeapIndex, 1)[0];
		this._saveLeaps();
		chat(`&aLeap removed: ` + JSON.stringify(removedLeap));
	}

	findName() {
		const { x, y, z } = Player;

		const filtered = this.leaps.filter(leap => {
			return x >= leap.low.x && x <= leap.high.x &&
                     y >= leap.low.y && y <= leap.high.y &&
                     z >= leap.low.z && z <= leap.high.z;
		});
		if (!filtered) {
			return null;
		}
		const l = filtered.reduce((max, current) => current.prio > max.prio ? current : max, {prio:-Infinity});

		return l ? l.to : null;
	}

	_sanitize(l) {
		return {
			low: new Vector3(
				Math.min(l.p1.x, l.p2.x),
				Math.min(l.p1.y, l.p2.y),
				Math.min(l.p1.z, l.p2.z)
			),
			high: new Vector3(
				Math.max(l.p1.x, l.p2.x),
				Math.max(l.p1.y, l.p2.y),
				Math.max(l.p1.z, l.p2.z)
			),
			to: l.to,
			prio: l.prio ? l.prio : 0
		};
	}

	addLeap(l) {
        if (!(l.p1 instanceof Vector3) || !(l.p2 instanceof Vector3) || !l.to) {
            chat("&cCould not add leap");
            return;
        }

		const sanitized = this._sanitize(l);
		this.leaps.push(sanitized);
		this._saveLeaps();

		chat(`&7Successfully added leap to &a${sanitized.to}&7!`);
	}

	_saveLeaps() {
		try {
			FileLib.write(this.module, this.path, JSON.stringify(this.leaps));
		} catch (error) {
			chat(`&cError saving leaps: ` + error);
		}
	}

	_renderPositions() {
		if (!this.leaps) {
			return;
		}


		this.leaps.forEach(leap => {
			const wx = Math.abs(leap.high.x - leap.low.x);
			const h = Math.abs(leap.high.y - leap.low.y);
			const wz = Math.abs(leap.high.z - leap.low.z);
			RenderLibV2.drawEspBoxV2(leap.low.x + wx / 2, leap.low.y, leap.low.z + wz / 2, wx, h, wz, 1, 0, 0, 1, true);
		});

		if (this._start !== null) {
			const leap = this._sanitize({ p1: this._start, p2: new Vector3(Player) });
			const wx = Math.abs(leap.high.x - leap.low.x);
			const h = Math.abs(leap.high.y - leap.low.y);
			const wz = Math.abs(leap.high.z - leap.low.z);
			RenderLibV2.drawEspBoxV2(leap.low.x + wx / 2, leap.low.y, leap.low.z + wz / 2, wx, h, wz, 0, 1, 0, 1, true);
		}
	}
};

registerModule(class FastLeap extends Module {
    constructor(phoenix) {
        super("Leap", phoenix)
        this._tryLoadConfig();

        this.handler = new PositionalLeapHandler();

        this.queuedLeap = false

		register("command", (...args) => { this._cmd(...args); }).setName("posleaps");

        MouseEvent.register(event => {
            const { button, state } = event.data
            if (!state || button !== 1) return


            if (!["INFINITE_SPIRIT_LEAP", "SPIRIT_LEAP"].includes(getHeldItemID())) return

            LeapHelper.clearQueue()
            this.queuedLeap = false
        }, 0)

        MouseEvent.register(event => {
            if (!Settings().fastLeap) return
            const { button, state } = event.data
            if (!state || button !== 0) return

            if (!["INFINITE_SPIRIT_LEAP", "SPIRIT_LEAP"].includes(getHeldItemID())) return

            if (Terminal.inTerminal) {
                if (!Settings().queueFastLeap) return
                this.queuedLeap = true
                event.cancelled = true
                event.breakChain = true
                return chat("Queued a leap after the terminal closes.")
            }

            this.queuedLeap = false
            let leapTo = this._getLeapPriority()
            if (!leapTo || !leapTo.length) {
                return;
            }

            sendAirClick()
            this.queueLeap(leapTo);
            event.cancelled = true;
            event.breakChain = true;
        })

        register("tick", () => {
            if (Terminal.inTerminal || !this.queuedLeap) return

            this.queuedLeap = false

            if (!["INFINITE_SPIRIT_LEAP", "SPIRIT_LEAP"].includes(getHeldItemID())) return

            this.queuedLeap = false
            let leapTo = this._getLeapPriority()
            if (!leapTo || !leapTo.length) {
                return;
            }

            sendAirClick()
            this.queueLeap(leapTo);
        })

        register("worldUnload", () => {
            this.queuedLeap = false
        })

		register("packetReceived", (packet, _) => {
			if (packet.func_149169_c() === "mi0-leap-close-gui") {
				Client.getMinecraft().field_71462_r = null;
			}
		}).setFilteredClass(S3FPacketCustomPayload);
	}

	_cmd(...args) {
		switch (args[0]) {
			case "add":
				this._add(args.slice(1));
				break;
			case "remove":
				this.handler.remove(args[1]);
				break;
			case "start":
				this.handler.start();
				break;
			case "end":
				if (!args[1]) {
					break;
				}

				this.handler.end(args[1], args[2]);
				break;
		}
	}

	_add(args) {
		if (args.length !== 7 && args.length !== 8) {
			chat("&cCould not add positional leap!");
			return;
		}

		const leap = {
			p1: new Vector3(
                parseFloat(args[0]),
				parseFloat(args[1]),
				parseFloat(args[2])
			),
			p2: new Vector3(
				parseFloat(args[3]),
				parseFloat(args[4]),
				parseFloat(args[5])
			),
			to: args[6],
			prio: parseInt(args[7])
		}

		this.handler.addLeap(leap);
	}

	_getLeapPriority() {
		let leapTo = Settings().defaultPlayerLeap;

		if (Settings().positionalLeap) {
			const positional = this.handler.findName();
			if (positional) {
				leapTo = positional;
			}
		}

		return this._leapName(leapTo);
	}

	_leapName(to) {
		const name = LeapHelper.getPlayerToLeapTo(to);
		return name === -1 ? to : name;
	}

    queueLeap(player) {
        if (this.isToggled()) {
            this._phoenix.customPayload("mi0-leap", player);
        } else {
            LeapHelper.queueLeap(player)
        }
    }

	_performLeap(to) {
		leap(to);
		rightClick();
	}
});
