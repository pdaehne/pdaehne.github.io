import { petsciiLower2Str } from "./PETSCII.mjs"

export function EasyFS(cartridge) {
    this.cartridge = cartridge;
    var entries = this.entries = [];
    var chip = cartridge.findChip(0, 0xa000);
//console.log(chip);
    var data = chip.data;
    var byteOffset = 0;
    for (var i = 0; i < 256; ++i) {
        var flag = data[byteOffset + 16];
        var type = flag & 0x1f;
        if (type === 0x1f) {
            break;
        }
        if (type === 0x00) {
            //console.log('!!!');
            continue;
        }
        var name = petsciiLower2Str(new Uint8Array(data.buffer, data.byteOffset + byteOffset, 16));
        var bank = data[byteOffset + 17];
        var bankHigh = data[byteOffset + 18];
        var offset = data[byteOffset + 19] | (data[byteOffset + 20] << 8);
        var size = data[byteOffset + 21] | (data[byteOffset + 22] << 8) | (data[byteOffset + 23] << 16);
        var entryData = new Uint8Array(size);
        switch (type) {
            case 0x01: // Normal PRG file with 2 bytes start address
                var currentBank = bank;
                var srcOffset = offset, dstOffset = 0;
                while (size > 0) {
                    var chip = cartridge.findChip(currentBank, srcOffset < 0x2000 ? 0x8000 : 0xa000);
                    var srcData = chip.data;
                    var byteLength = Math.min((srcOffset | 0x1fff) - srcOffset + 1, size);
                    entryData.set(new Uint8Array(srcData.buffer, srcData.byteOffset + (srcOffset < 0x2000 ? srcOffset : srcOffset - 0x2000), byteLength), dstOffset);
                    srcOffset += byteLength;
                    if (srcOffset >= 0x4000) {
                        srcOffset = 0;
                        ++currentBank;
                    }
                    dstOffset += byteLength;
                    size -= byteLength;
                }
                break;
            case 0x02: // Normal PRG file with 2 bytes start address, only ROML used
            case 0x03: // Normal PRG file with 2 bytes start address, only ROMH used
            case 0x10: // Normal 8 KiB cartridge ($8000..$9FFF)
            case 0x11: // Normal 16 KiB cartridge ($8000..$9FFF, $A000..$BFFF)
            case 0x12: // Normal Ultimax cartridge ($8000..$9FFF, $E000..$FFFF)
            case 0x13: // Normal Ultimax cartridge, ROML not used ($E000..$FFFF)
            case 0x14: // Ocean Type 1, 512 KiB3
            case 0x15: // Ocean Type 1, 16 KiB to 256 KiB (alternating banks)
            case 0x1C: // xbank, start in 8 KiB mode, any size
            case 0x1D: // xbank, start in 16 KiB mode, any size
            case 0x1E: // xbank, start in Ultimax mode, any size
                break;
        }
        entries.push({
            name,
            flag,
            //bank,
            //bankHigh,
            //offset,
            //size
            data: entryData
        });
        //console.log("name = \"" + name + "\"");
        //console.log("flag = 0x" + flag.toString(16));
        //console.log("bank = " + bank);
        //console.log("bankHigh = " + bankHigh);
        //console.log("offset = " + offset);
        //console.log("size = " + size);
        byteOffset += 24;
    }
    console.log(entries);
}
