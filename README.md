# Secure File Encryption System using Hybrid Cryptography

Modern full-stack **Secure File Encryption System** built with:

- **Frontend**: React + Tailwind CSS (Vite)
- **Backend**: Python Flask
- **Cryptography**: AES-256-CBC + RSA-2048 + SHA-256 + RSA signatures (PKCS#1 v1.5)
- **Storage**: Local filesystem (server-side)

This rebuild takes inspiration from the original “File-Encryption-System” workflow (hybrid encryption), but **removes**:

- Java Swing GUI
- MySQL login/signup/auth system

No login is required. Open the website and encrypt/decrypt files immediately.

---

## Features

- Upload file (drag & drop)
- Encrypt using **AES-256-CBC**
- Encrypt AES key with **RSA-2048 public key**
- Compute **SHA-256** for integrity
- Generate **RSA PKCS#1 v1.5 digital signature** (private key)
- Verify integrity + signature before decrypt
- Download encrypted file (`.enc`)
- Decrypt file and download plaintext
- Delete stored artifacts (encrypted/keys/hash/signature/decrypted)

Security rules implemented:
- RSA key pair auto-generated on backend startup (if missing)
- Random IV for every encryption (stored as prefix in ciphertext blob)
- Plaintext upload deleted immediately after successful encryption
- Safe filenames (`secure_filename`)
- Max upload size enforced (25MB)
- File type validation (common formats only; configurable)

---

## Architecture

```text
secure-file-system/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── file_index.json                
│   ├── crypto/
│   │   ├── aes.py
│   │   ├── rsa.py
│   │   ├── hash.py
│   │   └── signature.py
│   ├── uploads/                       (temporary plaintext; deleted after encrypt)
│   ├── encrypted/                     (.enc, .key, .hash, .sig)
│   ├── decrypted/                     (plaintext created on decrypt)
│   └── keys/                          (private.pem, public.pem)
└── frontend/
    ├── package.json
    ├── vite.config.js                 (proxies /api to backend)
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── styles.css
        ├── App.jsx
        ├── pages/
        │   ├── HomeHero.jsx
        │   └── Dashboard.jsx
        └── components/
            ├── UploadCard.jsx
            ├── FileTable.jsx
            └── Toasts.jsx
```

---

## Encryption Flow (Hybrid Cryptography)

1. Generate random **AES-256 key** and random **IV**
2. Encrypt file bytes using **AES-CBC**
   - Store as: `IV || ciphertext`
3. Compute **SHA-256** digest of `IV || ciphertext`
4. Sign digest using **RSA private key** (PKCS#1 v1.5)
5. Encrypt AES key using **RSA public key** (OAEP for key transport)
6. Save encrypted artifacts:
   - `encrypted/<filename>.enc`
   - `encrypted/<filename>.key`
   - `encrypted/<filename>.hash`
   - `encrypted/<filename>.sig`
7. Delete plaintext upload

---

## Decryption Flow (Verify → Decrypt)

1. Load `.enc/.key/.hash/.sig`
2. Recompute SHA-256 over `.enc` contents and compare with `.hash`
3. Verify `.sig` using RSA public key
4. RSA-decrypt AES key using private key
5. AES-decrypt bytes and write `decrypted/<filename>`
6. Download decrypted file via API

---

## Backend API

- `GET /api/health`
- `GET /api/files`
- `POST /api/upload`
- `POST /api/encrypt/:filename`
- `POST /api/decrypt/:filename`
- `GET /api/download/:filename?kind=encrypted|decrypted`
- `DELETE /api/delete/:filename`

---

## How to Run

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs at `http://127.0.0.1:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173` and proxies `/api` to the backend.

## Algorithms Used

- **AES-256-CBC**: Symmetric encryption for file data. A random 256-bit key and IV are generated for every file.
- **RSA-2048**: Asymmetric encryption for secure key transport. The AES key is encrypted using the recipient's RSA public key (OAEP).
- **SHA-256**: Cryptographic hash function used to verify file integrity.
- **RSA PKCS#1 v1.5 Signatures**: Digital signatures to ensure authenticity and non-repudiation.

---

## Technologies Used

- Flask, flask-cors
- PyCryptodome (AES, RSA, SHA256, signatures)
- React, Vite
- Tailwind CSS

---

