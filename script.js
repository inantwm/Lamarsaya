(() => {

  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  document.getElementById("year").textContent = new Date().getFullYear();

  // =========================
  // FILE ATTACHMENTS
  // =========================

  const fileCV = document.getElementById("fileCV");
  const fileFoto = document.getElementById("fileFoto");
  const fileSKCK = document.getElementById("fileSKCK");
  const fileLain = document.getElementById("fileLain");

  const cekCV = document.getElementById("cekCV");
  const cekFoto = document.getElementById("cekFoto");
  const cekSKCK = document.getElementById("cekSKCK");

  const daftarBerkas = document.getElementById("daftarBerkas");

  // =========================
  // SIGNATURE CANVAS
  // =========================

  const canvas = document.getElementById("signaturePad");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearTtd");

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const oldData = canvas.toDataURL();

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    if (oldData !== "data:,") {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
      };
      img.src = oldData;
    }
  }

  resizeCanvas();
  window.addEventListener("orientationchange", () => {
    setTimeout(resizeCanvas, 300);
  });

  let drawing = false;

  function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function startDraw(e) {
    drawing = true;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // =========================
  // UTIL
  // =========================

  function formatTanggalIndonesia(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-").map(Number);
    const bulan = [
      "Januari","Februari","Maret","April","Mei","Juni",
      "Juli","Agustus","September","Oktober","November","Desember"
    ];
    return `${d} ${bulan[m - 1]} ${y}`;
  }

  function sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>|]+/g, "-");
  }

  function escapeHtml(str) {
    return str.replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function formatIdentitasBlock(pairs) {
    const max = Math.max(...pairs.map(p => p[0].length));
    return pairs.map(([l,v]) => `${l.padEnd(max)} : ${v}`);
  }

  function getFormData() {
    return {
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
      mode: modeEkspor.value,
      lampiranText: daftarBerkas ? daftarBerkas.value.trim() : ""
    };
  }

  // =========================
  // TEMPLATES (4 TEMPLATE UTUH)
  // =========================

  const TEMPLATES = {

    formal: (d) => {
      const identitas = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar],
        ["Email", d.email],
        ["No. HP", d.telepon],
      ]);

      return [
        "Dengan hormat,",
        "",
        "Saya yang bertanda tangan di bawah ini:",
        ...identitas,
        "",
        `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.namaPT} sebagai ${d.posisi}.`,
        "",
        "Sebagai bahan pertimbangan, berikut saya lampirkan:",
        d.lampiranText || "- Curriculum Vitae",
        "",
        "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."
      ];
    },

    operator: (d) => {
      const identitas = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar],
        ["Email", d.email],
        ["No. HP", d.telepon],
      ]);

      return [
        "Dengan hormat,",
        "",
        "Saya yang bertanda tangan di bawah ini:",
        ...identitas,
        "",
        `Dengan ini saya mengajukan lamaran kerja untuk posisi ${d.posisi} di ${d.namaPT}.`,
        "",
        "Sebagai bahan pertimbangan, berikut saya lampirkan:",
        d.lampiranText || "- Curriculum Vitae",
        "",
        "Saya siap mengikuti proses interview sesuai jadwal yang ditentukan."
      ];
    },

    operatoraja: (d) => {
      const identitas = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar],
      ]);

      return [
        "Dengan hormat,",
        "",
        `Berdasarkan informasi lowongan kerja yang saya peroleh pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)},`,
        ...identitas,
        "",
        `Mengajukan permohonan untuk menjadi tenaga kerja di ${d.namaPT} sebagai ${d.posisi}.`
      ];
    },

    fresh: (d) => [
      "Dengan hormat,",
      "",
      `Perkenalkan, saya ${d.namaPelamar} (${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}), lulusan ${d.pendidikan}.`,
      `Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`,
      "",
      "Sebagai bahan pertimbangan, berikut saya lampirkan:",
      d.lampiranText || "- Curriculum Vitae",
      "",
      "Saya siap mengikuti proses seleksi."
    ]
  };

  // =========================
  // MERGE ATTACHMENTS
  // =========================

  async function mergeAttachments(mainBlob) {

    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();

    const mainBytes = await mainBlob.arrayBuffer();
    const mainDoc = await PDFDocument.load(mainBytes);
    const mainPages = await mergedPdf.copyPages(mainDoc, mainDoc.getPageIndices());
    mainPages.forEach(p => mergedPdf.addPage(p));

    async function addFile(file) {
      if (!file) return;

      const bytes = await file.arrayBuffer();

      if (file.type === "application/pdf") {
        const pdf = await PDFDocument.load(bytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }

      if (file.type.startsWith("image/")) {
        const imgPdf = await PDFDocument.create();
        const page = imgPdf.addPage([595, 842]);

        let img;
        if (file.type === "image/png") {
          img = await imgPdf.embedPng(bytes);
        } else {
          img = await imgPdf.embedJpg(bytes);
        }

        const { width, height } = img.scale(0.8);
        page.drawImage(img, {
          x: (595 - width) / 2,
          y: (842 - height) / 2,
          width,
          height
        });

        const imgBytes = await imgPdf.save();
        const imgDoc = await PDFDocument.load(imgBytes);
        const pages = await mergedPdf.copyPages(imgDoc, imgDoc.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }
    }

    if (cekCV && cekCV.checked) await addFile(fileCV.files[0]);
    if (cekFoto && cekFoto.checked) await addFile(fileFoto.files[0]);
    if (cekSKCK && cekSKCK.checked) await addFile(fileSKCK.files[0]);

    if (fileLain && fileLain.files.length > 0) {
      for (let f of fileLain.files) {
        await addFile(f);
      }
    }

    return await mergedPdf.save();
  }

  // =========================
  // EXPORT PDF (LAYOUT TETAP)
  // =========================

  async function exportPDF(d, fileName) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const marginLeft = 25;
    const marginRight = 25;
    const marginTop = 30;
    const marginBottom = 30;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFont("courier", "normal");
    doc.setFontSize(12);

    if (d.kotaSurat && d.tanggalSurat) {
      doc.text(
        `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`,
        pageWidth - marginRight,
        marginTop - 10,
        { align: "right" }
      );
    }

    let y = marginTop;
    const maxWidth = pageWidth - marginLeft - marginRight;

    const header = [
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT || "",
      "Di tempat",
      ""
    ];

    const body = TEMPLATES[d.template](d);
    const lines = header.concat(body);

    lines.forEach(line => {
      const wrapped = doc.splitTextToSize(line, maxWidth);
      wrapped.forEach(w => {
        doc.text(w, marginLeft, y);
        y += 6;
      });
      if (line.trim() === "") y += 2;
    });

    const startY = pageHeight - marginBottom - 40;

    doc.text("Hormat saya,", pageWidth - marginRight, startY, { align: "right" });

    const signatureData = canvas.toDataURL("image/png");

    if (signatureData !== "data:,") {
      doc.addImage(
        signatureData,
        "PNG",
        pageWidth - marginRight - 40,
        startY + 5,
        35,
        18
      );
    }

    doc.text(
      d.namaPelamar,
      pageWidth - marginRight,
      startY + 35,
      { align: "right" }
    );

    const pdfBlob = doc.output("blob");
    const mergedBytes = await mergeAttachments(pdfBlob);
    const finalBlob = new Blob([mergedBytes], { type: "application/pdf" });

    saveAs(finalBlob, `${fileName}.pdf`);
  }

  // =========================
  // EVENTS
  // =========================

  btnPreview.addEventListener("click", () => {
    const d = getFormData();
    const lines = [
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
      "",
      ...TEMPLATES[d.template](d),
      "",
      "Hormat saya,",
      d.namaPelamar
    ];
    previewArea.innerHTML = `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const d = getFormData();
    const fileName = sanitizeFileName(
      `Lamaran - ${d.namaPelamar} - ${d.namaPT} - ${d.posisi}`
    );

    await exportPDF(d, fileName);
  });

})();