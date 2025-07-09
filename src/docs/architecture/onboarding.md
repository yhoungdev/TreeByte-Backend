---

# 📘 `onboarding-flow.md`

## 🧭 Overview

El flujo de onboarding en el backend de TreeByte permite registrar usuarios con métodos de autenticación flexibles (OAuth, email), asociarlos con wallets Stellar (externas o invisibles), y manejar claves secretas de forma segura mediante cifrado y recuperación vía correo electrónico.

Este sistema está diseñado off-chain por simplicidad, pero con la posibilidad de evolucionar hacia soluciones más descentralizadas como Soroban identity contracts o DIDs.

---

## 🧩 Step-by-step Breakdown

### 1. **User Registration**

**Endpoint:** `POST /register`

* Recibe `email` y `authMethod` (`email` o `google`).
* Genera un par de claves Stellar con `generateKeypair`.
* Retorna: `publicKey`, email y método.

---

### 2. **Wallet Creation**

**Endpoint:** `POST /wallet/create`

* Si el usuario envía `publicKey`, se registra como **wallet externa**.
* Si no, se genera una **wallet invisible**:

  * Requiere `passphrase` (mín. 8 caracteres).
  * Se cifra `secretKey` con AES-256-CBC.
  * Se almacena en Supabase: `secret_key_enc`.

---

### 3. **Encrypted Key Recovery**

**Endpoints:**

* `POST /wallet/recovery/export` → exporta la clave en base64.
* `POST /wallet/recovery/send` → la envía por correo.
* `POST /wallet/recovery/recover` → valida passphrase, descifra y retorna `publicKey`.

---

### 4. **Transaction History**

**Endpoint:** `POST /transactions`

* Recibe `publicKey`.
* Retorna últimas 10 transacciones desde Horizon (Stellar SDK).

---

## 🧰 Technologies Used

| Componente        | Tecnología/Librería             |
| ----------------- | ------------------------------- |
| Framework backend | `Express.js`                    |
| Base de datos     | `Supabase` (PostgreSQL + API)   |
| Blockchain        | `@stellar/stellar-sdk`          |
| Encriptación      | `crypto (AES-256-CBC)`          |
| Email             | `nodemailer`                    |
| Logger            | `winston`                       |
| Dotenv            | `.env` para claves sensibles    |
| Alias imports     | `@/` para estructura mantenible |

---

## 🔐 Security Measures

| Área                    | Medida aplicada                                                              |
| ----------------------- | ---------------------------------------------------------------------------- |
| Cifrado de `secretKey`  | AES-256-CBC (`crypto.createCipheriv` con `sha256(passphrase)` como clave)    |
| Recuperación segura     | Email con `.txt` adjunto cifrado + advertencias en el cuerpo del mensaje     |
| Validaciones input      | Regex para `publicKey`, tamaño mínimo en `passphrase`, checks de duplicación |
| Separación de claves    | `publicKey` almacenado en texto plano, `secretKey` cifrado                   |
| Protección de endpoints | Respuestas específicas por error y uso de status HTTP correctos              |

---

## ⚖️ Off-chain Design Decisions

* **Asociación Wallet ↔ Email:** se hace off-chain por simplicidad UX y rapidez de implementación.
* **Cifrado local de claves:** permite recuperación sin contratos Soroban ni necesidad de firma on-chain.
* **Autenticación híbrida:** se acepta login por email, Google u otros en el frontend.

---

## 🔮 Suggestions for Future Improvements

| Propuesta                       | Descripción                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| 🧾 Soroban Identity Contract    | Un contrato Soroban que permita asociar identidades públicas con wallets                     |
| 🪪 DID & Verifiable Credentials | Uso de [DIDs](https://w3c.github.io/did-core/) e [VCs](https://www.w3.org/TR/vc-data-model/) |
| 🔗 IPFS para backups            | Guardar claves cifradas o metadata firmada en IPFS                                           |
| ✅ Session signatures            | Firmar los requests con la clave privada del usuario (login sin servidor)                    |

---

## 📁 Folder & Code Structure

* Usa **`kebab-case`** para nombres de archivos y carpetas (`wallet-service.ts`, `recovery.service.ts`).
* No se permiten imports relativos como `../../utils` → se usan alias `@/utils/logger`.
* Estructura separada por responsabilidad:

  * `controllers/` → entrada desde Express.
  * `services/` → lógica de negocio (recovery, Stellar).
  * `lib/` → utilidades como Stellar Server o encryption.
  * `config/` → configuración de red Stellar.

---

