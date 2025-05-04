import {@ButtonProperty, @CheckboxProperty, @ColorProperty, @PercentSliderProperty, @SelectorProperty, @SwitchProperty, @TextProperty, @Vigilant, @SliderProperty, @NumberProperty, @DecimalSliderProperty} from '../Vigilance/index';

@Vigilant("CarbonaraAddons")
class Settings {
    constructor() {
        this.initialize(this);
        this.setCategoryDescription("Route", "Node Creation")
        this.addDependency("Blink Route", "show blinkRoute")
        this.addDependency("Blink Velocity Ticks", "show ticks")
        this.addDependency("Item name to use", "show itemName")
        this.addDependency("Player/Class to exclude", "show excludeClass")
        this.addDependency("Look", "show look")
        this.addDependency("Yaw", "show yaw")
        this.addDependency("Pitch", "show pitch")
        this.addDependency("Jump on HClip", "show jumpOnHClip")
        this.addDependency("Lavaclip distance", "show lavaClipDistance")
    }

    @TextProperty({
        name: "Blink Route",
        description: "Name of the blink route. Should not include .json",
        category: "Route"
    })
    blinkRoute = "";

    @TextProperty({
        name: "Blink Velocity Ticks",
        description: "Ticks to blink.",
        category: "Route"
    })
    ticks = "";

    @SwitchProperty({
        name: "Once",
        description: "Only trigger this node once until you reset it",
        category: "Route"
    })
    once = false;

    @SwitchProperty({
        name: "Center",
        description: "Puts you right in the center of where the NODE is located. Note that this also modifies your Y level, so it may not work and just lagback if your node is extremely tall. Useful to align yourself if you aren't starting in the middle of the block.",
        category: "Route"
    })
    center = false;

    @SwitchProperty({
        name: "Stop",
        description: "Stops all velocity when you do this node, this doesn't release movement keys.",
        category: "Route"
    })
    stop = false;

    @TextProperty({
        name: "Radius",
        description: "Radius of the node.",
        category: "Route",
    })
    radius = "0.5";

    @TextProperty({
        name: "Height",
        description: "Height of the node.",
        category: "Route",
    })
    height = "0.1";

    @SelectorProperty({
        name: "Node type",
        description: "Select an option",
        category: "Route",
        options: ["Look", "Walk", "Use Item", "Superboom", "Motion", "Stop Velocity", "Full Stop", "Blink", "Blink Velocity", "Jump", "HClip", "Await Terminal", "Await Leap", "Lavaclip"]
    })
    type = 5;

    @TextProperty({
        name: "Lavaclip distance",
        description: "Set it to 0 to automatically determine this.",
        category: "Route",
    })
    lavaClipDistance = "0";

    @TextProperty({
        name: "Item name to use",
        description: "",
        category: "Route",
    })
    itemName = "";

    @TextProperty({
        name: "Player/Class to exclude",
        description: "(Case sensitive) Options: Mage, Berserk, Archer, Healer, Tank\nAlternatively, type a player name here.",
        category: "Route",
    })
    excludeClass = "Mage";

    @SwitchProperty({
        name: "Look",
        description: "Rotate to specified Yaw/Pitch.",
        category: "Route"
    })
    look = "";

    @SwitchProperty({
        name: "Jump on HClip",
        description: "Jumps before HClipping if you are on the ground.",
        category: "Route"
    })
    jumpOnHClip = true;

    @TextProperty({
        name: "Yaw",
        description: "Number between -180 and 180.",
        category: "Route"
    })
    yaw = "";

    @TextProperty({
        name: "Pitch",
        description: "Number between -90 and 90.",
        category: "Route"
    })
    pitch = "";

    @TextProperty({
        name: "Node Delay",
        description: "If you are stacking multiple nodes together to perform multiple actions (e.g throwing 2 pearls), each individual node should have a delay of at least 150ms more than the last one to work properly. This only matters for nodes that use server rotations.",
        category: "Route"
    })
    delay = "";

    @SwitchProperty({
        name: "show blinkRoute",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showBlinkRoute = false;

    @SwitchProperty({
        name: "show ticks",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showTicks = false;

    @SwitchProperty({
        name: "show itemName",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showItemName = false;

    @SwitchProperty({
        name: "show yaw",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showYaw = false;

    @SwitchProperty({
        name: "show pitch",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showPitch = false;

    @SwitchProperty({
        name: "show look",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showLook = false;

    @SwitchProperty({
        name: "show excludeClass",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showExcludeClass = false;

    @SwitchProperty({
        name: "show jumpOnHClip",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showJumpOnHClip = false;

    @SwitchProperty({
        name: "show lavaClipDistance",
        description: "",
        category: "Schizo vigilance shit ignore this"
    })
    showLavaClipDistance = false;
}

export default new Settings()