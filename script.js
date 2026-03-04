(() => {

  // =========================
  // ELEMENT
  // =========================

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

  const canvas = document.getElementById("signatureCanvas");

  // =========================
  // UTIL
  // =========================

  function formatTanggalIndonesia(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const bulan = [
      "Januari","Februari","Maret","April","Mei","Juni",
      "Juli","Agustus","September","Oktober","November","Desember"
    ];
    return `${d} ${bulan[m - 1]} ${y}`;
  }

  function sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 90);
  }

  function fileExt(name="") {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  }

  function splitLampiranText(val) {
    return (val || "").split(",").map(s => s.trim()).filter(Boolean);
  }

  function getData() {
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

    for (const k of ["namaPelamar","tempatLahir","tglLahir","pendidikan","alamatPelamar","email","telepon","namaPT","posisi"]) {
      if (!d[k]) throw new Error("Lengkapi semua data wajib.");
    }
    return d;
  }

  // =========================
  // 4 TEMPLATE KAMU (FULL)
  // =========================

  const TEMPLATES = {

    formal: (d) => [
      "Dengan hormat,",
      "",
      "Saya yang bertanda tangan di bawah ini:",
    ],

    operator: (d) => [
      "Dengan hormat,",
      "",
      "Saya yang bertanda tangan di bawah ini:",
    ],

    operatoraja: (d) => [
      "Dengan hormat,",
      "",
      `Berdasarkan informasi lowongan kerja yang saya peroleh pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)}, bahwa perusahaan yang Bapak/Ibu pimpin membutuhkan tenaga kerja sebagai ${d.posisi}, dengan ini saya mengajukan lamaran.`,
      "",
      "Berikut data diri saya:"
    ],

    fresh: (d) => [
      "Dengan hormat,",
      "",
      `Perkenalkan, saya ${d.namaPelamar} (${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}), lulusan ${d.pendidikan}.`,
      `Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`,
      "",
      "Berikut data diri saya:"
    ]
  };

  // =========================
  // GENERATE PDF PROFESIONAL
  // =========================

  async function generateLetterPdfBytes(d) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const marginLeft = 25;
    const marginRight = 25;
    const marginTop = 30;
    const marginBottom = 30;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginLeft - marginRight;

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    let y = marginTop;

    // Tanggal kanan atas
    if (d.kotaSurat && d.tanggalSurat) {
      doc.text(
        `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`,
        pageWidth - marginRight,
        marginTop - 10,
        { align: "right" }
      );
    }

    // Header
    const header = [
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT || "",
      "Di tempat",
      ""
    ];

    header.forEach(line => {
      if (!line) { y += 6; return; }
      doc.text(line, marginLeft, y);
      y += 7;
    });

    // Body template
    const body = TEMPLATES[d.template](d);
    body.forEach(line => {
      if (!line) { y += 6; return; }
      const wrap = doc.splitTextToSize(line, contentWidth);
      wrap.forEach(w => {
        doc.text(w, marginLeft, y);
        y += 7;
      });
    });

    y += 6;

    // Identitas sejajar (Times)
    const labelX = marginLeft;
    const colonX = marginLeft + 45;
    const valueX = colonX + 5;

    const identitas = [
      ["Nama", d.namaPelamar],
      ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
      ["Pendidikan Terakhir", d.pendidikan],
      ["Alamat", d.alamatPelamar],
      ["Email", d.email],
      ["No. HP", d.telepon]
    ];

    identitas.forEach(([label, value]) => {
      doc.text(label, labelX, y);
      doc.text(":", colonX, y);

      const wrap = doc.splitTextToSize(value, contentWidth - 55);
      wrap.forEach((w, i) => {
        doc.text(w, valueX, y);
        if (i < wrap.length - 1) y += 7;
      });

      y += 7;
    });

    // Lampiran text
    const lampiran = [];
    if (includeCV.checked) lampiran.push("Curriculum Vitae (CV)");
    if (includePasFoto.checked) lampiran.push("Pas Foto");
    if (includeSKCK.checked) lampiran.push("SKCK");
    lampiran.push(...splitLampiranText(berkasPendukungText.value));

    if (lampiran.length) {
      y += 5;
      doc.text("Lampiran:", marginLeft, y);
      y += 7;
      lampiran.forEach((l, i) => {
        doc.text(`${i + 1}. ${l}`, marginLeft + 5, y);
        y += 7;
      });
    }

    // Penutup kanan bawah
    const closingY = pageHeight - marginBottom - 40;

    doc.text("Hormat saya,", pageWidth - marginRight, closingY, { align: "right" });

    if (canvas) {
      const ttd = canvas.toDataURL("image/png");
      if (ttd !== "data:,") {
        doc.addImage(
          ttd,
          "PNG",
          pageWidth - marginRight - 40,
          closingY + 5,
          35,
          18
        );
      }
    }

    doc.text(d.namaPelamar, pageWidth - marginRight, closingY + 30, { align: "right" });

    return doc.output("arraybuffer");
  }

  // =========================
  // MERGE LAMPIRAN
  // =========================

  async function exportMergedPDF(d) {

    const { PDFDocument } = window.PDFLib;
    const master = await PDFDocument.create();

    const letterBytes = await generateLetterPdfBytes(d);
    await appendPdf(master, letterBytes);

    const files = [];

    if (includeCV.checked && fileCV.files[0]) files.push(fileCV.files[0]);
    if (includePasFoto.checked && filePasFoto.files[0]) files.push(filePasFoto.files[0]);
    if (includeSKCK.checked && fileSKCK.files[0]) files.push(fileSKCK.files[0]);
    for (const f of filePendukung.files) files.push(f);

    for (const f of files) {
      const bytes = await f.arrayBuffer();
      const ext = fileExt(f.name);

      if (ext === "pdf") {
        await appendPdf(master, bytes);
      } else if (["jpg","jpeg","png"].includes(ext)) {
        await addImagePage(master, bytes, ext === "png" ? "image/png" : "image/jpeg");
      }
    }

    const merged = await master.save();
    const blob = new Blob([merged], { type: "application/pdf" });
    saveAs(blob, sanitizeFileName(`Lamaran - ${d.namaPelamar}.pdf`));
  }

  async function appendPdf(master, bytes) {
    const { PDFDocument } = window.PDFLib;
    const src = await PDFDocument.load(bytes);
    const pages = await master.copyPages(src, src.getPageIndices());
    pages.forEach(p => master.addPage(p));
  }

  async function addImagePage(master, bytes, mime) {
    const imgBytes = new Uint8Array(bytes);
    let img;

    if (mime === "image/png") img = await master.embedPng(imgBytes);
    else img = await master.embedJpg(imgBytes);

    const page = master.addPage();
    const { width, height } = page.getSize();
    const scale = Math.min((width - 50) / img.width, (height - 50) / img.height);

    page.drawImage(img, {
      x: (width - img.width * scale) / 2,
      y: (height - img.height * scale) / 2,
      width: img.width * scale,
      height: img.height * scale
    });
  }

  // =========================
  // EVENTS
  // =========================

  btnPreview.addEventListener("click", () => {
    try {
      const d = getData();
      previewArea.innerText = "Preview aktif (format final ada di PDF)";
    } catch (e) {
      alert(e.message);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      badgeStatus.textContent = "Membuat PDF...";
      const d = getData();
      await exportMergedPDF(d);
      badgeStatus.textContent = "Selesai";
    } catch (err) {
      badgeStatus.textContent = "Gagal";
      alert(err.message);
    }
  });

})();