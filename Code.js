// =========================================================================
// SISTEM HRIS OMAH VISUAL LED - BACKEND (Kode.gs)
// =========================================================================

// Ganti tulisan di dalam tanda kutip dengan Folder ID Google Drive Anda!
const FOLDER_ID_FOTO = "1a3UI6Jd5OlHCrgOlHKVCoGTk5A_k0iiz";

// 1. FUNGSI INISIALISASI WEB APP
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('HRIS - Omah Visual LED')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function dapatkanSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// =========================================================================
// FITUR 1: AUTENTIKASI & KEAMANAN (DEVICE BINDING)
// =========================================================================
function prosesLogin(username, pin, deviceIdClient) {
  try {
    var ss = dapatkanSpreadsheet();
    var sheetUser = ss.getSheetByName("MASTER_USER"); 
    var data = sheetUser.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] == username && data[i][3] == pin) { // Kolom C & D
        
        var statusAkun = data[i][14]; // Kolom O (Status)
        if (statusAkun !== "Aktif") {
          return { success: false, message: "Akun Anda berstatus Nonaktif/Selesai. Hubungi HR." };
        }
        
        var registeredDevice = data[i][15]; // Kolom P (Device_ID)
        var role = data[i][4]; // Kolom E (Role)
        
        // Logika Device Binding (Developer dan Admin HR bebas login di mana saja)
        if (role !== "Admin" && role !== "Developer") {
          if (!registeredDevice || registeredDevice === "") {
            // Pertama kali login, daftarkan device ini
            sheetUser.getRange(i + 1, 16).setValue(deviceIdClient);
          } else if (registeredDevice !== deviceIdClient) {
            return { success: false, message: "Akses Ditolak! Akun ini sudah terikat di perangkat lain. Dilarang titip absen." };
          }
        }
        
        // Catat log jika Admin/Developer yang login
        if (role === "Admin" || role === "Developer") {
          catatLogSistem(username, role + " berhasil Login ke sistem.");
        }
        
        return {
          success: true,
          idKaryawan: data[i][0],
          nama: data[i][1],
          role: role,
          kategori: data[i][5],
          jamWajibMasuk: data[i][13]
        };
      }
    }
    return { success: false, message: "Username atau PIN salah!" };
  } catch (e) {
    return { success: false, message: "CRASH SISTEM: " + e.toString() };
  }
}

// =========================================================================
// FITUR 2: SIMPAN ABSENSI & UPLOAD FOTO
// =========================================================================
function simpanAbsensi(data) {
  try {
    var ss = dapatkanSpreadsheet();
    var sheetAbsen = ss.getSheetByName("DATA_ABSENSI");
    
    // Proses Upload Foto Base64 ke Google Drive
    var fileUrl = "";
    if(data.fotoBase64) {
      var folder = DriveApp.getFolderById(FOLDER_ID_FOTO);
      var contentType = data.fotoBase64.substring(5, data.fotoBase64.indexOf(';'));
      var bytes = Utilities.base64Decode(data.fotoBase64.split(',')[1]);
      var namaFileFoto = data.nama + "_" + data.tipeLog + "_" + Utilities.formatDate(new Date(), "GMT+7", "ddMMyyyy_HHmm");
      var blob = Utilities.newBlob(bytes, contentType, namaFileFoto);
      var fileUrl = folder.createFile(blob).getUrl();
    }
    
    // Logika Otomatis Kolom Status_Approval
    var statusApproval = "Disetujui";
    if (data.tipeLog === "Izin" || data.tipeLog === "WFH" || data.tipeLog === "Pemasangan") {
      statusApproval = "Pending";
    }
    
    var waktuSekarang = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
    
    // Menambahkan baris ke Sheet DATA_ABSENSI
    sheetAbsen.appendRow([
      waktuSekarang,
      data.idKaryawan,
      data.nama,
      data.tipeLog,
      data.titikGPS,
      data.jarakMeter,
      fileUrl,
      data.catatanSistem,
      data.keterangan,
      statusApproval
    ]);
    
    return { success: true, message: "Data absensi " + data.tipeLog + " berhasil dikirim!" };
  } catch (e) {
    return { success: false, message: "Terjadi kesalahan server: " + e.toString() };
  }
}

// =========================================================================
// FUNGSI PENDUKUNG
// =========================================================================
function catatLogSistem(userPengakses, aktivitas) {
  var sheetLog = dapatkanSpreadsheet().getSheetByName("LOG_SISTEM");
  var waktu = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  sheetLog.appendRow([waktu, userPengakses, aktivitas]);
}