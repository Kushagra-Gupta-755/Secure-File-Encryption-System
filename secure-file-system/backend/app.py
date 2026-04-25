import json
import os
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from crypto.aes import decrypt_bytes, encrypt_bytes, generate_aes_key
from crypto.hash import sha256_bytes
from crypto.rsa import decrypt_key, encrypt_key, ensure_keys, load_private_key, load_public_key
from crypto.signature import sign_digest, verify_digest_signature


BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
ENCRYPTED_DIR = BASE_DIR / "encrypted"
DECRYPTED_DIR = BASE_DIR / "decrypted"
KEYS_DIR = BASE_DIR / "keys"

PRIVATE_KEY_PATH = KEYS_DIR / "private.pem"
PUBLIC_KEY_PATH = KEYS_DIR / "public.pem"

DB_PATH = BASE_DIR / "file_index.json"

ALLOWED_EXTENSIONS = {
    "txt",
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "csv",
    "docx",
    "xlsx",
    "pptx",
    "zip",
    "rar",
    "7z",
    "mp3",
    "mp4",
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs() -> None:
    for d in (UPLOADS_DIR, ENCRYPTED_DIR, DECRYPTED_DIR, KEYS_DIR):
        d.mkdir(parents=True, exist_ok=True)


def init_crypto() -> None:
    ensure_dirs()
    ensure_keys(str(PRIVATE_KEY_PATH), str(PUBLIC_KEY_PATH))


def _load_db() -> dict:
    if not DB_PATH.exists():
        return {"files": {}}
    try:
        return json.loads(DB_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"files": {}}


def _save_db(db: dict) -> None:
    DB_PATH.write_text(json.dumps(db, indent=2), encoding="utf-8")


def allowed_file(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def file_size(path: Path) -> int:
    return path.stat().st_size


def hex_preview(b: bytes, head: int = 8, tail: int = 8) -> str:
    """
    Return a safe partial preview of sensitive bytes in hex.
    Example: abcd...1234
    """
    hx = b.hex()
    if len(hx) <= head + tail:
        return hx
    return f"{hx[:head]}...{hx[-tail:]}"


def related_paths(filename: str) -> dict:
    safe = secure_filename(filename)
    return {
        "upload": UPLOADS_DIR / safe,
        "enc": ENCRYPTED_DIR / f"{safe}.enc",
        "key": ENCRYPTED_DIR / f"{safe}.key",
        "hash": ENCRYPTED_DIR / f"{safe}.hash",
        "sig": ENCRYPTED_DIR / f"{safe}.sig",
        "dec": DECRYPTED_DIR / safe,
    }


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25MB


@app.get("/api/files")
def list_files():
    db = _load_db()
    files = list(db.get("files", {}).values())
    files.sort(key=lambda x: x.get("uploaded_at", ""), reverse=True)
    return jsonify({"success": True, "files": files})


@app.post("/api/upload")
def upload():
    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file part provided."}), 400
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"success": False, "message": "No file selected."}), 400

    raw_name = f.filename
    filename = secure_filename(raw_name)
    if not filename:
        return jsonify({"success": False, "message": "Invalid filename."}), 400
    if not allowed_file(filename):
        return jsonify({"success": False, "message": "File type not allowed."}), 400

    paths = related_paths(filename)
    f.save(paths["upload"])

    db = _load_db()
    db["files"][filename] = {
        "filename": filename,
        "size": file_size(paths["upload"]),
        "uploaded_at": utc_now_iso(),
        "status": "Uploaded",
        "integrity_verified": False,
        "signature_verified": False,
        "encrypted_artifacts": False,
        "decrypted_ready": False,
    }
    _save_db(db)

    return jsonify({"success": True, "message": "File uploaded.", "file": db["files"][filename]})


@app.post("/api/encrypt/<path:filename>")
def encrypt(filename: str):
    filename = secure_filename(filename)
    paths = related_paths(filename)
    if not paths["upload"].exists():
        return jsonify({"success": False, "message": "Uploaded file not found."}), 404

    try:
        plaintext = paths["upload"].read_bytes()

        aes_key = generate_aes_key()
        enc_blob = encrypt_bytes(plaintext, aes_key)  # IV + ciphertext
        paths["enc"].write_bytes(enc_blob)

        public_key = load_public_key(str(PUBLIC_KEY_PATH))
        enc_key = encrypt_key(aes_key, public_key)
        paths["key"].write_bytes(enc_key)

        digest = sha256_bytes(enc_blob)
        paths["hash"].write_bytes(digest)

        private_key = load_private_key(str(PRIVATE_KEY_PATH))
        sig = sign_digest(digest, private_key)
        paths["sig"].write_bytes(sig)

        # Delete plaintext upload immediately after encryption
        try:
            paths["upload"].unlink(missing_ok=True)
        except TypeError:
            if paths["upload"].exists():
                paths["upload"].unlink()

        db = _load_db()
        meta = db.get("files", {}).get(filename)
        if meta:
            meta["status"] = "Encrypted"
            meta["encrypted_artifacts"] = True
            meta["integrity_verified"] = True
            meta["signature_verified"] = True
            meta["encrypted_at"] = utc_now_iso()
            _save_db(db)

        return jsonify(
            {
                "success": True,
                "message": "Encrypted successfully. Integrity hash and signature generated.",
                "filename": filename,
                "previews": {
                    "aes_key_hex": hex_preview(aes_key),
                    "rsa_encrypted_aes_key_hex": hex_preview(enc_key),
                    "sha256_hex": hex_preview(digest, head=12, tail=12),
                    "signature_hex": hex_preview(sig),
                },
            }
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "message": f"Encryption failed: {exc}"}), 500


@app.post("/api/decrypt/<path:filename>")
def decrypt(filename: str):
    filename = secure_filename(filename)
    paths = related_paths(filename)

    if not (paths["enc"].exists() and paths["key"].exists() and paths["hash"].exists() and paths["sig"].exists()):
        return jsonify({"success": False, "message": "Encrypted artifacts missing. Encrypt first."}), 400

    try:
        enc_blob = paths["enc"].read_bytes()
        stored_digest = paths["hash"].read_bytes()
        signature = paths["sig"].read_bytes()

        current_digest = sha256_bytes(enc_blob)
        if stored_digest != current_digest:
            return jsonify({"success": False, "message": "Integrity verification failed."}), 400

        public_key = load_public_key(str(PUBLIC_KEY_PATH))
        if not verify_digest_signature(stored_digest, signature, public_key):
            return jsonify({"success": False, "message": "Digital signature verification failed."}), 400

        private_key = load_private_key(str(PRIVATE_KEY_PATH))
        enc_key = paths["key"].read_bytes()
        try:
            aes_key = decrypt_key(enc_key, private_key)
        except ValueError:
            return jsonify({"success": False, "message": "Wrong private key or corrupted key file."}), 400

        plaintext = decrypt_bytes(enc_blob, aes_key)
        paths["dec"].write_bytes(plaintext)

        db = _load_db()
        meta = db.get("files", {}).get(filename)
        if meta:
            meta["status"] = "Decrypted"
            meta["integrity_verified"] = True
            meta["signature_verified"] = True
            meta["decrypted_ready"] = True
            meta["decrypted_at"] = utc_now_iso()
            _save_db(db)

        return jsonify(
            {
                "success": True,
                "message": "Decrypted successfully. Integrity and signature verified.",
                "filename": filename,
                "verified": {"integrity": True, "signature": True},
                "previews": {
                    "aes_key_hex": hex_preview(aes_key),
                    "sha256_hex": hex_preview(stored_digest, head=12, tail=12),
                },
            }
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "message": f"Decryption failed: {exc}"}), 500


@app.get("/api/download/<path:filename>")
def download(filename: str):
    filename = secure_filename(filename)
    kind = request.args.get("kind", "decrypted")  # "encrypted" | "decrypted"

    paths = related_paths(filename)

    if kind == "encrypted":
        if not paths["enc"].exists():
            return jsonify({"success": False, "message": "Encrypted file not found."}), 404
        return send_from_directory(str(ENCRYPTED_DIR), f"{filename}.enc", as_attachment=True)

    # default: decrypted
    if not paths["dec"].exists():
        return jsonify({"success": False, "message": "Decrypted file not found. Decrypt first."}), 404
    return send_from_directory(str(DECRYPTED_DIR), filename, as_attachment=True)


@app.delete("/api/delete/<path:filename>")
def delete(filename: str):
    filename = secure_filename(filename)
    paths = related_paths(filename)

    deleted_any = False
    for k in ("upload", "enc", "key", "hash", "sig", "dec"):
        p = paths[k]
        if p.exists():
            try:
                p.unlink()
            except OSError:
                pass
            else:
                deleted_any = True

    db = _load_db()
    if filename in db.get("files", {}):
        db["files"].pop(filename, None)
        _save_db(db)

    if not deleted_any:
        return jsonify({"success": False, "message": "Nothing to delete (file not found)."}), 404

    return jsonify({"success": True, "message": "Deleted stored files and metadata.", "filename": filename})


@app.get("/api/health")
def health():
    return jsonify({"success": True, "message": "OK"})


if __name__ == "__main__":
    init_crypto()
    app.run(host="127.0.0.1", port=5000, debug=True)

