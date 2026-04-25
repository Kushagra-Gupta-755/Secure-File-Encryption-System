from pathlib import Path

from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA


def ensure_keys(private_key_path: str, public_key_path: str, key_size: int = 2048) -> None:
    priv = Path(private_key_path)
    pub = Path(public_key_path)
    if priv.exists() and pub.exists():
        return
    priv.parent.mkdir(parents=True, exist_ok=True)
    key = RSA.generate(key_size)
    priv.write_bytes(key.export_key("PEM"))
    pub.write_bytes(key.publickey().export_key("PEM"))


def load_private_key(path: str) -> RSA.RsaKey:
    return RSA.import_key(Path(path).read_bytes())


def load_public_key(path: str) -> RSA.RsaKey:
    return RSA.import_key(Path(path).read_bytes())


def encrypt_key(aes_key: bytes, public_key: RSA.RsaKey) -> bytes:
    return PKCS1_OAEP.new(public_key).encrypt(aes_key)


def decrypt_key(enc_key: bytes, private_key: RSA.RsaKey) -> bytes:
    return PKCS1_OAEP.new(private_key).decrypt(enc_key)

