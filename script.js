(() => {

  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  document.getElementById("year").textContent = new Date().getFullYear();

  // =========================
  // FILE LAMPIRAN
  // =========================

  const includeCV = document.getElementById("includeCV");
  const includePasFoto = document.getElementById("includePasFoto");
  const includeSKCK = document.getElementById("includeSKCK");

  const fileCV = document.getElementById("fileCV");
  const filePasFoto = document.getElementById("filePasFoto");
  const fileSKCK = document.getElementById("fileSKCK");
  const filePendukung = document.getElementById("filePendukung");

  // =========================
  // SIGNATURE CANVAS (ANTI HILANG MOBILE)
  // =========================

  const canvas = document.getElementById("signaturePad");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearTtd");

  let savedSignature = null;

  function resizeCanvas() {
    if (canvas.width > 0 && canvas.height > 0) {
      savedSignature = canvas.toDataURL();
    }

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    if (savedSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = savedSignature;
    }
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

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
    savedSignature = canvas.toDataURL();
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
    savedSignature = null;
  });

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
    return `${d} ${bulan[m-1]} ${y}`;
  }

  function sanitizeFileName(name) {
    return name.replace(/[\\/:*?"<>|]+/g, "-");
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
      mode: modeEkspor.value
    };
  }

  // =========================
  // 4 TEMPLATE LENGKAP
  // =========================

  const TEMPLATES = {

    formal: (d) => {
      const identitas = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar],
        ["Email", d.email],
        ["No. HP", d.telepon]
      ]);

      return [
        "Dengan hormat,",
        "",
        "Saya yang bertanda tangan di bawah ini:",
        ...identitas,
        "",
        `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.namaPT} sebagai ${d.posisi}.`,
        "Saya memiliki motivasi kerja yang tinggi dan siap bekerja secara profesional.",
      ];
    },

    operator: (d) => {
      const identitas = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar]
      ]);

      return [
        "Dengan hormat,",
        "",
        "Saya yang bertanda tangan di bawah ini:",
        ...identitas,
        "",
        `Dengan ini saya mengajukan lamaran untuk posisi ${d.posisi} di ${d.namaPT}.`,
        "Saya siap bekerja shift dan mengikuti SOP perusahaan."
      ];
    },

    operatoraja: (d) => {
      const identitas = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar]
      ]);

      return [
        "Dengan hormat,",
        "",
        `Berdasarkan informasi lowongan pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)},`,
        `bahwa perusahaan membutuhkan tenaga kerja sebagai ${d.posisi}.`,
        "",
        ...identitas,
        "",
        `Mengajukan permohonan untuk menjadi tenaga kerja di ${d.namaPT}.`
      ];
    },

    fresh: (d) => [
      "Dengan hormat,",
      "",
      `Perkenalkan saya ${d.namaPelamar}, lulusan ${d.pendidikan}.`,
      `Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`,
      "",
      "Saya siap belajar dan berkembang bersama perusahaan."
    ]

  };

  // =========================
  // BUILD LETTER
  // =========================

  function buildLetter(d) {

    const header = [];

    if (d.kotaSurat && d.tanggalSurat) {
      header.push(`${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`);
      header.push("");
    }

    header.push(
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT || "",
      "Di tempat",
      ""
    );

    const body = TEMPLATES[d.template](d);

    const lampiranList = [];

    if (includeCV.checked) lampiranList.push("Curriculum Vitae (CV)");
    if (includePasFoto.checked) lampiranList.push("Pas Foto");
    if (includeSKCK.checked) lampiranList.push("SKCK");

    const lampiranSection = lampiranList.length > 0
      ? ["", "Sebagai bahan pertimbangan, berikut saya lampirkan:", ...lampiranList.map((l,i)=>`${i+1}. ${l}`)]
      : [];

    const closing = [
      "",
      "Hormat saya,"
    ];

    return header.concat(body).concat(lampiranSection).concat(closing);
  }

  // =========================
  // EXPORT PDF PROFESIONAL
  // =========================

  async function exportPDF(d, fileName) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;

    doc.setFont("courier","normal");
    doc.setFontSize(12);

    let y = margin;

    const lines = buildLetter(d);

    lines.forEach(line=>{
      const wrapped = doc.splitTextToSize(line, maxWidth);
      wrapped.forEach(w=>{
        doc.text(w, margin, y);
        y += 6;
      });
      if (line.trim()==="") y+=2;
    });

    const signatureY = pageHeight - 55;

    doc.text("Hormat saya,", pageWidth - margin, signatureY, {align:"right"});

    if (savedSignature) {
      doc.addImage(
        savedSignature,
        "PNG",
        pageWidth - margin - 45,
        signatureY + 5,
        40,
        20
      );
    }

    doc.text(d.namaPelamar, pageWidth - margin, signatureY + 30, {align:"right"});

    // ===== MERGE LAMPIRAN =====

    const { PDFDocument } = window.PDFLib;
    const master = await PDFDocument.create();
    const letterBytes = doc.output("arraybuffer");

    const letterDoc = await PDFDocument.load(letterBytes);
    const letterPages = await master.copyPages(letterDoc, letterDoc.getPageIndices());
    letterPages.forEach(p=>master.addPage(p));

    const attachments = [];

    if (includeCV.checked && fileCV.files[0]) attachments.push(fileCV.files[0]);
    if (includePasFoto.checked && filePasFoto.files[0]) attachments.push(filePasFoto.files[0]);
    if (includeSKCK.checked && fileSKCK.files[0]) attachments.push(fileSKCK.files[0]);
    for (const f of (filePendukung.files || [])) attachments.push(f);

    for (const f of attachments) {
      if (f.type === "application/pdf") {
        const bytes = await f.arrayBuffer();
        const src = await PDFDocument.load(bytes);
        const pages = await master.copyPages(src, src.getPageIndices());
        pages.forEach(p=>master.addPage(p));
      }
    }

    const finalBytes = await master.save();
    const blob = new Blob([finalBytes], {type:"application/pdf"});
    saveAs(blob, `${fileName}.pdf`);
  }

  // =========================
  // EVENTS
  // =========================

  btnPreview.addEventListener("click",()=>{
    const d = getFormData();
    const lines = buildLetter(d);
    previewArea.innerHTML = "<pre>"+lines.join("\n")+"</pre>";
  });

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const d = getFormData();
    const fileName = sanitizeFileName(`Lamaran - ${d.namaPelamar}`);
    await exportPDF(d, fileName);
  });

})();