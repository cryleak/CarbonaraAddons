import Settings from "../config"

export function findSlot(checker) {
    const items = Player.getInventory().getItems()
    for (let i = 0; i < 8; i++) {
        let item = items[i]
        if (!item) {
            continue
        }

        if (checker(item)) {
            return i;
        }
    }

    return null;
}

export function aotvFinder(tuners) {
    return (item) => getTuners(item) === tuners;
}

export function hypeFinder() {
    return (item) => isHype(item);
}

export function etherwarpFinder(tuners) {
    return (item) => {
        const itemTuners = getEtherwarpTuners(item);
        return itemTuners !== null && itemTuners == tuners;
    }
}

export function nameFinder(name) {
    return (item) => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(name.removeFormatting().toLowerCase());
}

function getEtherwarpTuners(item) {
    const extras = item?.getNBT()?.toObject()?.tag?.ExtraAttributes;
    if (!extras) {
        return null;
    }

    const sbId = extras.id;
    const found = extras.ethermerge == 1 || sbId == "ETHERWARP_CONDUIT"
    if (!found) {
        return null;
    }

    return getTuners(item, extras);
}

function getTuners(item, extras = null) {
    if (!extras) {
        extras = item?.getNBT()?.toObject()?.tag?.ExtraAttributes;
        if (!extras) {
            return null;
        }
    }

	const sbId = extras.id;
    if (["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END"].includes(sbId)) {
        return extras.tuned_transmission || 0;
    }

    return null;
}

function isHype(item) {
    const extras = item?.getNBT()?.toObject()?.tag?.ExtraAttributes;
    if (!extras) {
        return 0;
    }

	const sbId = extras.id;
    if (["NECRON_BLADE", "HYPERION", "VALKYRIE", "ASTRAEA", "SCYLLA"].includes(sbId)) {
        return ["IMPLOSION_SCROLL", "WITHER_SHIELD_SCROLL", "SHADOW_WARP_SCROLL"].every(value => extras.ability_scroll?.includes(value))
    }
}


export function getTeleportInfo(item, playerState) {
    if (Settings().singleplayer) {
        return;
    }

    if (playerState.sneaking) {
        const tuners = getEtherwarpTuners(item);
        if (tuners !== null) {
            return {
                distance: 56 + tuners,
                ether: true,
                type: "etherwarp"
            }
        }
    }

    if (isHype(item)) {
        return {
            distance: 10,
            ether: false,
            type: "hype"
        }
    } else {
        const tuners = getTuners(item);
        if (tuners !== null) {
            return {
                distance: 8 + tuners,
                ether: false,
                type: "aotv"
            }
        }
    }
}
