"""ELF64 page checks, including Android Studio's RELRO prefix/suffix rules.

Reference: platform/tools/base sdk-common/.../pagealign/PageAlignUtils.kt.
Only exact LOAD boundaries are accepted here; section-list equivalence is not
needed by our binaries and is deliberately not used as an additional exemption.
"""
import struct

PAGE = 16384

def check_elf64(data):
    if data[:6] != b'\x7fELF\x02\x01':
        raise ValueError('Expected little-endian ELF64')
    offset = struct.unpack_from('<Q', data, 32)[0]
    size, count = struct.unpack_from('<HH', data, 54)
    if size < 56:
        raise ValueError('Invalid program header size')
    headers = [struct.unpack_from('<IIQQQQQQ', data, offset+i*size) for i in range(count)]
    loads = sorted((h for h in headers if h[0] == 1), key=lambda h: h[3])
    errors = []
    if not loads:
        errors.append('ELF missing LOAD segments')
    for h in loads:
        if h[7] < PAGE or h[7] % PAGE:
            errors.append('LOAD alignment')
        if h[2] % PAGE != h[3] % PAGE:
            errors.append('LOAD offset')
    for h in (h for h in headers if h[0] == 0x6474e552):
        start, end = h[3], h[3]+h[6]
        index = next((i for i in range(len(loads)-1, -1, -1) if loads[i][3] <= start), None)
        if index is None:
            errors.append('RELRO missing containing LOAD')
            continue
        load = loads[index]
        next_start = loads[index+1][3] if index+1 < len(loads) else None
        if next_start is not None and end > next_start:
            errors.append('RELRO extends into next LOAD')
            continue
        if start % PAGE and start != load[3]:
            errors.append('RELRO start is neither aligned nor LOAD prefix')
        if end % PAGE and end != load[3]+load[6]:
            errors.append('RELRO end is neither aligned nor LOAD suffix')
    return errors
