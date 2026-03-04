(() => {

  // =============================
  // ELEMENT
  // =============================

  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const badgeStatus = document.getElementById("badgeStatus");
  const btnPreview = document.getElementById("btnPreview");
  document.getElementById("year").textContent = new Date().getFullYear();

  const includeCV = document.getElementById("includeCV");
  const includePasFoto = document.getElementById("includePasFoto");
  const includeSKCK = document.getElementById("includeSKCK");

  const fileCV = document.getElementById("fileCV");
  const filePasFoto = document.getElementById("filePasFoto");
  const fileSKCK = document.getElementById("fileSKCK");
  const filePendukung = document.getElementById("filePendukung");
  const berkasPendukungText = document.getElementById("berkasPendukungText");

  // =============================
  // UTIL
  // =============================

  function formatTanggalIndonesia(isoDate) {
    const [y, m, d] = isoDate.split("-").map(Number);
    const bulan = [
      "Januari","Februari","Maret","April","Mei","Juni",
      "Juli","Agustus","September","Oktober","November","Desember"
    ];
    return `${d} ${bulan[m - 1]} ${y}`;
  }

  function sanitizeFileName(name) {
    return String(name)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 90);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fileExt(name = "") {
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
  }

  function splitLampiranText(input) {
    return String(input || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  // =============================
  // GET DATA
  // =============================

  function getFormData() {
    const d = {
      namaPelamar: namaPelamar.value.trim(),
      tempatLahir: tempatLahir.value.trim(),
      tglLahir: tglLahir.value,
      pendidikan: pendidikan.value.trim(),
      alamatPelamar: alamatPelamar.value.trim(),
      email: email.value.trim(),
      telepon: telepon.value.trim(),
      kotaSurat: kotaSurat.value.trim(),
      tanggalSurat: tanggalSurat.value,
      namaPT: namaPT.value.trim(),
      lokasiPT: lokasiPT.value.trim(),
      posisi: posisi.value.trim(),
      template: template.value,
      mode: modeEkspor.value
    };

    const required = [
      "namaPelamar","tempatLahir","tglLahir","pendidikan",
      "alamatPelamar","email","telepon",
      "namaPT","posisi","template","mode"
    ];

    for (const k of required) {
      if (!d[k]) throw new Error("Mohon lengkapi semua data wajib.");
    }

    return d;
  }

  // =============================
  // TEMPLATE
  // =============================

  const TEMPLATES = {
    formal: (d) => ([
      "Dengan hormat,",
      "",
      `Saya yang bertanda tangan di bawah ini:`,
      `Nama : ${d.namaPelamar}`,
      `Tempat/Tanggal Lahir : ${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`,
      `Pendidikan Terakhir : ${d.pendidikan}`,
      `Alamat : ${d.alamatPelamar}`,
      `Email : ${d.email}`,
      `No. HP : ${d.telepon}`,
      "",
      `Dengan ini mengajukan lamaran kerja di ${d.namaPT} sebagai ${d.posisi}.`,
      "Saya siap bekerja disiplin dan bertanggung jawab.",
      "",
      "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."
    ])
  };

  // =============================
  // BUILD SURAT + LAMPIRAN TEXT
  // =============================

  function buildLetterLines(d) {

    const header = [
      d.kotaSurat && d.tanggalSurat
        ? `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`
        : "",
      "",
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT || "",
      "Di tempat",
      ""
    ];

    const body = TEMPLATES[d.template](d);

    const lampiran = [];

    if (includeCV.checked) lampiran.push("Curriculum Vitae");
    if (includePasFoto.checked) lampiran.push("Pas Foto");
    if (includeSKCK.checked) lampiran.push("SKCK");

    lampiran.push(...splitLampiranText(berkasPendukungText.value));

    const uniq = [...new Set(lampiran.map(l => l.trim()))];

    const lampiranBlock = uniq.length > 0
      ? ["", "Lampiran:", ...uniq.map((b, i) => `${i+1}. ${b}`)]
      : [];

    const closing = [
      "",
      "Hormat saya,",
      "",
      d.namaPelamar
    ];

    return header.concat(body).concat(lampiranBlock).concat(closing);
  }

  function renderPreview(lines) {
    previewArea.innerHTML = `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
  }

  function makeFileName(d) {
    return sanitizeFileName(`Lamaran - ${d.namaPelamar} - ${d.namaPT}`);
  }

  // =============================
  // PDF MERGE
  // =============================

  async function exportMergedPDF(lines, fileNameBase) {

    const { jsPDF } = window.jspdf;
    const { PDFDocument } = window.PDFLib;

    const letterDoc = new jsPDF({ unit: "mm", format: "a4" });
    letterDoc.setFont("times", "normal");
    letterDoc.setFontSize(12);

    let y = 20;
    const maxWidth = 170;

    lines.forEach(line => {
      const wrapped = letterDoc.splitTextToSize(line, maxWidth);
      wrapped.forEach(w => {
        letterDoc.text(w, 20, y);
        y += 7;
      });
    });

    const letterBytes = letterDoc.output("arraybuffer");

    const master = await PDFDocument.create();
    await appendPdf(master, letterBytes);

    const attachments = [];

    if (includeCV.checked) {
      if (!fileCV.files[0]) throw new Error("CV dicentang tapi belum upload file.");
      attachments.push(fileCV.files[0]);
    }

    if (includePasFoto.checked) {
      if (!filePasFoto.files[0]) throw new Error("Pas Foto dicentang tapi belum upload.");
      attachments.push(filePasFoto.files[0]);
    }

    if (includeSKCK.checked) {
      if (!fileSKCK.files[0]) throw new Error("SKCK dicentang tapi belum upload.");
      attachments.push(fileSKCK.files[0]);
    }

    for (const f of filePendukung.files) attachments.push(f);

    for (const f of attachments) {
      const bytes = await f.arrayBuffer();
      const ext = fileExt(f.name);

      if (ext === "pdf") {
        await appendPdf(master, bytes);
      } else if (["jpg","jpeg","png"].includes(ext)) {
        await addImageAsPage(master, bytes, ext === "png" ? "image/png" : "image/jpeg");
      }
    }

    const mergedBytes = await master.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    saveAs(blob, `${fileNameBase}.pdf`);
  }

  async function appendPdf(master, bytes) {
    const { PDFDocument } = window.PDFLib;
    const src = await PDFDocument.load(bytes);
    const pages = await master.copyPages(src, src.getPageIndices());
    pages.forEach(p => master.addPage(p));
  }

  async function addImageAsPage(master, bytes, mime) {
    const imgBytes = new Uint8Array(bytes);
    let image;

    if (mime === "image/png") image = await master.embedPng(imgBytes);
    else image = await master.embedJpg(imgBytes);

    const page = master.addPage();
    const { width, height } = page.getSize();

    const scale = Math.min(
      (width - 50) / image.width,
      (height - 50) / image.height
    );

    page.drawImage(image, {
      x: (width - image.width * scale) / 2,
      y: (height - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale
    });
  }

  // =============================
  // EVENTS
  // =============================

  btnPreview.addEventListener("click", () => {
    try {
      const d = getFormData();
      renderPreview(buildLetterLines(d));
    } catch (e) {
      alert(e.message);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      badgeStatus.textContent = "Memproses...";
      const d = getFormData();
      const lines = buildLetterLines(d);
      renderPreview(lines);

      if (d.mode === "pdf") {
        await exportMergedPDF(lines, makeFileName(d));
      }

      badgeStatus.textContent = "Selesai";
    } catch (err) {
      badgeStatus.textContent = "Gagal";
      alert(err.message);
    }
  });

})();