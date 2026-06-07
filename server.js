const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Sajikan file HTML/CSS/JS

// Path file database
const USERS_FILE = path.join(__dirname, 'users.json');
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

// ==========================================
// Fungsi Baca & Tulis File JSON
// ==========================================
function bacaFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(filePath.includes('users') ? {
        "users": [],
        "admin": {
          "id": 0,
          "nama": "Administrator",
          "email": "admin@gametopstore.com",
          "password": "admin123",
          "role": "admin"
        }
      } : { "transactions": [] }, null, 2));
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error baca file:', err);
    return filePath.includes('users') ? { users: [], admin: {} } : { transactions: [] };
  }
}

function tulisFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error tulis file:', err);
    return false;
  }
}

// ==========================================
// API Endpoint
// ==========================================

// Daftar akun
app.post('/api/register', (req, res) => {
  const { nama, email, password, noHp } = req.body;
  const data = bacaFile(USERS_FILE);

  if (data.users.find(u => u.email === email)) {
    return res.json({ sukses: false, pesan: "Email sudah terdaftar!" });
  }

  const userBaru = {
    id: Date.now(),
    nama,
    email,
    password,
    noHp,
    tanggalDaftar: new Date().toISOString()
  };

  data.users.push(userBaru);
  tulisFile(USERS_FILE, data);
  res.json({ sukses: true, pesan: "Pendaftaran berhasil!" });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const data = bacaFile(USERS_FILE);

  // Cek admin
  if (data.admin && data.admin.email === email && data.admin.password === password) {
    const { password: pwd, ...adminData } = data.admin;
    return res.json({ sukses: true, pesan: "Login admin berhasil!", user: adminData });
  }

  // Cek pengguna biasa
  const user = data.users.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: pwd, ...userData } = user;
    return res.json({ sukses: true, pesan: "Login berhasil!", user: userData });
  }

  res.json({ sukses: false, pesan: "Email atau kata sandi salah!" });
});

// Simpan transaksi
app.post('/api/transactions', (req, res) => {
  const data = bacaFile(TRANSACTIONS_FILE);
  const transaksiBaru = {
    id: 'TRX-' + Date.now(),
    tanggal: new Date().toLocaleString('id-ID'),
    status: 'Menunggu Pembayaran',
    ...req.body
  };

  data.transactions.push(transaksiBaru);
  tulisFile(TRANSACTIONS_FILE, data);
  res.json({ sukses: true, id: transaksiBaru.id });
});

// Ambil transaksi berdasarkan user
app.get('/api/transactions/:userId', (req, res) => {
  const data = bacaFile(TRANSACTIONS_FILE);
  const transaksiUser = data.transactions
    .filter(t => t.userId == req.params.userId)
    .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  
  res.json(transaksiUser);
});

// Ambil semua transaksi (admin)
app.get('/api/all-transactions', (req, res) => {
  const data = bacaFile(TRANSACTIONS_FILE);
  res.json(data.transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
});

// Ambil semua pengguna (admin)
app.get('/api/all-users', (req, res) => {
  const data = bacaFile(USERS_FILE);
  res.json(data.users);
});

// Ubah status transaksi
app.put('/api/transactions/:id', (req, res) => {
  const { status } = req.body;
  const data = bacaFile(TRANSACTIONS_FILE);
  const index = data.transactions.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.json({ sukses: false, pesan: "Transaksi tidak ditemukan!" });
  }

  data.transactions[index].status = status;
  tulisFile(TRANSACTIONS_FILE, data);
  res.json({ sukses: true });
});

// Hapus transaksi
app.delete('/api/transactions/:id', (req, res) => {
  const data = bacaFile(TRANSACTIONS_FILE);
  const baru = data.transactions.filter(t => t.id !== req.params.id);
  tulisFile(TRANSACTIONS_FILE, { transactions: baru });
  res.json({ sukses: true });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
    
