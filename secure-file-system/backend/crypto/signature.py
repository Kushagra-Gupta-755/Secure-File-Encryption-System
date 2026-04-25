from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15


def sign_digest(digest: bytes, private_key: RSA.RsaKey) -> bytes:
    # This "hash of hash" pattern matches the earlier implementation style
    # and is consistent for sign/verify inside this project.
    h = SHA256.new(digest)
    return pkcs1_15.new(private_key).sign(h)


def verify_digest_signature(digest: bytes, signature: bytes, public_key: RSA.RsaKey) -> bool:
    h = SHA256.new(digest)
    try:
        pkcs1_15.new(public_key).verify(h, signature)
        return True
    except (ValueError, TypeError):
        return False

