// ==========================================
// KONEKSI KE SERVER
// ==========================================
const API_URL = 'http://localhost:3000/api';

// ==========================================
// FUNGSI AKUN
// ==========================================
async function register(nama, email, password, noHp) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, email, password, noHp })
  });
  return await res.json();
}

async function login(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const hasil = await res.json();
  if (hasil.sukses) {
    localStorage.setItem('currentUser', JSON.stringify(hasil.user));
  }
  return hasil;
}

function isLoggedIn() {
  return localStorage.getItem('currentUser') !== null;
}

function isAdmin() {
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  return user.role === 'admin';
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// ==========================================
// FUNGSI TRANSAKSI
// ==========================================
async function simpanTransaksi(data) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const hasil = await res.json();
  return hasil.id;
}

async function getRiwayatTransaksi() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const res = await fetch(`${API_URL}/transactions/${user.id}`);
  return await res.json();
}

async function getAllTransaksi() {
  const res = await fetch(`${API_URL}/all-transactions`);
  return await res.json();
}

async function getAllPengguna() {
  const res = await fetch(`${API_URL}/all-users`);
  return await res.json();
}

async function ubahStatusTransaksi(id, status) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return (await res.json()).sukses;
}

async function hapusTransaksi(id) {
  const res = await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
  return (await res.json()).sukses;
}

// ==========================================
// FUNGSI TAMPILAN (tetap sama seperti sebelumnya)
// ==========================================
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
  });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 80,
        behavior: 'smooth'
      });
      if (navMenu) navMenu.classList.remove('active');
    }
  });
});

window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (header) {
    header.style.boxShadow = window.scrollY > 50 
      ? '0 4px 25px rgba(22, 93, 255, 0.2)' 
      : '0 4px 20px rgba(22, 93, 255, 0.15)';
  }
});

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.game-card, .news-card, .payment-category').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.6s ease';
  observer.observe(el);
});

// ==========================================
// HALAMAN LOGIN
// ==========================================
const formLogin = document.getElementById('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const hasil = await login(email, password);
    const alertBox = document.getElementById('alertBox');
    
    alertBox.className = `alert ${hasil.sukses ? 'alert-success' : 'alert-error'}`;
    alertBox.textContent = hasil.pesan;
    alertBox.style.display = 'block';

    if (hasil.sukses) {
      setTimeout(() => window.location.href = 'index.html', 1500);
    }
  });
}

// ==========================================
// HALAMAN DAFTAR
// ==========================================
const formDaftar = document.getElementById('formDaftar');
if (formDaftar) {
  formDaftar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nama = document.getElementById('nama').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const noHp = document.getElementById('noHp').value;
    
    const hasil = await register(nama, email, password, noHp);
    const alertBox = document.getElementById('alertBox');
    
    alertBox.className = `alert ${hasil.sukses ? 'alert-success' : 'alert-error'}`;
    alertBox.textContent = hasil.pesan;
    alertBox.style.display = 'block';

    if (hasil.sukses) {
      setTimeout(() => window.location.href = 'login.html', 1500);
    }
  });
}

// ==========================================
// HALAMAN DETAIL PRODUK
// ==========================================
let paketTerpilih = null;
const paketList = document.querySelectorAll('.package-option');
if (paketList.length > 0) {
  paketList.forEach(paket => {
    paket.addEventListener('click', () => {
      document.querySelectorAll('.package-option').forEach(p => p.classList.remove('selected'));
      paket.classList.add('selected');
      paketTerpilih = {
        item: paket.dataset.item,
        jumlah: paket.dataset.jumlah,
        harga: paket.dataset.harga
      };
      document.getElementById('hargaTotal').textContent = `Rp ${parseInt(paket.dataset.harga).toLocaleString('id-ID')}`;
    });
  });

  const tombolBeli = document.getElementById('tombolBeli');
  if (tombolBeli) {
    tombolBeli.addEventListener('click', () => {
      if (!isLoggedIn()) {
        alert('Silakan masuk terlebih dahulu!');
        window.location.href = 'login.html';
        return;
      }
      if (!paketTerpilih) {
        alert('Silakan pilih paket terlebih dahulu!');
        return;
      }
      const dataPesanan = {
        game: document.querySelector('.product-info h2').textContent,
        idGame: document.getElementById('idGame').value,
        serverGame: document.getElementById('serverGame').value,
        userId: JSON.parse(localStorage.getItem('currentUser')).id,
        ...paketTerpilih
      };
      localStorage.setItem('dataPesananSementara', JSON.stringify(dataPesanan));
      window.location.href = 'checkout.html';
    });
  }
}

// ==========================================
// HALAMAN CHECKOUT
// ==========================================
if (window.location.pathname.includes('checkout.html')) {
  if (!isLoggedIn()) window.location.href = 'login.html';
  
  const dataPesanan = JSON.parse(localStorage.getItem('dataPesananSementara'));
  if (!dataPesanan) window.location.href = 'index.html';

  document.getElementById('ringkasanGame').textContent = dataPesanan.game;
  document.getElementById('ringkasanItem').textContent = dataPesanan.item;
  document.getElementById('ringkasanHarga').textContent = `Rp ${parseInt(dataPesanan.harga).toLocaleString('id-ID')}`;
  document.getElementById('totalBayar').textContent = `Rp ${parseInt(dataPesanan.harga).toLocaleString('id-ID')}`;

  let metodeBayar = null;
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      metodeBayar = opt.dataset.metode;
    });
  });

  const formCheckout = document.getElementById('formCheckout');
  if (formCheckout) {
    formCheckout.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!metodeBayar) {
        alert('Silakan pilih metode pembayaran!');
        return;
      }

      const idTransaksi = await simpanTransaksi({
        ...dataPesanan,
        metodeBayar: metodeBayar
      });

      localStorage.removeItem('dataPesananSementara');
      alert(`Pesanan berhasil dibuat!\nID Transaksi: ${idTransaksi}\nSilakan selesaikan pembayaran.`);
      window.location.href = 'akun.html';
    });
  }
}

// ==========================================
// HALAMAN AKUN
// ==========================================
if (window.location.pathname.includes('akun.html')) {
  if (!isLoggedIn()) window.location.href = 'login.html';
  
  const pengguna = JSON.parse(localStorage.getItem('currentUser'));
  document.getElementById('namaPengguna').textContent = pengguna.nama;
  document.getElementById('emailPengguna').textContent = pengguna.email;
  document.getElementById('noHpPengguna').textContent = pengguna.noHp || '-';

  window.addEventListener('load', async () => {
    const riwayat = await getRiwayatTransaksi();
    const tabelTransaksi = document.getElementById('tabelTransaksi');
    
    if (riwayat.length === 0) {
      tabelTransaksi.innerHTML = `<tr><td colspan="6" class="empty-state">Belum ada riwayat transaksi</td></tr>`;
    } else {
      tabelTransaksi.innerHTML = riwayat.map(trx => `
        <tr>
          <td>${trx.id}</td>
          <td>${trx.game}</td>
          <td>${trx.item}</td>
          <td>Rp ${parseInt(trx.harga).toLocaleString('id-ID')}</td>
          <td>${trx.tanggal}</td>
          <td><span class="status-badge ${
            trx.status === 'Berhasil' ? 'status-success' : 
            trx.status === 'Gagal' ? 'status-failed' : 'status-pending'
          }">${trx.status}</span></td>
        </tr>
      `).join('');
    }
  });
}

// ==========================================
// HALAMAN ADMIN
// ==========================================
if (window.location.pathname.includes('admin.html')) {
  if (!isAdmin()) {
    document.body.innerHTML = `
    <section class="auth-section">
      <div class="container">
        <div class="auth-card">
          <h2><i class="fa fa-lock"></i> Login Admin</h2>
          <div id="alertBox" class="alert" style="display: none;"></div>
          <form id="formAdminLogin">
            <div class="form-group">
              <label>Email Admin</label>
              <input type="email" id="adminEmail" required value="admin@gametopstore.com">
            </div>
            <div class="form-group">
              <label>Kata Sandi</label>
              <input type="password" id="adminPassword" required placeholder="Masukkan kata sandi">
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;">Masuk ke Dashboard</button>
          </form>
          <div class="text-center" style="margin-top:20px;">
            <a href="index.html">Kembali ke Halaman Utama</a>
          </div>
        </div>
      </div>
    </section>
    `;

    document.getElementById('formAdminLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value;
      const password = document.getElementById('adminPassword').value;
      
      const hasil = await login(email, password);
      const alertBox = document.getElementById('alertBox');
      
      alertBox.className = `alert ${hasil.sukses ? 'alert-success' : 'alert-error'}`;
      alertBox.textContent = hasil.pesan;
      alertBox.style.display = 'block';

      if (hasil.sukses && hasil.user.role === 'admin') {
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  } else {
    window.addEventListener('load', muatDashboardAdmin);
  }
}

async function muatDashboardAdmin() {
  const transaksi = await getAllTransaksi();
  const pengguna = await getAllPengguna();
  
  document.getElementById('statTotalTransaksi').textContent = transaksi.length;
  document.getElementById('statBerhasil').textContent = transaksi.filter(t => t.status === 'Berhasil').length;
  document.getElementById('statPending').textContent = transaksi.filter(t => t.status === 'Menunggu Pembayaran').length;
  document.getElementById('statPengguna').textContent = pengguna.length;

  const tabelTransaksi = document.getElementById('tabelSemuaTransaksi');
  if (transaksi.length === 0) {
    tabelTransaksi.innerHTML = `<tr><td colspan="8" class="empty-state">Belum ada transaksi</td></tr>`;
  } else {
    tabelTransaksi.innerHTML = transaksi.map(trx => `
      <tr>
        <td>${trx.id}</td>
        <td>${trx.game}</td>
        <td>${trx.item}</td>
        <td>Rp ${parseInt(trx.harga).toLocaleString('id-ID')}</td>
        <td>${trx.metodeBayar || '-'}</td>
        <td>${trx.tanggal}</td>
        <td>
          <select onchange="ubahStatus('${trx.id}', this.value)" style="padding:4px; border-radius:4px; border:1px solid #ddd;">
            <option value="Menunggu Pembayaran" ${trx.status === 'Menunggu Pembayaran' ? 'selected' : ''}>Menunggu</option>
            <option value="Berhasil" ${trx.status === 'Berhasil' ? 'selected' : ''}>Berhasil</option>
            <option value="Gagal" ${trx.status === 'Gagal' ? 'selected' : ''}>Gagal</option>
          </select>
        </td>
        <td>
          <button onclick="hapusData('${trx.id}')" class="btn btn-sm" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  const tabelPengguna = document.getElementById('tabelPengguna');
  if (pengguna.length === 0) {
    tabelPengguna.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada pengguna terdaftar</td></tr>`;
  } else {
    tabelPengguna.innerHTML = pengguna.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.nama}</td>
        <td>${user.email}</td>
        <td>${user.noHp || '-'}</td>
        <td>${new Date(user.tanggalDaftar).toLocaleDateString('id-ID')}</td>
      </tr>
    `).join('');
  }
}

async function ubahStatus(id, status) {
  const sukses = await ubahStatusTransaksi(id, status);
  if (sukses) {
    alert(`Status transaksi berhasil diubah menjadi: ${status}`);
  } else {
    alert('Gagal mengubah status!');
  }
}

async function hapusData(id) {
  if (confirm('Yakin ingin menghapus?')) {
    await hapusTransaksi(id);
    alert('Data dihapus!');
    muatDashboardAdmin();
  }
}

function bukaTab(namaTab) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
  document.getElementById(namaTab).classList.add('active');
  event.currentTarget.classList.add('active');
  }
                                                               
