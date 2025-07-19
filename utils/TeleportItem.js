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
        const extras = item?.getNBT()?.toObject()?.tag?.ExtraAttributes;
        if (!extras) {
            return 0;
        }

        const sbId = extras.id;
        const found = extras.ethermerge == 1 || sbId == "ETHERWARP_CONDUIT"
        if (!found) {
            return false;
        }

        return getTuners(item, extras) === tuners;
    }
}

export function nameFinder(name) {
    return (item) => item?.getName()?.removeFormatting()?.toLowerCase()?.includes(name.removeFormatting().toLowerCase());
}

function getTuners(item, extras = null) {
    if (!extras) {
        extras = item?.getNBT()?.toObject()?.tag?.ExtraAttributes;
        if (!extras) {
            return 0;
        }
    }

	const sbId = extras.id;
    if (["ASPECT_OF_THE_VOID", "ASPECT_OF_THE_END"].includes(sbId)) {
        return extras.tuned_transmission || 0;
    }
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
