/****************************************************************
*       Reloop Terminal Mix MIDI controller script v2.1         *
*           Copyright (C) 2012-2013, Sean M. Pappalardo         *
*                         2018, ronso0 (2.1 update)             *
*       but feel free to tweak this to your heart's content!    *
*       For Mixxx version 2.1.x                                 *
*                                                               *
*       Documentation in the Mixxx wiki:                        *
*       https://mixxx.org/wiki/doku.php/reloop_terminal_mix     *
****************************************************************/

// The SysEx message to send to the controller to force the midi controller
// to send the status of every item on the control surface.
var ControllerStatusSysex = [0xF0, 0x00, 0x20, 0x7F, 0x03, 0x01, 0xF7];

function TerminalMix() {}

// ----------   Customization variables ----------
// Push the 'RANGE' button at the top edge of the pitch fader to
// cycle through the following pitch ranges. Edit the array to choose
// the ranges you need. For example '0.08' means +/-8%
TerminalMix.pitchRanges = [ 0.08, 0.12, 0.25, 0.5, 1.0 ];

// ----------   Other global variables    ----------
TerminalMix.timers = [];
TerminalMix.state = [];
TerminalMix.faderStart = [];
TerminalMix.lastFader = [];   // Last value of each channel/cross fader
TerminalMix.lastEQs = [[]];
TerminalMix.traxKnobMode = "tracks";
TerminalMix.shifted = false;
TerminalMix.shiftedL = false;
TerminalMix.shiftedR = false;
TerminalMix.showMasterVuMeter = false;
// colors from https://mixxx.discourse.group/t/hercules-djcontrol-inpulse-500/19739/56
TerminalMix.constants = {
    RED_COLOR: 0x60,
    WHITE_COLOR: 0x7F,
    ORANGE_COLOR: 0x74,
    ORANGE_RED_COLOR: 0x70,
    PINK_COLOR: 0x72,
    SKY_BLUE_COLOR: 0x1F,
    LIGHT_BLUE_COLOR: 0x0F,
    DARK_BLUE_COLOR: 0x06,
    BLUE_COLOR: 0x07,
    YELLOW_COLOR: 0x7C,
    DARK_PURPLE_COLOR: 0x27,
    PURPLE_COLOR: 0x25,
    LIGHT_PURPLE_COLOR: 0x2A,
};

TerminalMix.selectedChannels = {
    channel1: true,
    channel2: true,
    channel3: false,
    channel4: false
}

// main: value of pad when performance mode pressed once
// shift: value of pad when performance mode pressed once and SHIFT button held
// secondary: value of pad when performance mode pressed twice
// secondaryShift: value of pad when performance mode pressed twice and SHIFT button held
TerminalMix.padColors = {
    cueMode: {
        main:           TerminalMix.constants.ORANGE_RED_COLOR,
        shift:          TerminalMix.constants.WHITE_COLOR,
        secondary:      TerminalMix.constants.PINK_COLOR,
        secondaryShift: TerminalMix.constants.WHITE_COLOR,
    },
    loopMode: {
        main:           TerminalMix.constants.BLUE_COLOR,
        shift:          TerminalMix.constants.WHITE_COLOR,
        secondary:      TerminalMix.constants.LIGHT_BLUE_COLOR,
        secondaryShift: TerminalMix.constants.LIGHT_BLUE_COLOR,
    },
    sampleMode: {
        main:           TerminalMix.constants.YELLOW_COLOR,
        shift:          TerminalMix.constants.LIGHT_BLUE_COLOR,
        secondary:      TerminalMix.constants.ORANGE_COLOR,
        secondaryShift: TerminalMix.constants.LIGHT_BLUE_COLOR,
    },
}
TerminalMix.blinkingPads = {
    0x94: {
        // Beatsize Loop
        0x08: {blinking: false, id: 0},
        0x09: {blinking: false, id: 0},
        0x0A: {blinking: false, id: 0},
        0x0B: {blinking: false, id: 0},
        0x0C: {blinking: false, id: 0},
        0x0D: {blinking: false, id: 0},
        0x0E: {blinking: false, id: 0},
        0x0F: {blinking: false, id: 0},

        // Sampler
        0x10: {blinking: false, id: 0},
        0x11: {blinking: false, id: 0},
        0x12: {blinking: false, id: 0},
        0x13: {blinking: false, id: 0},
        0x15: {blinking: false, id: 0},
        0x16: {blinking: false, id: 0},
        0x17: {blinking: false, id: 0},

        // Manual Loop
        0x28: {blinking: false, id: 0},
    },
    0x95: {
        // Beatsize Loop
        0x08: {blinking: false, id: 0},
        0x09: {blinking: false, id: 0},
        0x0A: {blinking: false, id: 0},
        0x0B: {blinking: false, id: 0},
        0x0C: {blinking: false, id: 0},
        0x0D: {blinking: false, id: 0},
        0x0E: {blinking: false, id: 0},
        0x0F: {blinking: false, id: 0},

        // Sampler
        0x10: {blinking: false, id: 0},
        0x11: {blinking: false, id: 0},
        0x12: {blinking: false, id: 0},
        0x13: {blinking: false, id: 0},
        0x15: {blinking: false, id: 0},
        0x16: {blinking: false, id: 0},
        0x17: {blinking: false, id: 0},

        // Manual Loop
        0x28: {blinking: false, id: 0},
    },
    0x96: {
        // Beatsize Loop
        0x08: {blinking: false, id: 0},
        0x09: {blinking: false, id: 0},
        0x0A: {blinking: false, id: 0},
        0x0B: {blinking: false, id: 0},
        0x0C: {blinking: false, id: 0},
        0x0D: {blinking: false, id: 0},
        0x0E: {blinking: false, id: 0},
        0x0F: {blinking: false, id: 0},

        // Sampler
        0x10: {blinking: false, id: 0},
        0x11: {blinking: false, id: 0},
        0x12: {blinking: false, id: 0},
        0x13: {blinking: false, id: 0},
        0x15: {blinking: false, id: 0},
        0x16: {blinking: false, id: 0},
        0x17: {blinking: false, id: 0},

        // Manual Loop
        0x28: {blinking: false, id: 0},
    },
    0x97: {
        // Beatsize Loop
        0x08: {blinking: false, id: 0},
        0x09: {blinking: false, id: 0},
        0x0A: {blinking: false, id: 0},
        0x0B: {blinking: false, id: 0},
        0x0C: {blinking: false, id: 0},
        0x0D: {blinking: false, id: 0},
        0x0E: {blinking: false, id: 0},
        0x0F: {blinking: false, id: 0},

        // Sampler
        0x10: {blinking: false, id: 0},
        0x11: {blinking: false, id: 0},
        0x12: {blinking: false, id: 0},
        0x13: {blinking: false, id: 0},
        0x15: {blinking: false, id: 0},
        0x16: {blinking: false, id: 0},
        0x17: {blinking: false, id: 0},

        // Manual Loop
        0x28: {blinking: false, id: 0},
    },
}

TerminalMix.performancePadsButtonDefinitions = {
    cueMode: {
        pad1: {
            main:           0x00,
            shift:          0x40,
            secondary:      0x20,
            secondaryShift: 0x60,
        },
        pad2: {
            main:           0x01,
            shift:          0x41,
            secondary:      0x21,
            secondaryShift: 0x61,
        },
        pad3: {
            main:           0x02,
            shift:          0x42,
            secondary:      0x22,
            secondaryShift: 0x62,
        },
        pad4: {
            main:           0x03,
            shift:          0x43,
            secondary:      0x23,
            secondaryShift: 0x63,
        },
        pad5: {
            main:           0x04,
            shift:          0x44,
            secondary:      0x24,
            secondaryShift: 0x64,
        },
        pad6: {
            main:           0x05,
            shift:          0x45,
            secondary:      0x25,
            secondaryShift: 0x65,
        },
        pad7: {
            main:           0x06,
            shift:          0x46,
            secondary:      0x26,
            secondaryShift: 0x66,
        },
        pad8: {
            main:           0x07,
            shift:          0x47,
            secondary:      0x27,
            secondaryShift: 0x67,
        },
    },
    loopMode: {
        pad1: {
            main:           0x08,
            shift:          0x48,
            secondary:      0x28,
            secondaryShift: 0x68,
        },
        pad2: {
            main:           0x09,
            shift:          0x49,
            secondary:      0x29,
            secondaryShift: 0x69,
        },
        pad3: {
            main:           0x0A,
            shift:          0x4A,
            secondary:      0x2A,
            secondaryShift: 0x6A,
        },
        pad4: {
            main:           0x0B,
            shift:          0x4B,
            secondary:      0x2B,
            secondaryShift: 0x6B,
        },
        pad5: {
            main:           0x0C,
            shift:          0x4C,
            secondary:      0x2C,
            secondaryShift: 0x6C,
        },
        pad6: {
            main:           0x0D,
            shift:          0x4D,
            secondary:      0x2D,
            secondaryShift: 0x6D,
        },
        pad7: {
            main:           0x0E,
            shift:          0x4E,
            secondary:      0x2E,
            secondaryShift: 0x6E,
        },
        pad8: {
            main:           0x0F,
            shift:          0x4F,
            secondary:      0x2F,
            secondaryShift: 0x6F,
        },
    },
    sampleMode: {
        pad1: {
            main:           0x10,
            shift:          0x50,
            secondary:      0x30,
            secondaryShift: 0x70,
        },
        pad2: {
            main:           0x11,
            shift:          0x51,
            secondary:      0x31,
            secondaryShift: 0x71,
        },
        pad3: {
            main:           0x12,
            shift:          0x52,
            secondary:      0x32,
            secondaryShift: 0x72,
        },
        pad4: {
            main:           0x13,
            shift:          0x53,
            secondary:      0x33,
            secondaryShift: 0x73,
        },
        pad5: {
            main:           0x14,
            shift:          0x54,
            secondary:      0x34,
            secondaryShift: 0x74,
        },
        pad6: {
            main:           0x15,
            shift:          0x55,
            secondary:      0x35,
            secondaryShift: 0x75,
        },
        pad7: {
            main:           0x16,
            shift:          0x56,
            secondary:      0x36,
            secondaryShift: 0x76,
        },
        pad8: {
            main:           0x17,
            shift:          0x57,
            secondary:      0x37,
            secondaryShift: 0x77,
        },
    },
};

// ----------   Functions   ----------

TerminalMix.init = function (id,debug) {
    TerminalMix.id = id;

    // Extinguish all LEDs
    for (var i=0; i<=7; i++) {  // 4 decks, 8 channels total
        for (var j=1; j<=120; j++) {
            midi.sendShortMsg(0x90+i,j,0x00);
        }
    }

    // New mapping of FX units using midi-components-0.0.js
    // EffectUnits 1 & 3. Usage:
    // new components.EffectUnit([int list EffUnit numbers], bool allowFocusWhenParametersHidden)
    TerminalMix.effectUnit13 = new components.EffectUnit([1,3]);
    TerminalMix.effectUnit13.enableButtons[1].midi = [0x90, 0x1a];
    TerminalMix.effectUnit13.enableButtons[2].midi = [0x90, 0x1b];
    TerminalMix.effectUnit13.enableButtons[3].midi = [0x90, 0x1c];
    TerminalMix.effectUnit13.knobs[1].midi = [0xB0, 0x1a];
    TerminalMix.effectUnit13.knobs[2].midi = [0xB0, 0x1b];
    TerminalMix.effectUnit13.knobs[3].midi = [0xB0, 0x1c];
    // TerminalMix.effectUnit13.dryWetKnob.midi = [0xB0, 0x1d];
    // TerminalMix.effectUnit13.dryWetKnob.input = function (channel, control, value, status, group) {
    //     if (value === 63) {
    //       this.inSetParameter(this.inGetParameter() - .07);
    //     } else if (value === 65) {
    //       this.inSetParameter(this.inGetParameter() + .07);
    //     }
    // };
    // TerminalMix.effectUnit13.effectFocusButton.midi = [0x90, 0x1e];
    TerminalMix.effectUnit13.init();

    // EffectUnits 2 & 4
    TerminalMix.effectUnit24 = new components.EffectUnit([2,4]);
    TerminalMix.effectUnit24.enableButtons[1].midi = [0x91, 0x1a];
    TerminalMix.effectUnit24.enableButtons[2].midi = [0x91, 0x1b];
    TerminalMix.effectUnit24.enableButtons[3].midi = [0x91, 0x1c];
    TerminalMix.effectUnit24.knobs[1].midi = [0xB1, 0x1a];
    TerminalMix.effectUnit24.knobs[2].midi = [0xB1, 0x1b];
    TerminalMix.effectUnit24.knobs[3].midi = [0xB1, 0x1c];
    // TerminalMix.effectUnit24.dryWetKnob.midi = [0xB1, 0x1d];
    // TerminalMix.effectUnit24.dryWetKnob.input = function (channel, control, value, status, group) {
    //     if (value === 63) {
    //       this.inSetParameter(this.inGetParameter() - .07);
    //     } else if (value === 65) {
    //       this.inSetParameter(this.inGetParameter() + .07);
    //     }
    // };
    // TerminalMix.effectUnit24.effectFocusButton.midi = [0x91, 0x1e];
    TerminalMix.effectUnit24.init();

    // Enable four decks in v1.11.x
    engine.setValue("[App]", "num_decks", 4);

    // Set soft-takeover for all Sampler volumes
    for (var i=engine.getValue("[Master]", "num_samplers"); i>=1; i--) {
        engine.softTakeover("[Sampler"+i+"]","pregain",true);
    }
    // Set soft-takeover for all applicable Deck controls
    for (var i=engine.getValue("[App]", "num_decks"); i>=1; i--) {
        engine.softTakeover("[Channel"+i+"]","volume",true);
        engine.softTakeover("[Channel"+i+"]","filterHigh",true);
        engine.softTakeover("[Channel"+i+"]","filterMid",true);
        engine.softTakeover("[Channel"+i+"]","filterLow",true);
        engine.softTakeover("[Channel"+i+"]","rate",true);
    }

    engine.softTakeover("[Master]","crossfader",true);

    // NOTE: This might look wild
    engine.connectControl("[Channel1]","beat_active","TerminalMix.tapLEDL");
    engine.connectControl("[Channel2]","beat_active","TerminalMix.tapLEDR");
    engine.connectControl("[Channel3]","beat_active","TerminalMix.tapLEDL");
    engine.connectControl("[Channel4]","beat_active","TerminalMix.tapLEDR");


    // connect cue pad colors
    for (var i=1; i<5; i++) {
        var channelName = "[Channel"+i+"]";
        for (var j=1; j<9; j++) {
            // hot cue colors
            var controlName = "hotcue_" + j + "_enabled";
            var functionName = "TerminalMix.colorPadAllControls_CueDeck"+i+"Pad"+j;
            engine.connectControl(channelName, controlName, functionName);
        }

        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad2.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad3.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad5.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad6.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad7.main, TerminalMix.padColors.loopMode.main)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.main, TerminalMix.padColors.loopMode.main)

        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.secondary, TerminalMix.padColors.loopMode.secondary)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.secondary, TerminalMix.padColors.loopMode.secondary)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad5.secondary, TerminalMix.padColors.loopMode.secondary)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad6.secondary, TerminalMix.padColors.loopMode.secondary)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad7.secondary, TerminalMix.padColors.loopMode.secondary)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.secondary, TerminalMix.padColors.loopMode.secondary)

        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.secondaryShift, TerminalMix.padColors.loopMode.secondaryShift)
        TerminalMix.colorPad(0x7F, 0x94 + (i-1), TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.secondaryShift, TerminalMix.padColors.loopMode.secondaryShift)

        engine.connectControl(channelName, "beatloop_0.0625_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad1")
        engine.connectControl(channelName, "beatloop_0.125_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad2")
        engine.connectControl(channelName, "beatloop_0.25_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad3")
        engine.connectControl(channelName, "beatloop_0.5_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad4")
        engine.connectControl(channelName, "beatloop_1_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad5")
        engine.connectControl(channelName, "beatloop_2_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad6")
        engine.connectControl(channelName, "beatloop_4_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad7")
        engine.connectControl(channelName, "beatloop_8_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Pad8")

        // engine.connectControl(channelName, "beatloop_0.03125_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Reloop")
        // engine.connectControl(channelName, "beatloop_16_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Reloop")
        // engine.connectControl(channelName, "beatloop_32_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Reloop")
        // engine.connectControl(channelName, "beatloop_64_enabled", "TerminalMix.blinkPad_LoopDeck"+i+"Reloop")
    }


    // connect sampler pad colors
    var nSampler = 1;
    var nDeck = 1;
    while ( nSampler <= 8 ) {
        for (var i=1; i<=4; i++) {
            engine.connectControl("[Sampler"+nSampler+"]", "track_loaded",   "TerminalMix.colorPadAllControls_SampleDeck"+nDeck+"Pad"+i);
            engine.connectControl("[Sampler"+nSampler+"]", "play_indicator", "TerminalMix.blinkPadAllControls_SampleDeck"+nDeck+"Pad"+i);
            engine.connectControl("[Sampler"+( nSampler + 8 )+"]", "track_loaded",   "TerminalMix.colorPadAllControls_SampleDeck"+nDeck+"Pad"+(i + 4));
            engine.connectControl("[Sampler"+( nSampler + 8 )+"]", "play_indicator", "TerminalMix.blinkPadAllControls_SampleDeck"+nDeck+"Pad"+(i + 4));
            nSampler++;
        }
        nDeck++;
    }

    engine.connectControl("[Channel1]", "VuMeter", "TerminalMix.changeVuMeterL1");
    engine.connectControl("[Channel3]", "VuMeter", "TerminalMix.changeVuMeterL3");
    engine.connectControl("[Channel2]", "VuMeter", "TerminalMix.changeVuMeterR2");
    engine.connectControl("[Channel4]", "VuMeter", "TerminalMix.changeVuMeterR4");
    engine.connectControl("[Master]", "VuMeter", "TerminalMix.changeVuMeterMaster");

    TerminalMix.timers["fstartflash"] = -1;
//     TerminalMix.timers["qtrSec"] = engine.beginTimer(250,"TerminalMix.qtrSec");
    TerminalMix.timers["halfSec"] = engine.beginTimer(500,"TerminalMix.halfSec");

    if (TerminalMix.traxKnobMode == "tracks") {
        midi.sendShortMsg(0x90,0x26,0x7F);  // light Back button
    }

    // After midi controller receive this Outbound Message request SysEx Message,
    // midi controller will send the status of every item on the
    // control surface. (Mixxx will be initialized with current values)
    midi.sendSysexMsg(ControllerStatusSysex, ControllerStatusSysex.length);

    print ("Reloop TerminalMix: "+id+" initialized.");

    // default to cue mode
    midi.sendShortMsg(0x90,0x11,0x7F); // this is bugged for some reason
    midi.sendShortMsg(0x91,0x11,0x7F);
    midi.sendShortMsg(0x92,0x11,0x7F);
    midi.sendShortMsg(0x93,0x11,0x7F);
}

TerminalMix.shutdown = function () {
    // Stop all timers
    for (var i=0; i<TerminalMix.timers.length; i++) {
        engine.stopTimer(TerminalMix.timers[i]);
    }
    // Extinguish all LEDs
    for (var i=0; i<=7; i++) {  // 4 decks
        for (var j=1; j<=120; j++) {
            midi.sendShortMsg(0x90+i,j,0x00);
        }
    }
    print ("Reloop TerminalMix: "+TerminalMix.id+" shut down.");
}

TerminalMix.qtrSec = function () {

}

TerminalMix.halfSec = function () {
    TerminalMix.faderStartFlash();
    TerminalMix.samplerPlayFlash();
    TerminalMix.activeLoopFlash();
}

TerminalMix.registerChannelLeft = function (channel, control, value, status, group) {
    if (value === 0x7F) {
        if (channel === 0) {
            TerminalMix.selectedChannels.channel1 = true
            TerminalMix.selectedChannels.channel3 = false
        } else if (channel === 2) {
            TerminalMix.selectedChannels.channel1 = false
            TerminalMix.selectedChannels.channel3 = true
        }
    }
}

TerminalMix.registerChannelRight = function (channel, control, value, status, group) {
    if (value === 0x7F) {
        if (channel === 1) {
            TerminalMix.selectedChannels.channel2 = true
            TerminalMix.selectedChannels.channel4 = false
        } else if (channel === 3) {
            TerminalMix.selectedChannels.channel2 = false
            TerminalMix.selectedChannels.channel4 = true
        }
    }
}

// The button that enables/disables scratching
TerminalMix.wheelTouch = function (channel, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    if (value == 0x7F) {
        var alpha = 1.0/8;
        var beta = alpha/32;
        engine.scratchEnable(deck, 800, 33+1/3, alpha, beta);
    }
    else {    // If button up
        engine.scratchDisable(deck);
    }
}

// The wheel that actually controls the scratching
TerminalMix.wheelTurn = function (channel, control, value, status, group) {
    var deck = script.deckFromGroup(group);
    var newValue=(value-64);
    // See if we're scratching. If not, do wheel jog.
    if (!engine.isScratching(deck)) {
        engine.setValue(group, "jog", newValue/4);
        return;
    }

    // Register the movement
    engine.scratchTick(deck,newValue);
}

TerminalMix.samplerVolume = function (channel, control, value) {
    // Link all sampler volume controls to the Sampler Volume knob
    for (var i=engine.getValue("[Master]", "num_samplers"); i>=1; i--) {
        engine.setValue("[Sampler"+i+"]","pregain",
                        script.absoluteNonLin(value, 0.0, 1.0, 4.0));
    }
}

TerminalMix.pitchSlider = function (channel, control, value, status, group) {
    // invert pitch slider (down=faster) so it matches the labels on controller
    engine.setValue(group,"rate",-script.midiPitch(control, value, status));
}

TerminalMix.pitchRange = function (channel, control, value, status, group) {
    midi.sendShortMsg(status,control,value); // Make button light or extinguish
    if (value<=0) return;

    var set = false;
    // Round to two decimal places to avoid double-precision comparison problems
    var currentRange = Math.round(engine.getValue(group,"rateRange")*100)/100;
    var currentPitch = engine.getValue(group,"rate") * currentRange;
    var items = TerminalMix.pitchRanges.length;
    for(i=0; i<items; i++) {
        if (currentRange<TerminalMix.pitchRanges[i]) {
            engine.setValue(group,"rateRange",TerminalMix.pitchRanges[i]);
            engine.setValue(group,"rate",currentPitch/TerminalMix.pitchRanges[i]);
            set = true;
            break;
        }
    }

    if (!set && currentRange>=TerminalMix.pitchRanges[items-1]) {
        engine.setValue(group,"rateRange",TerminalMix.pitchRanges[0]);
        engine.setValue(group,"rate",currentPitch/TerminalMix.pitchRanges[0]);
    }
}

TerminalMix.tapButton = function (channel, control, value, status, group) {
    bpm.tapButton(channel+1)
}

TerminalMix.crossfaderCurve = function (channel, control, value, status, group) {
    script.crossfaderCurve(value);
}

TerminalMix.setBeatSize = function (channel, control, value, status, group) {
    if (value === 0x7F) {
        beatloop_size = engine.getValue(group, "beatloop_size")
        if (control === 0x2D) {
            if ( beatloop_size < 64 ) {
                engine.setValue(group, "beatloop_size", beatloop_size * 2)
            }
        } else if (control === 0x2C) {
            if ( beatloop_size > 0.03125 ) {
                engine.setValue(group, "beatloop_size", beatloop_size / 2)
            }
        }
    }
}

TerminalMix.setBeatjumpSize = function (channel, control, value, status, group) {
    if (value === 0x7F) {
        beatloop_size = engine.getValue(group, "beatjump_size")
        if (control === 0x6B) {
            if ( beatloop_size < 64 ) {
                engine.setValue(group, "beatjump_size", beatloop_size * 2)
            }
        } else if (control === 0x6F) {
            if ( beatloop_size > 0.03125 ) {
                engine.setValue(group, "beatjump_size", beatloop_size / 2)
            }
        }
    }
}

TerminalMix.faderStart = function (channel, control, value, status, group) {
    if (value<=0) return;

    TerminalMix.faderStart[group]=!TerminalMix.faderStart[group];
}

TerminalMix.brake = function (channel, control, value, status, group) {
    // var1 Start brake effect on button press, don't care about button release.
    // Can be stopped by shortly tapping wheel (when it's in touch mode).
    if (value) {
        script.brake(channel, control, value, status, group);
    }
    // var2 Start brake effect on button press, stop on release.
    /*if (value) {
        script.brake(channel, control, value, status, group);
    }*/
}

TerminalMix.faderStartFlash = function () {
    TerminalMix.state["fStartFlash"]=!TerminalMix.state["fStartFlash"];

    var value, group;
    for (var i=1; i<=4; i++) { // 4 decks
        value = 0x00;
        group = "[Channel"+i+"]";
        if (TerminalMix.faderStart[group]) {
            if (TerminalMix.state["fStartFlash"]) value = 0x7F;
        } else {
            if (engine.getValue(group,"duration")>0) value = 0x7F;
        }
        // Don't send redundant messages
        if (TerminalMix.state[group+"fStart"]==value) continue;
        TerminalMix.state[group+"fStart"] = value;
        if (engine.getValue(group,"duration")>0 || value<=0) midi.sendShortMsg(0x90+i-1,0x04,value);
        midi.sendShortMsg(0x90+i-1,0x05,value); // Shifted
    }
}

// NOTE: Not mapped
// No idea how the delete functions
TerminalMix.samplerPlayFlash = function () {
//     TerminalMix.state["sPlayFlash"]=!TerminalMix.state["sPlayFlash"];

//     var value, group;
//     for (var i=1; i<=4; i++) { // 4 samplers
//         value = 0x00;
//         group = "[Sampler"+i+"]";
//         if (engine.getValue(group,"play")>0) {
//             if (TerminalMix.state["sPlayFlash"]) value = 0x7F;
//         } else {
//             if (engine.getValue(group,"duration")>0) value = 0x7F;
//         }
//         // Don't send redundant messages
//         if (TerminalMix.state[group+"sFlash"]==value) continue;
//         TerminalMix.state[group+"sFlash"] = value;
//         for (var j=1; j<=4; j++) {  // Same buttons on all 4 controller decks
//             midi.sendShortMsg(0x90+j-1,0x14+i-1,value);
//             midi.sendShortMsg(0x90+j-1,0x1C+i-1,value);  // Scissor on
//             // Shifted
//             midi.sendShortMsg(0x90+j-1,0x5A+i-1,value);
//             midi.sendShortMsg(0x90+j-1,0x62+i-1,value);  // Scissor on
//         }
//     }
}

// NOTE: Not mapped
// Don't know how the loop works
TerminalMix.activeLoopFlash = function () {
//     TerminalMix.state["loopFlash"]=!TerminalMix.state["loopFlash"];

//     var value, group;
//     for (var i=1; i<=4; i++) { // 4 decks
//         value = 0x00;
//         group = "[Channel"+i+"]";
//         if (engine.getValue(group,"loop_enabled")>0) {
//             if (TerminalMix.state["loopFlash"]) value = 0x7F;
//         }
//         // Don't send redundant messages
//         if (TerminalMix.state[group+"loop"]==value) continue;
//         TerminalMix.state[group+"loop"] = value;
//         midi.sendShortMsg(0x90+i-1,0x0C,value);
//         midi.sendShortMsg(0x90+i-1,0x0D,value);
//     }
}

TerminalMix.toggleMasterVuMeter = function (channel, control, value, status, group) {
    if (value == 0x7F) {
        // reset entire VU meter to 0 otherwise the last recorded
        // level will remain on screen
        TerminalMix.changeVuMeterMaster(0.0);
        // flip toggle
        TerminalMix.showMasterVuMeter = !TerminalMix.showMasterVuMeter;
        // light Area and View buttons to indicate toggle (Master/Decks)
        var lightToggle = 0x7F * TerminalMix.showMasterVuMeter;
        midi.sendShortMsg(0x90, 0x24, lightToggle);
        midi.sendShortMsg(0x90, 0x25, lightToggle);
    }
}

TerminalMix.changeVuMeter = function (value, channel) {
    var volume = Math.round(value * 10)
    midi.sendShortMsg(channel, 0x01, volume);
}

TerminalMix.changeVuMeterMaster = function (value) {
    if (TerminalMix.showMasterVuMeter) {
        TerminalMix.changeVuMeter(value, 0xB0);
        TerminalMix.changeVuMeter(value, 0xB1);
        TerminalMix.changeVuMeter(value, 0xB2);
        TerminalMix.changeVuMeter(value, 0xB3);
    }
}

TerminalMix.changeVuMeterL1 = function (value) {
    if (!TerminalMix.showMasterVuMeter) {
        TerminalMix.changeVuMeter(value, 0xB0);
    }
}
TerminalMix.changeVuMeterL3 = function (value) {
    if (!TerminalMix.showMasterVuMeter) {
        TerminalMix.changeVuMeter(value, 0xB2);
    }
}
TerminalMix.changeVuMeterR2 = function (value) {
    if (!TerminalMix.showMasterVuMeter) {
        TerminalMix.changeVuMeter(value, 0xB1);
    }
}
TerminalMix.changeVuMeterR4 = function (value) {
    if (!TerminalMix.showMasterVuMeter) {
        TerminalMix.changeVuMeter(value, 0xB3);
    }
}

TerminalMix.channelFader = function (channel, control, value, status, group) {
    engine.setValue(group,"volume",script.absoluteLin(value,0,1));

    // Fader start logic
    if (!TerminalMix.faderStart[group]) return;
    if (TerminalMix.lastFader[group]==value) return;

    if (value==0 && engine.getValue(group,"play")==1) {
        script.triggerControl(group,"cue_default",100);
    }
    if (TerminalMix.lastFader[group]==0) engine.setValue(group,"play",1);

    TerminalMix.lastFader[group]=value;
}


TerminalMix.crossFader = function (channel, control, value, status, group) {
    var cfValue = script.absoluteNonLin(value,-1,0,1);
    engine.setValue("[Master]","crossfader",cfValue);

    // Fader start logic
    if (TerminalMix.lastFader["crossfader"]==cfValue) return;

    var group;

    // If CF is now full left and decks assigned to R are playing, cue them
    if (cfValue==-1.0) {
        for (var i=engine.getValue("[App]", "num_decks"); i>=1; i--) {
            group = "[Channel"+i+"]";
            if (TerminalMix.faderStart[group]
                && engine.getValue(group,"orientation")==2
                && engine.getValue(group,"play")==1) {
                    script.triggerControl(group,"cue_default",100);
            }
        }
    }

    if (cfValue==1.0) {
        // If CF is now full right and decks assigned to L are playing, cue them
        for (var i=engine.getValue("[App]", "num_decks"); i>=1; i--) {
            group = "[Channel"+i+"]";
            if (TerminalMix.faderStart[group]
                && engine.getValue(group,"orientation")==0
                && engine.getValue(group,"play")==1) {
                    script.triggerControl(group,"cue_default",100);
            }
        }
    }

    // If the CF is moved from full left, start any decks assigned to R
    if (TerminalMix.lastFader["crossfader"]==-1.0) {
        for (var i=engine.getValue("[App]", "num_decks"); i>=1; i--) {
            group = "[Channel"+i+"]";
            if (TerminalMix.faderStart[group]
                && engine.getValue(group,"orientation")==2) {
                engine.setValue(group,"play",1);
            }
        }
    }

    if (TerminalMix.lastFader["crossfader"]==1.0) {
        // If the CF is moved from full right, start any decks assigned to L
        for (var i=engine.getValue("[App]", "num_decks"); i>=1; i--) {
            group = "[Channel"+i+"]";
            if (TerminalMix.faderStart[group]
                && engine.getValue(group,"orientation")==0) {
                engine.setValue(group,"play",1);
            }
        }
    }

    TerminalMix.lastFader["crossfader"] = cfValue;
}

// Move cursor vertically with Trax knob, scroll with Shift pressed
TerminalMix.traxKnobTurn = function (channel, control, value, status, group) {
  if (TerminalMix.shifted) {
      engine.setValue(group,"ScrollVertical", value-64);
    } else {
      engine.setValue(group,"MoveVertical", value-64);
    }
}

// Move focus right between tracks table and side panel.
// Shift moves the focus to the left. Right now there are only two possible
// focus regions (panel + tracks table) so left/right have the same result,
// but the redesigned Library yet to come may have more regions.
TerminalMix.backButton = function (channel, control, value, status, group) {
    if (value>0) {
      if (TerminalMix.shifted) {
      engine.setValue(group,"MoveFocus",-1);
    } else {
      engine.setValue(group,"MoveFocus",1);
    }
  }
}

// Left shift button
TerminalMix.shiftButtonL = function (channel, control, value, status, group) {
  if (value === 127) {
    TerminalMix.effectUnit13.shift();
    TerminalMix.effectUnit24.shift();
    TerminalMix.shifted = true;
    TerminalMix.shiftedL = true;
  } else {
    TerminalMix.effectUnit13.unshift();
    TerminalMix.effectUnit24.unshift();
    TerminalMix.shifted = false;
    TerminalMix.shiftedL = false;
  }
};
// Right shift button
TerminalMix.shiftButtonR = function (channel, control, value, status, group) {
  if (value === 127) {
    TerminalMix.effectUnit13.shift();
    TerminalMix.effectUnit24.shift();
    TerminalMix.shifted = true;
    TerminalMix.shiftedR = true;
  } else {
    TerminalMix.effectUnit13.unshift();
    TerminalMix.effectUnit24.unshift();
    TerminalMix.shifted = false;
    TerminalMix.shiftedR = false;
  }
}

// ----------- LED Output functions -------------

TerminalMix.tapLED = function (deck,value) {
    deck--;
    if (value>0) midi.sendShortMsg(0x90+deck,0x1E,0x7F);
    else midi.sendShortMsg(0x90+deck,0x1E,0);
}

TerminalMix.tapLEDL = function (value) {
    TerminalMix.tapLED(1,value);
}

TerminalMix.tapLEDR = function (value) {
    TerminalMix.tapLED(2,value);
}


// ----------- RGB Output functions -------------

TerminalMix.colorPad = function (value, channel, control, color) {
    // control == pad
    print("value="+value+" channel="+channel+" control="+control+" color="+color)
    _color = (value > 0) ? color : 0x00;
    midi.sendShortMsg(channel, control, _color)
}

TerminalMix.colorPadAllControls = function(value, channel, pad, colors) {
    colorMain = (value > 0) ? colors.main : 0x00;
    colorShift = (value > 0) ? colors.shift : 0x00;
    colorSecondary = (value > 0) ? colors.secondary : 0x00;
    colorSecondaryShift = (value > 0) ? colors.secondaryShift : 0x00;

    // color main button
    midi.sendShortMsg(channel, pad.main, colorMain);
    // color shifted button
    midi.sendShortMsg(channel, pad.shift, colorShift);
    // color secondary button
    midi.sendShortMsg(channel, pad.secondary, colorSecondary);
    // color shifted secondary button
    midi.sendShortMsg(channel, pad.secondaryShift, colorSecondaryShift);
}

TerminalMix.blinkPad = function(value, channel, control, color) {
    // control == pad
    var _id = TerminalMix.blinkingPads[channel][control].id;

    // if playing
    if (value > 0) {
        // if not blinking
        if (_id === 0) {
            var id = engine.beginTimer(500, function() {
                var isBlinking = TerminalMix.blinkingPads[channel][control].blinking;

                if (isBlinking === true) {
                    midi.sendShortMsg(channel, control, 0x00);
                    TerminalMix.blinkingPads[channel][control].blinking = false;
                } else {
                    midi.sendShortMsg(channel, control, color);
                    TerminalMix.blinkingPads[channel][control].blinking = true;
                }
            },
                                       false);
            // store id
            TerminalMix.blinkingPads[channel][control].id = id;
        } else {
            // if blinking then ignore
        }
    // if not playing
    } else {
        // if has id
        if (_id > 0) {
            // kill timer and reset everything
            engine.stopTimer(_id);
            TerminalMix.blinkingPads[channel][control].id = 0;
            TerminalMix.blinkingPads[channel][control].blinking = 0;
        }
        midi.sendShortMsg(channel, control, color);
    }
}

TerminalMix.blinkPadAllControls = function(value, channel, pad, colors) {
    var _id = TerminalMix.blinkingPads[channel][pad.main].id;

    // if playing
    if (value > 0) {
        // if not blinking
        if (_id === 0) {
            var id = engine.beginTimer(500, function() {

                var isBlinking = TerminalMix.blinkingPads[channel][pad.main].blinking;

                if (isBlinking === true) {
                    midi.sendShortMsg(channel, pad.main, 0x00);
                    midi.sendShortMsg(channel, pad.shift, 0x00);
                    midi.sendShortMsg(channel, pad.secondary, 0x00);
                    midi.sendShortMsg(channel, pad.secondaryShift, 0x00);

                    TerminalMix.blinkingPads[channel][pad.main].blinking = false;
                } else {
                    midi.sendShortMsg(channel, pad.main, colors.main);
                    midi.sendShortMsg(channel, pad.shift, colors.shift);
                    midi.sendShortMsg(channel, pad.secondary, colors.secondary);
                    midi.sendShortMsg(channel, pad.secondaryShift, colors.secondaryShift);

                    TerminalMix.blinkingPads[channel][pad.main].blinking = true;
                }

            },
                                       false);
            // store id
            TerminalMix.blinkingPads[channel][pad.main].id = id;
        } else {
            // if blinking then ignore
        }
    // if not playing
    } else {
        // if has id
        if (_id > 0) {
            // kill timer and reset everything
            engine.stopTimer(_id);
            TerminalMix.blinkingPads[channel][pad.main].id = 0;
            TerminalMix.blinkingPads[channel][pad.main].blinking = 0;

            // TerminalMix.colorPad(1, channel, pad, colors);
        }
    }
}

// ### CUE PADS ###
TerminalMix.colorPadAllControls_CueDeck1Pad1 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad1, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad2 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad2, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad3 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad3, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad4 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad4, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad5 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad5, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad6 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad6, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad7 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad7, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck1Pad8 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.cueMode.pad8, TerminalMix.padColors.cueMode) }

TerminalMix.colorPadAllControls_CueDeck2Pad1 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad1, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad2 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad2, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad3 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad3, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad4 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad4, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad5 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad5, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad6 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad6, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad7 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad7, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck2Pad8 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.cueMode.pad8, TerminalMix.padColors.cueMode) }

TerminalMix.colorPadAllControls_CueDeck3Pad1 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad1, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad2 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad2, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad3 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad3, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad4 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad4, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad5 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad5, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad6 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad6, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad7 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad7, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck3Pad8 = function (value) { TerminalMix.colorPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.cueMode.pad8, TerminalMix.padColors.cueMode) }

TerminalMix.colorPadAllControls_CueDeck4Pad1 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad1, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad2 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad2, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad3 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad3, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad4 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad4, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad5 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad5, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad6 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad6, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad7 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad7, TerminalMix.padColors.cueMode) }
TerminalMix.colorPadAllControls_CueDeck4Pad8 = function (value) { TerminalMix.colorPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.cueMode.pad8, TerminalMix.padColors.cueMode) }

// ### SAMPLE PADS ###
// # Color
TerminalMix.colorPadAllControls_SampleDeck1Pad1 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad2 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad3 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad4 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad5 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad6 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad7 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck1Pad8 = function (value) { TerminalMix.colorPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode) }

TerminalMix.colorPadAllControls_SampleDeck2Pad1 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad2 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad3 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad4 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad5 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad6 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad7 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode) }
TerminalMix.colorPadAllControls_SampleDeck2Pad8 = function (value) { TerminalMix.colorPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode); TerminalMix.colorPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode) }


// # Blink
TerminalMix.blinkPadAllControls_SampleDeck1Pad1 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad2 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad3 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad4 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad5 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad6 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad7 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode);}
TerminalMix.blinkPadAllControls_SampleDeck1Pad8 = function (value) {TerminalMix.blinkPadAllControls(value, 0x94, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x96, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode);}

TerminalMix.blinkPadAllControls_SampleDeck2Pad1 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad1, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad2 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad2, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad3 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad3, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad4 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad4, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad5 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad5, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad6 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad6, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad7 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad7, TerminalMix.padColors.sampleMode); }
TerminalMix.blinkPadAllControls_SampleDeck2Pad8 = function (value) { TerminalMix.blinkPadAllControls(value, 0x95, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode); TerminalMix.blinkPadAllControls(value, 0x97, TerminalMix.performancePadsButtonDefinitions.sampleMode.pad8, TerminalMix.padColors.sampleMode); }

// ### LOOP PADS ###
// Manual loop
TerminalMix.blinkPad_LoopDeck1Pad1 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad2 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad2.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad3 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad3.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad4 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad5 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad5.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad6 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad6.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad7 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad7.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Pad8 = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck1Reloop = function (value) {TerminalMix.blinkPad(value, 0x94, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.secondary, TerminalMix.padColors.loopMode.secondary)}

TerminalMix.blinkPad_LoopDeck2Pad1 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad2 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad2.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad3 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad3.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad4 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad5 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad5.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad6 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad6.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad7 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad7.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Pad8 = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck2Reloop = function (value) {TerminalMix.blinkPad(value, 0x95, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.secondary, TerminalMix.padColors.loopMode.secondary)}

TerminalMix.blinkPad_LoopDeck3Pad1 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad2 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad2.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad3 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad3.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad4 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad5 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad5.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad6 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad6.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad7 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad7.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Pad8 = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck3Reloop = function (value) {TerminalMix.blinkPad(value, 0x96, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.secondary, TerminalMix.padColors.loopMode.secondary)}

TerminalMix.blinkPad_LoopDeck4Pad1 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad2 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad2.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad3 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad3.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad4 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad4.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad5 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad5.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad6 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad6.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad7 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad7.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Pad8 = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad8.main, TerminalMix.padColors.loopMode.main)}
TerminalMix.blinkPad_LoopDeck4Reloop = function (value) {TerminalMix.blinkPad(value, 0x97, TerminalMix.performancePadsButtonDefinitions.loopMode.pad1.secondary, TerminalMix.padColors.loopMode.secondary)}
