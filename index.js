const WebSocket = require('ws');
const fs = require('fs');

// Fungsi untuk membaca hash dari file
function readHashFromFile(filePath) {
    try {
        const hashData = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(hashData);
    } catch (error) {
        console.error('Gagal membaca hash dari file:', error.message);
        return null;
    }
}

// URL WebSocket
const wsUrl = 'wss://api.metaboss.xyz:2000/game';

// Membuat koneksi WebSocket
const ws = new WebSocket(wsUrl);
let isBossDead = false;
let isDelayActive = false;
let clickInterval; // variabel untuk menyimpan interval

// ANSI escape codes untuk warna
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
};

// Menangani event saat koneksi berhasil dibuat
ws.on('open', function open() {
    const authData = readHashFromFile('hash.txt');
    if (authData) {
        ws.send(JSON.stringify(authData));
    } else {
        console.error('[ \x1b[31m- \x1b[0m] Gagal membaca data autentikasi dari hash.txt');
    }
});

let totalCoin = 0; // Menyimpan total koin

// Menangani event saat menerima pesan dari server
ws.on('message', function incoming(data) {
    const messageString = data.toString('utf8');
    const parsedData = JSON.parse(messageString);

    // Variabel untuk menyimpan pesan yang akan dicetak
    let message = '';

    // Waktu saat ini
    const currentTime = new Date();
    const formattedTime = `[ ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}, ${currentTime.getDate().toString().padStart(2, '0')}/${(currentTime.getMonth() + 1).toString().padStart(2, '0')}/${currentTime.getFullYear()} ]`;

    // Jika pesan adalah informasi koneksi berhasil
    if (parsedData.code === 2) {
        const { id, name, coin } = parsedData.data;
        totalCoin = coin; // Mengatur total koin saat ini
        message = `${formattedTime} [ \x1b[32m+ \x1b[0m] Berhasil Terhubung dengan ID : \x1b[33m${id}\x1b[0m, Username : \x1b[33m${name}\x1b[0m, Coin Saat ini : \x1b[33m${coin}\x1b[0m`;
        
        // Kirim pesan untuk memulai auto click setelah berhasil login
        clickInterval = setInterval(() => {
            ws.send('{"code":1,"type":3,"data":{}}');
        }, 1000);
    }

    // Jika pesan adalah permintaan klik
    if (parsedData.code === 10) {
        // Mendapatkan koin dari pesan
        const coin = parsedData.data.coin;
        totalCoin = coin; // Mengupdate total koin
        message = `${formattedTime} [ \x1b[32m+ \x1b[0m] Berhasil \x1b[33m+1\x1b[0m, Total Coin \x1b[33m${totalCoin}\x1b[0m, Darah Boss \x1b[33m${parsedData.data.hpBoss}\x1b[0m`;

        // Jika darah boss mencapai 0 dan belum ada delay aktif
        if (parsedData.data.hpBoss === 0 && !isDelayActive) {
            isDelayActive = true;
            console.log(`${formattedTime} [ \x1b[33m- \x1b[0m] BOSS MATI. Melakukan delay selama 1 jam sebelum melanjutkan klik.`);
            clearInterval(clickInterval); // Menghentikan pengiriman klik
            setTimeout(() => {
                isDelayActive = false;
                console.log(`${formattedTime} [ \x1b[33m- \x1b[0m] 1 jam telah berlalu. Melanjutkan klik.`);
                clickInterval = setInterval(() => {
                    ws.send('{"code":1,"type":3,"data":{}}');
                }, 1000);
            }, 60 * 60 * 1000); // Delay selama 1 jam (dalam milidetik)
        }
    }

    // Cetak pesan jika ada
    if (message) {
        console.log(message);
    }
});

// Menangani event saat koneksi ditutup
ws.on('close', function close() {
    const currentTime = new Date();
    const formattedTime = `[ ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}, ${currentTime.getDate().toString().padStart(2, '0')}/${(currentTime.getMonth() + 1).toString().padStart(2, '0')}/${currentTime.getFullYear()} ]`;
    console.log(`${formattedTime} [ \x1b[31m- \x1b[0m] Koneksi ditutup.`);
});

// Menangani event saat terjadi kesalahan
ws.on('error', function error(err) {
    const currentTime = new Date();
    const formattedTime = `[ ${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}, ${currentTime.getDate().toString().padStart(2, '0')}/${(currentTime.getMonth() + 1).toString().padStart(2, '0')}/${currentTime.getFullYear()} ]`;
    console.error(`${formattedTime} [ \x1b[31m- \x1b[0m] Terjadi kesalahan:`, err.message);
});
