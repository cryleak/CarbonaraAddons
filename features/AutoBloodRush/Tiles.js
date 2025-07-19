const info = Java.type("funnymap.features.dungeon.Dungeon$Info");
const infoInstance = info.INSTANCE;

import Tick from "../../events/Tick";


class Scanner {
    constructor() {
        this.names = [
            "Altar",
            "Chambers",
            "Dino Site",
            "Lava Pit",
            "Lava Ravine",
            "Layers",
            "Market",
            "Melon",
            "Pirate",
            "Spider",
            "Withermancer"
        ];

        this._bloodRoomTile = null;
        Tick.Pre.register(() => {
            if (!this._bloodRoomTile) {
                this._findBloodTile();
            }
        }, 234999);

        register("worldUnload", () => {
            this._bloodRoomTile = null;
        });
    }

    getRoom() {
        return this._bloodRoomTile;
    }

    findTileNotL() {
        const found = infoInstance.getDungeonList().find(tile => {
            isRoom = tile instanceof Java.type("funnymap.core.map.Room");
            if (!isRoom) {
                return;
            }

            const coords = this._getTileCoords(tile);
            if (coords.x >= 2 && coords.x <= 4 && coords.z >= 2 && coords.z <= 4) {
                return !this.names.includes(tile.getData().getName());
            }
        });

        if (found) {
            ChatLib.chat(`The room that's not an L room is: ${found.getData().getName()}`);
            return this._getTileCoords(found);
        }
    }

    _findBloodTile() {
        const found = infoInstance.getDungeonList().find(tile => {
            isRoom = tile instanceof Java.type("funnymap.core.map.Room");
            if (!isRoom) {
                return;
            }

            return tile.getData().getType().toString() === "BLOOD";
        });

        if (found) {
            this._bloodRoomTile = this._getTileCoords(found);
        }
    }

    _getTileCoords(tile) {
        const tileX = Math.floor((tile.getX() + 200) / 32);
        const tileZ = Math.floor((tile.getZ() + 200) / 32);
        return { x: tileX, z: tileZ };
    }
}

const scanner = new Scanner();
export default scanner;
