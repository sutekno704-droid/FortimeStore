const express = require('express');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// Gunakan port dinamis dari layanan VPS/Render
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Lokasi file database
const USERS_FILE = path.join(__dirname, 'users.json');
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

// Inisialisasi file jika belum ada
async function initDB() {
  try {
    if (!fsSync.existsSync(USERS_FILE)) {
      await fs.writeFile(USERS_FILE, JSON.stringify({
        "users": [],
        "admin": {
          "id": 0,
          "nama": "Administrator",
          "email": "admin@gametopstore.com",
          "password": "admin123",
          "role": "admin"
        }
      }, null, 2));
    }
    if (!fsSync.existsSync(TRANSACTIONS_FILE)) {
      await fs.writeFile(TRANSACTIONS_FILE, JSON.stringify({ "transactions": [] }, null, 2));
    }
  } catch (err) {
    console.error('Inisialisasi DB gagal:', err);
  }
}

// Fungsi baca/tulis file
async function bacaFile(fp) {
  try {
    const raw = await fs.readFile(fp, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Baca file gagal:', e);
    return fp.includes('users') ? { users: [], admin: {} } : { transactions: [] };
  }
}

async function tulisFile(fp, data) {
  try {
    await fs.writeFile(fp, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Tulis file gagal:', e);
    return false;
  }
}

// API
app.post('/api/register', async (req, res) => {
  const { nama, email, password, noHp } = req.body;
  const data = await bacaFile(USERS_FILE);
  if (data.users.find(u => u.email === email)) {
    return res.json({ sukses: false, pesan: "Email sudah terdaftar!" });
  }
  data.users.push({ id: Date.now(), nama, email, password, noHp, tanggalDaftar: new Date().toISOString() });
  await tulisFile(USERS_FILE, data);
  res.json({ sukses: true, pesan: "Pendaftaran berhasil!" });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const data = await bacaFile(USERS_FILE);
  if (data.admin?.email === email && data.admin?.password === password) {
    const { password: _, ...admin } = data.admin;
    return res.json({ sukses: true, pesan: "Login admin berhasil!", user: admin });
  }
  const user = data.users.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...akun } = user;
    return res.json({ sukses: true, pesan: "Login berhasil!", user: akun });
  }
  res.json({ sukses: false, pesan: "Email atau sandi salah!" });
});

app.post('/api/transactions', async (req, res) => {
  const data = await bacaFile(TRANSACTIONS_FILE);
  const trx = { id: 'TRX-' + Date.now(), tanggal: new Date().toLocaleString('id-ID'), status: 'Menunggu Pembayaran', ...req.body };
  data.transactions.push(trx);
  await tulisFile(TRANSACTIONS_FILE, data);
  res.json({ sukses: true, id: trx.id });
});

app.get('/api/transactions/:userId', async (req, res) => {
  const data = await bacaFile(TRANSACTIONS_FILE);
  const milikUser = data.transactions.filter(t => t.userId == req.params.userId).sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
  res.json(milikUser);
});

app.get('/api/all-transactions', async (req, res) => {
  const data = await bacaFile(TRANSACTIONS_FILE);
  res.json(data.transactions.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)));
});

app.get('/api/all-users', async (req, res) => {
  const data = await bacaFile(USERS_FILE);
  res.json(data.users);
});

app.put('/api/transactions/:id', async (req, res) => {
  const data = await bacaFile(TRANSACTIONS_FILE);
  const idx = data.transactions.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.json({ sukses: false, pesan: "Tidak ditemukan" });
  data.transactions[idx].status = req.body.status;
  await tulisFile(TRANSACTIONS_FILE, data);
  res.json({ sukses: true });
});

app.delete('/api/transactions/:id', async (req, res) => {
  const data = await bacaFile(TRANSACTIONS_FILE);
  const baru = data.transactions.filter(t => t.id !== req.params.id);
  await tulisFile(TRANSACTIONS_FILE, { transactions: baru });
  res.json({ sukses: true });
});

// Sajikan halaman utama
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Jalankan server
initDB().then(() => {
  app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
});
