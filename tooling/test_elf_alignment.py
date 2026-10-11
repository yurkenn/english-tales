import struct
import unittest
from elf_alignment import check_elf64

def elf(loads, relro):
    headers = [(1,6,addr % 16384,addr,addr,mem,mem,align) for addr,mem,align in loads]
    headers.append((0x6474e552,4,0,relro[0],relro[0],relro[1],relro[1],1))
    data = bytearray(64 + 56*len(headers))
    data[:6] = b'\x7fELF\x02\x01'
    struct.pack_into('<Q',data,32,64)
    struct.pack_into('<HH',data,54,56,len(headers))
    for index,h in enumerate(headers):
        struct.pack_into('<IIQQQQQQ',data,64+56*index,*h)
    return data

class AlignmentTest(unittest.TestCase):
    def test_complete_unaligned_load_is_valid(self):
        self.assertEqual([],check_elf64(elf([(0x5b40,0x4c0,16384),(0x9ed8,0x10,16384)],(0x5b40,0x4c0))))
    def test_unaligned_end_inside_writable_load_fails(self):
        self.assertTrue(check_elf64(elf([(0x5b40,0x14c0,16384)],(0x5b40,0x4c0))))
    def test_middle_start_fails(self):
        self.assertTrue(check_elf64(elf([(0x4000,0x4000,16384)],(0x5000,0x3000))))
    def test_aligned_partial_region_passes(self):
        self.assertEqual([],check_elf64(elf([(0x4000,0x8000,16384)],(0x4000,0x4000))))
    def test_relro_crossing_next_load_fails(self):
        self.assertTrue(check_elf64(elf([(0x4000,0x4000,16384),(0x8000,0x4000,16384)],(0x4000,0x8000))))
    def test_four_kb_load_fails(self):
        self.assertTrue(check_elf64(elf([(0x4000,0x4000,4096)],(0x4000,0x4000))))

if __name__ == '__main__': unittest.main()
