from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes


BLOCK_SIZE = 16


def generate_aes_key() -> bytes:
    return get_random_bytes(32)  # 256-bit


def _pkcs7_pad(data: bytes) -> bytes:
    padding_len = BLOCK_SIZE - (len(data) % BLOCK_SIZE)
    return data + bytes([padding_len] * padding_len)


def _pkcs7_unpad(data: bytes) -> bytes:
    if not data:
        raise ValueError("Invalid padding")
    padding_len = data[-1]
    if padding_len < 1 or padding_len > BLOCK_SIZE:
        raise ValueError("Invalid padding")
    if data[-padding_len:] != bytes([padding_len] * padding_len):
        raise ValueError("Invalid padding")
    return data[:-padding_len]


def encrypt_bytes(plaintext: bytes, key: bytes) -> bytes:
    iv = get_random_bytes(BLOCK_SIZE)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(_pkcs7_pad(plaintext))
    return iv + ciphertext  # prefix IV


def decrypt_bytes(iv_and_ciphertext: bytes, key: bytes) -> bytes:
    if len(iv_and_ciphertext) < BLOCK_SIZE:
        raise ValueError("Ciphertext too short")
    iv = iv_and_ciphertext[:BLOCK_SIZE]
    ciphertext = iv_and_ciphertext[BLOCK_SIZE:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded = cipher.decrypt(ciphertext)
    return _pkcs7_unpad(padded)

