import Dungeons from  "./Dungeons"
const locationUtils = Java.type("me.odinmain.utils.skyblock.LocationUtils").INSTANCE

export default new class Location {
    getCurrentIslandName() {
        if (!locationUtils.isOnHypixel || !locationUtils.isInSkyblock) return "Unknown"
        return locationUtils.currentArea.displayName
    }

    getCurrentLocationName() {
        const name = Dungeons.getRoomName();
        if (name && name !== "Unknown") return {type: "dungeons", name};
        return {type: "island", name: this.getCurrentIslandName()};
    }
};
