from Crypto.Hash import SHA256


def sha256_bytes(data: bytes) -> bytes:
    h = SHA256.new()
    h.update(data)
    return h.digest()

