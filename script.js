(() => {
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

  const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const tanggalSuratEl = document.getElementById("tanggalSurat");
  if (!tanggalSuratEl.value) tanggalSuratEl.value = todayISO();

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
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 90);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  function getFormData() {
    const d = {
      namaPelamar: document.getElementById("namaPelamar").value.trim(),
      tempatLahir: document.getElementById("tempatLahir").value.trim(),
      tglLahir: document.getElementById("tglLahir").value,
      pendidikan: document.getElementById("pendidikan").value.trim(),
      alamatPelamar: document.getElementById("alamatPelamar").value.trim(),
      email: document.getElementById("email").value.trim(),
      telepon: document.getElementById("telepon").value.trim(),

      kotaSurat: document.getElementById("kotaSurat").value.trim(),
      tanggalSurat: document.getElementById("tanggalSurat").value,
      namaPT: document.getElementById("namaPT").value.trim(),
      lokasiPT: document.getElementById("lokasiPT").value.trim(),
      posisi: document.getElementById("posisi").value.trim(),

      template: document.getElementById("template").value,
      mode: document.getElementById("modeEkspor").value,
    };

    const required = [
      "namaPelamar","tempatLahir","tglLahir","pendidikan",
      "alamatPelamar","email","telepon",
      "kotaSurat","tanggalSurat","namaPT","posisi","template","mode"
    ];
    for (const k of required) {
      if (!d[k]) throw new Error(`Mohon lengkapi field: ${k}`);
    }
    return d;
  }

  // ===== Templates (tanpa kalimat lampiran) =====
  const TEMPLATES = {
    formal: (d) => ([
      `Dengan hormat,`,
      ``,
      `Saya yang bertanda tangan di bawah ini:`,
      `Nama : ${d.namaPelamar}`,
      `Tempat/Tanggal Lahir : ${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`,
      `Pendidikan Terakhir : ${d.pendidikan}`,
      `Alamat : ${d.alamatPelamar}`,
      `Email : ${d.email}`,
      `No. HP : ${d.telepon}`,
      ``,
      `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.namaPT} sebagai ${d.posisi}.`,
      `Saya memiliki motivasi kerja yang tinggi, mampu bekerja secara individu maupun tim, serta siap`,
      `bekerja dengan disiplin dan bertanggung jawab untuk mendukung target perusahaan.`,
      ``,
      `Besar harapan saya untuk dapat diberikan kesempatan mengikuti proses seleksi lebih lanjut.`,
    ]),

    operator: (d) => ([
      `Dengan hormat,`,
      ``,
      `Saya yang bertanda tangan di bawah ini:`,
      `Nama : ${d.namaPelamar}`,
      `Tempat/Tanggal Lahir : ${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`,
      `Pendidikan Terakhir : ${d.pendidikan}`,
      `Alamat : ${d.alamatPelamar}`,
      `Email : ${d.email}`,
      `No. HP : ${d.telepon}`,
      ``,
      `Dengan ini saya mengajukan lamaran kerja untuk posisi ${d.posisi} di ${d.namaPT}.`,
      `Saya terbiasa bekerja dengan teliti, mengikuti SOP, menjaga kualitas, serta siap bekerja`,
      `dengan sistem shift/lembur sesuai kebutuhan perusahaan.`,
      ``,
      `Saya siap mengikuti interview/tes sesuai jadwal yang ditentukan perusahaan.`,
    ]),

    fresh: (d) => ([
      `Dengan hormat,`,
      ``,
      `Perkenalkan, saya ${d.namaPelamar} (${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}),`,
      `lulusan ${d.pendidikan}. Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`,
      ``,
      `Saya memiliki kemauan belajar yang tinggi, cepat beradaptasi, serta mampu bekerja dengan`,
      `komunikasi yang baik. Saya siap bekerja keras, berorientasi target, dan terus berkembang.`,
      ``,
      `Kontak saya: ${d.telepon} | ${d.email}`,
      ``,
      `Saya berharap dapat diberikan kesempatan untuk mengikuti tahapan seleksi selanjutnya.`,
    ]),
  };

  function buildLetterLines(d) {
    const tglSurat = formatTanggalIndonesia(d.tanggalSurat);

    const header = [
      `${d.kotaSurat}, ${tglSurat}`,
      ``,
      `Perihal : Lamaran Pekerjaan`,
      ``,
      `Kepada Yth,`,
      `${d.namaPT}`,
      ...(d.lokasiPT ? [d.lokasiPT] : []),
      `Di tempat`,
      ``,
    ];

    const body = (TEMPLATES[d.template] ? TEMPLATES[d.template](d) : TEMPLATES.formal(d));

    // Lampiran text list (untuk surat)
    const lampiran = [];

    if (includeCV.checked) lampiran.push("Curriculum Vitae (CV)");
    if (includePasFoto.checked) lampiran.push("Pas Foto");
    if (includeSKCK.checked) lampiran.push("SKCK");

    lampiran.push(...splitLampiranText(berkasPendukungText.value));

    // Deduplicate
    const uniq = [];
    const seen = new Set();
    for (const item of lampiran) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(item);
      }
    }

    const closing = [
      ``,
      `Demikian surat lamaran kerja ini saya sampaikan. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.`,
      ``,
      `Hormat saya,`,
      ``,
      ``,
      ``,
      `${d.namaPelamar}`,
    ];

    // Kalau ada lampiran -> tambahkan teks khusus
    if (uniq.length > 0) {
      const list = uniq.map((b, i) => `${i + 1}. ${b}`);
      return header.concat(body).concat([
        ``,
        `Sebagai bahan pertimbangan, saya lampirkan berkas lamaran sebagai berikut:`,
        ...list,
      ]).concat(closing);
    }

    // Kalau tidak ada -> jangan tampilkan teks lampiran
    return header.concat(body).concat(closing);
  }

  function renderPreview(lines) {
    previewArea.innerHTML = `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
    badgeStatus.textContent = "Preview siap";
  }

  function makeFileName(d) {
    return sanitizeFileName(`Lamaran - ${d.namaPelamar} - ${d.namaPT} - ${d.posisi}`);
  }

  // ===== Generate letter PDF bytes (jsPDF) =====
  async function generateLetterPdfBytes(lines) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const marginLeft = 20;
    const marginTop = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginLeft * 2;

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    let y = marginTop;
    const lineHeight = 6.2;

    for (const rawLine of lines) {
      const line = rawLine ?? "";
      const wrapped = doc.splitTextToSize(line, maxWidth);

      for (const w of wrapped) {
        if (y > pageHeight - marginTop) {
          doc.addPage();
          y = marginTop;
          doc.setFont("times", "normal");
          doc.setFontSize(12);
        }
        doc.text(w, marginLeft, y);
        y += lineHeight;
      }

      if (line.trim() === "") y += 1.5;
    }

    return doc.output("arraybuffer");
  }

  async function appendPdf(pdfDoc, pdfBytes) {
    const { PDFDocument } = window.PDFLib;
    const src = await PDFDocument.load(pdfBytes);
    const pages = await pdfDoc.copyPages(src, src.getPageIndices());
    pages.forEach(p => pdfDoc.addPage(p));
  }

  async function addImageAsPage(pdfDoc, bytes, mimeType) {
    const imgBytes = new Uint8Array(bytes);
    let image;

    if (mimeType === "image/png") image = await pdfDoc.embedPng(imgBytes);
    else image = await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const margin = 36;
    const maxW = width - margin * 2;
    const maxH = height - margin * 2;

    const scale = Math.min(maxW / image.width, maxH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;

    page.drawImage(image, {
      x: (width - drawW) / 2,
      y: (height - drawH) / 2,
      width: drawW,
      height: drawH
    });
  }

  async function readFileBytes(file) {
    return await file.arrayBuffer();
  }

  async function exportMergedPDF(lines, fileNameBase) {
    const { PDFDocument } = window.PDFLib;
    if (!PDFDocument) throw new Error("PDF merge library (pdf-lib) belum termuat.");

    const letterBytes = await generateLetterPdfBytes(lines);

    const master = await PDFDocument.create();
    await appendPdf(master, letterBytes);

    const attachments = [];

    if (includeCV.checked && fileCV.files[0]) attachments.push(fileCV.files[0]);
    if (includePasFoto.checked && filePasFoto.files[0]) attachments.push(filePasFoto.files[0]);
    if (includeSKCK.checked && fileSKCK.files[0]) attachments.push(fileSKCK.files[0]);

    for (const f of (filePendukung.files || [])) attachments.push(f);

    for (const f of attachments) {
      const bytes = await readFileBytes(f);
      const ext = fileExt(f.name);
      const type = f.type;

      if (type === "application/pdf" || ext === "pdf") {
        await appendPdf(master, bytes);
        continue;
      }

      if (type === "image/jpeg" || type === "image/png" || ext === "jpg" || ext === "jpeg" || ext === "png") {
        const mime = (type === "image/png" || ext === "png") ? "image/png" : "image/jpeg";
        await addImageAsPage(master, bytes, mime);
        continue;
      }

      console.warn("Tipe file tidak didukung untuk merge:", f.name, f.type);
    }

    const mergedBytes = await master.save();
    const blob = new Blob([mergedBytes], { type: "application/pdf" });
    saveAs(blob, `${fileNameBase}.pdf`);
  }

  async function exportDOCX(lines, fileNameBase) {
    const docx = window.docx;
    if (!docx) throw new Error("Library DOCX belum termuat. Cek koneksi internet/CDN.");

    const { Document, Packer, Paragraph, TextRun } = docx;

    const paragraphs = lines.map((line) => {
      if (!line || line.trim() === "") return new Paragraph({ children: [new TextRun("")] });
      return new Paragraph({
        children: [new TextRun({ text: line, font: "Times New Roman", size: 24 })]
      });
    });

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children: paragraphs
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileNameBase}.docx`);
  }

  btnPreview.addEventListener("click", () => {
    try {
      badgeStatus.textContent = "Memproses…";
      const d = getFormData();
      const lines = buildLetterLines(d);
      renderPreview(lines);
    } catch (err) {
      badgeStatus.textContent = "Gagal";
      previewArea.innerHTML = `<p class="muted">${escapeHtml(err.message || "Terjadi kesalahan.")}</p>`;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      badgeStatus.textContent = "Membuat file…";
      const d = getFormData();
      const lines = buildLetterLines(d);
      renderPreview(lines);

      const fileNameBase = makeFileName(d);

      if (d.mode === "pdf") {
        await exportMergedPDF(lines, fileNameBase);
      } else {
        await exportDOCX(lines, fileNameBase);
      }

      badgeStatus.textContent = "Selesai & terunduh";
    } catch (err) {
      badgeStatus.textContent = "Gagal";
      previewArea.innerHTML = `<p class="muted">${escapeHtml(err.message || "Terjadi kesalahan.")}</p>`;
    }
  });
})();
