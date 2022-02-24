//import { petsciiLower2Str } from "./adf/PETSCII.mjs"

var textDecoder = new TextDecoder();
var textEncoder = new TextEncoder();

var SIGNATURE_CHIP = 0x43484950;

export function Cartridge(buffer) {
    if (buffer) {
        var byteLength = buffer.byteLength;
        if (byteLength < 64) {
            throw new TypeError("CRT file too small");
        }
        var dv = new DataView(buffer);
        for (var signatureLength = 15; (signatureLength >= 0) && (dv.getUint8(signatureLength) === 32); --signatureLength);
        this.signature = textDecoder.decode(new Uint8Array(buffer, 0, signatureLength + 1));
        this.version = dv.getUint16(20);
        this.hardware = dv.getUint16(22);
        this.exrom = dv.getUint8(24);
        this.game = dv.getUint8(25);
        this.revision = dv.getUint8(26);
        for (var nameLength = 0; (nameLength < 32) && dv.getUint8(32 + nameLength); ++nameLength);
        this.name = textDecoder.decode(new Uint8Array(buffer, 32, nameLength));
        var chip = this.chip = [];
        var byteOffset = 64;
        var bytesAvailable = byteLength - byteOffset;
        while (bytesAvailable > 0) {
            if (bytesAvailable < 16) {
                throw new TypeError("CRT file too small");
            }
            var signature = dv.getUint32(byteOffset);
            if (signature !== SIGNATURE_CHIP) {
                throw new TypeError("Invalid CRT file");
            }
            var total = dv.getUint32(byteOffset + 4);
            if (total > bytesAvailable) {
                throw new TypeError("CRT file too small");
            }
            var type = dv.getUint16(byteOffset + 8);
            var bank = dv.getUint16(byteOffset + 10);
            var address = dv.getUint16(byteOffset + 12);
            var size = dv.getUint16(byteOffset + 14);
            if (size + 16 > total) {
                throw new TypeError("CRT file too small");
            }
            var data = new Uint8Array(buffer, byteOffset + 16, size);
            chip.push(new Chip(type, bank, address, data));
            byteOffset += total;
            bytesAvailable -= total;
        }
    }
    else {
        this.signature = null;
        this.version = 0;
        this.hardware = 0;
        this.exrom = 0;
        this.game = 0;
        this.revision = 0;
        this.name = null;
        this.chip = [];
    }
}

var hardware2string = [
    /*  0 */ "generic cartridge",
    /*  1 */ "Action Replay",
    /*  2 */ "KCS Power Cartridge",
    /*  3 */ "Final Cartridge III",
    /*  4 */ "Simons' BASIC",
    /*  5 */ "Ocean type 1*",
    /*  6 */ "Expert Cartridge",
    /*  7 */ "Fun Play, Power Play",
    /*  8 */ "Super Games",
    /*  9 */ "Atomic Power",
    /* 10 */ "Epyx Fastload",
    /* 11 */ "Westermann Learning",
    /* 12 */ "Rex Utility",
    /* 13 */ "Final Cartridge I",
    /* 14 */ "Magic Formel",
    /* 15 */ "C64 Game System, System 3",
    /* 16 */ "Warp Speed",
    /* 17 */ "Dinamic**",
    /* 18 */ "Zaxxon, Super Zaxxon (SEGA)",
    /* 19 */ "Magic Desk, Domark, HES Australia",
    /* 20 */ "Super Snapshot V5",
    /* 21 */ "Comal-80",
    /* 22 */ "Structured BASIC",
    /* 23 */ "Ross",
    /* 24 */ "Dela EP64",
    /* 25 */ "Dela EP7x8",
    /* 26 */ "Dela EP256",
    /* 27 */ "Rex EP256",
    /* 28 */ "Mikro Assembler",
    /* 29 */ "Final Cartridge Plus",
    /* 30 */ "Action Replay 4",
    /* 31 */ "Stardos",
    /* 32 */ "EasyFlash",
    /* 33 */ "EasyFlash Xbank",
    /* 34 */ "Capture",
    /* 35 */ "Action Replay 3",
    /* 36 */ "Retro Replay (Subtype 1: Nordic Replay)",
    /* 37 */ "MMC64",
    /* 38 */ "MMC Replay",
    /* 39 */ "IDE64",
    /* 40 */ "Super Snapshot V4",
    /* 41 */ "IEEE-488",
    /* 42 */ "Game Killer",
    /* 43 */ "Prophet64",
    /* 44 */ "EXOS",
    /* 45 */ "Freeze Frame",
    /* 46 */ "Freeze Machine",
    /* 47 */ "Snapshot64",
    /* 48 */ "Super Explode V5.0",
    /* 49 */ "Magic Voice",
    /* 50 */ "Action Replay 2",
    /* 51 */ "MACH 5",
    /* 52 */ "Diashow-Maker",
    /* 53 */ "Pagefox",
    /* 54 */ "Kingsoft",
    /* 55 */ "Silverrock 128K Cartridge",
    /* 56 */ "Formel 64",
    /* 57 */ "RGCD (Subtype 1: Hucky)",
    /* 58 */ "RR-Net MK",
    /* 59 */ "EasyCalc",
    /* 60 */ "GMod2",
    /* 61 */ "MAX Basic",
    /* 62 */ "GMod3",
    /* 63 */ "ZIPP-CODE 48",
    /* 64 */ "Blackbox V8",
    /* 65 */ "Blackbox V3",
    /* 66 */ "Blackbox V4",
    /* 67 */ "REX RAM-Floppy",
    /* 68 */ "BIS-Plus",
    /* 69 */ "SD-BOX",
    /* 70 */ "MultiMAX",
    /* 71 */ "Blackbox V9",
    /* 72 */ "Lt. Kernal Host Adaptor",
    /* 73 */ "RAMLink",
    /* 74 */ "H.E.R.O.",
    /* 75 */ "IEEE Flash! 64",
    /* 76 */ "Turtle Graphics II",
    /* 77 */ "Freeze Frame MK2"
];

function Chip(type, bank, address, data) {
    this.type = type;
    this.bank = bank;
    this.address = address;
    this.data = data;
}

function Chip_isEmpty() {
    var data = this.data;
    var dataLength = data.length;
    for (var i = 0; i < dataLength; ++i) {
        if (data[i] !== 0xff) {
            return false;
        }
    }
    return true;
}

function Chip_equals(other) {
    if ((this.type !== other.type) ||
        (this.bank !== other.bank) ||
        (this.address !== other.address)) {
        return false;
    }
    var data = this.data, otherData = other.data;
    var dataLength = data.length;
    if (dataLength !== otherData.length) {
        return false;
    }
    for (var i = 0; i < dataLength; ++i) {
        if (data[i] !== otherData[i]) {
            return false;
        }
    }
    return true;
}

Object.defineProperties(Chip, {
    TYPE_ROM: { value: 0 },
    TYPE_RAM: { value: 1 },
    TYPE_FLASH: { value: 2 },
    TYPE_EEPROM: { value: 3 }
});

Object.defineProperties(Chip.prototype, {
    isEmpty: { value: Chip_isEmpty },
    equals: { value: Chip_equals }
});

Object.defineProperties(Cartridge, {
    hardware2string: { value: hardware2string },

    C64_CARTRIDGE:   { value: "C64 CARTRIDGE"   },
    C128_CARTRIDGE:  { value: "C128 CARTRIDGE"  },
    CBM2_CARTRIDGE:  { value: "CBM2 CARTRIDGE"  },
    VIC20_CARTRIDGE: { value: "VIC20 CARTRIDGE" },
    PLUS4_CARTRIDGE: { value: "PLUS4 CARTRIDGE" },

    VERSION_1_0: { value: 0x0100 },
    VERSION_1_1: { value: 0x0101 },
    VERSION_2_0: { value: 0x0200 },

    CARTRIDGE_GENERIC:            { value:  0 },
    CARTRIDGE_ACTION_REPLAY:      { value:  1 },
    CARTRIDGE_KCS_POWER:          { value:  2 },
    CARTRIDGE_FINAL_III:          { value:  3 },
    CARTRIDGE_SIMONS_BASIC:       { value:  4 },
    CARTRIDGE_OCEAN:              { value:  5 },
    CARTRIDGE_EXPERT:             { value:  6 },
    CARTRIDGE_FUNPLAY:            { value:  7 },
    CARTRIDGE_SUPER_GAMES:        { value:  8 },
    CARTRIDGE_ATOMIC_POWER:       { value:  9 },
    CARTRIDGE_EPYX_FASTLOAD:      { value: 10 },
    CARTRIDGE_WESTERMANN:         { value: 11 },
    CARTRIDGE_REX:                { value: 12 },
    CARTRIDGE_FINAL_I:            { value: 13 },
    CARTRIDGE_MAGIC_FORMEL:       { value: 14 },
    CARTRIDGE_GS:                 { value: 15 },
    CARTRIDGE_WARPSPEED:          { value: 16 },
    CARTRIDGE_DINAMIC:            { value: 17 },
    CARTRIDGE_ZAXXON:             { value: 18 },
    CARTRIDGE_MAGIC_DESK:         { value: 19 },
    CARTRIDGE_SUPER_SNAPSHOT_V5:  { value: 20 },
    CARTRIDGE_COMAL80:            { value: 21 },
    CARTRIDGE_STRUCTURED_BASIC:   { value: 22 },
    CARTRIDGE_ROSS:               { value: 23 },
    CARTRIDGE_DELA_EP64:          { value: 24 },
    CARTRIDGE_DELA_EP7x8:         { value: 25 },
    CARTRIDGE_DELA_EP256:         { value: 26 },
    CARTRIDGE_REX_EP256:          { value: 27 },
    CARTRIDGE_MIKRO_ASSEMBLER:    { value: 28 },
    CARTRIDGE_FINAL_PLUS:         { value: 29 },
    CARTRIDGE_ACTION_REPLAY4:     { value: 30 },
    CARTRIDGE_STARDOS:            { value: 31 },
    CARTRIDGE_EASYFLASH:          { value: 32 },
    CARTRIDGE_EASYFLASH_XBANK:    { value: 33 },
    CARTRIDGE_CAPTURE:            { value: 34 },
    CARTRIDGE_ACTION_REPLAY3:     { value: 35 },
    CARTRIDGE_RETRO_REPLAY:       { value: 36 },
    CARTRIDGE_MMC64:              { value: 37 },
    CARTRIDGE_MMC_REPLAY:         { value: 38 },
    CARTRIDGE_IDE64:              { value: 39 },
    CARTRIDGE_SUPER_SNAPSHOT:     { value: 40 },
    CARTRIDGE_IEEE488:            { value: 41 },
    CARTRIDGE_GAME_KILLER:        { value: 42 },
    CARTRIDGE_P64:                { value: 43 },
    CARTRIDGE_EXOS:               { value: 44 },
    CARTRIDGE_FREEZE_FRAME:       { value: 45 },
    CARTRIDGE_FREEZE_MACHINE:     { value: 46 },
    CARTRIDGE_SNAPSHOT64:         { value: 47 },
    CARTRIDGE_SUPER_EXPLODE_V5:   { value: 48 },
    CARTRIDGE_MAGIC_VOICE:        { value: 49 },
    CARTRIDGE_ACTION_REPLAY2:     { value: 50 },
    CARTRIDGE_MACH5:              { value: 51 },
    CARTRIDGE_DIASHOW_MAKER:      { value: 52 },
    CARTRIDGE_PAGEFOX:            { value: 53 },
    CARTRIDGE_KINGSOFT:           { value: 54 },
    CARTRIDGE_SILVERROCK_128:     { value: 55 },
    CARTRIDGE_FORMEL64:           { value: 56 },
    CARTRIDGE_RGCD:               { value: 57 },
    CARTRIDGE_RRNETMK3:           { value: 58 },
    CARTRIDGE_EASYCALC:           { value: 59 },
    CARTRIDGE_GMOD2:              { value: 60 },
    CARTRIDGE_MAX_BASIC:          { value: 61 },
    CARTRIDGE_GMOD3:              { value: 62 },
    CARTRIDGE_ZIPPCODE48:         { value: 63 },
    CARTRIDGE_BLACKBOX8:          { value: 64 },
    CARTRIDGE_BLACKBOX3:          { value: 65 },
    CARTRIDGE_BLACKBOX4:          { value: 66 },
    CARTRIDGE_REX_RAMFLOPPY:      { value: 67 },
    CARTRIDGE_BISPLUS:            { value: 68 },
    CARTRIDGE_SDBOX:              { value: 69 },
    CARTRIDGE_MULTIMAX:           { value: 70 },
    CARTRIDGE_BLACKBOX9:          { value: 71 },
    CARTRIDGE_LT_KERNAL:          { value: 72 },
    CARTRIDGE_RAMLINK:            { value: 73 },
    CARTRIDGE_DREAN:              { value: 74 },
    CARTRIDGE_IEEEFLASH64:        { value: 75 },
    CARTRIDGE_TURTLE_GRAPHICS_II: { value: 76 },
    CARTRIDGE_FREEZE_FRAME_MK2:   { value: 77 },

    Chip: { value: Chip }
});

function Cartridge_arrayBuffer() {
    var byteLength = 64;
    var chip = this.chip;
    var chipLength = chip.length;
    for (var i = 0; i < chipLength; ++i) {
        byteLength += 16 + chip[i].data.length;
    }

    var result = new Uint8Array(byteLength);
    var dv = new DataView(result.buffer, result.byteOffset);

    var signature = textEncoder.encode(this.signature);
    var signatureLength = signature.length;
    for (var i = 0; (i < 16) && (i < signatureLength); ++i) {
        result[i] = signature[i];
    }
    for (; i < 16; ++i) {
        result[i] = 32;
    }
    dv.setUint32(16, 64);
    dv.setUint16(20, this.version);
    dv.setUint16(22, this.hardware);
    dv.setUint8(24, this.exrom);
    dv.setUint8(25, this.game);
    dv.setUint8(26, this.revision);
    var name = textEncoder.encode(this.name);
    var nameLength = name.length;
    for (var i = 0; (i < 32) && (i < nameLength); ++i) {
        result[32 + i] = name[i];
    }

    var byteOffset = 64;
    for (var i = 0; i < chipLength; ++i) {
        var chip_i = chip[i];
        var data = chip_i.data;
        var dataLength = data.length
        dv.setUint32(byteOffset, SIGNATURE_CHIP);
        var total = 16 + dataLength;
        dv.setUint32(byteOffset + 4, total);
        dv.setUint16(byteOffset + 8, chip_i.type);
        dv.setUint16(byteOffset + 10, chip_i.bank);
        dv.setUint16(byteOffset + 12, chip_i.address);
        dv.setUint16(byteOffset + 14, dataLength);
        result.set(data, byteOffset + 16);
        byteOffset += total;
    }

    return result.buffer;
}

function Cartridge_findChip(bank, address) {
    var chip = this.chip;
    var chipLength = chip.length;
    for (var i = 0; i < chipLength; ++i) {
        var chip_i = chip[i];
        if ((chip_i.bank === bank) && (chip_i.address === address)) {
            return chip_i;
        }
    }
    return null;
}

Object.defineProperties(Cartridge.prototype, {
    arrayBuffer: { value: Cartridge_arrayBuffer },
    findChip: { value: Cartridge_findChip }
});
