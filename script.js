(() => {

  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  document.getElementById("year").textContent = new Date().getFullYear();

  // =========================
  // SIGNATURE CANVAS
  // =========================

  const canvas = document.getElementById("signaturePad");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearTtd");

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

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
      mode: modeEkspor.value
    };
  }

  // =========================
  // TEMPLATES
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
        "Saya memiliki motivasi kerja yang tinggi, disiplin, dan mampu bekerja secara individu maupun tim.",
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
        "Saya terbiasa bekerja mengikuti SOP, menjaga kualitas, dan siap bekerja dengan sistem shift.",
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
        `Berdasarkan informasi lowongan kerja yang saya peroleh pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)}, bahwa perusahaan yang Bapak/Ibu pimpin membutuhkan tenaga kerja sebagai ${d.posisi}, dengan ini saya mengajukan lamaran.`,
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
      "Saya memiliki kemauan belajar yang tinggi, cepat beradaptasi, dan siap berkembang bersama perusahaan.",
      "",
      `Kontak saya: ${d.telepon} | ${d.email}`
    ]
  };

  // =========================
  // PREVIEW
  // =========================

  function buildPreview(d) {

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

    const closing = [
      "",
      "Hormat saya,",
      d.namaPelamar
    ];

    return header.concat(TEMPLATES[d.template](d)).concat(closing);
  }

  function renderPreview(lines) {
    previewArea.innerHTML = `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
  }

  // =========================
  // EXPORT PDF
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

    const bottomY = pageHeight - marginBottom;

    const signatureHeight = 18;
const spacingAfterHormat = 10;

const startY = pageHeight - marginBottom - 40;

// 1️⃣ Hormat saya (paling atas)
doc.text("Hormat saya,", pageWidth - marginRight, startY, { align: "right" });

// 2️⃣ Tanda tangan (di tengah)
const signatureData = canvas.toDataURL("image/png");

if (signatureData !== "data:,") {
  doc.addImage(
    signatureData,
    "PNG",
    pageWidth - marginRight - 40,
    startY + 5,
    35,
    signatureHeight
  );
}

// 3️⃣ Nama (paling bawah)
doc.text(
  d.namaPelamar,
  pageWidth - marginRight,
  startY + signatureHeight + 15,
  { align: "right" }
);

    doc.save(`${fileName}.pdf`);
  }

  // =========================
  // EXPORT DOCX
  // =========================

  async function exportDOCX(d, fileName) {

    const { Document, Packer, Paragraph, TextRun, AlignmentType } = window.docx;

    const children = [];

    if (d.kotaSurat && d.tanggalSurat) {
      children.push(new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun(`${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`)]
      }));
    }

    children.push(new Paragraph(""));

    const header = [
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT || "",
      "Di tempat",
      ""
    ];

    header.forEach(line => children.push(new Paragraph(line)));
    TEMPLATES[d.template](d).forEach(line => children.push(new Paragraph(line)));

    children.push(new Paragraph(""));
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun("Hormat saya,")]
    }));

    children.push(new Paragraph(""));
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun(d.namaPelamar)]
    }));

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1700, bottom: 1700, left: 1700, right: 1700 }
          }
        },
        children
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  }

  // =========================
  // EVENTS
  // =========================

  btnPreview.addEventListener("click", () => {
    const d = getFormData();
    renderPreview(buildPreview(d));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const d = getFormData();
    const fileName = sanitizeFileName(
      `Lamaran - ${d.namaPelamar} - ${d.namaPT} - ${d.posisi}`
    );

    if (d.mode === "pdf") {
      await exportPDF(d, fileName);
    } else {
      await exportDOCX(d, fileName);
    }
  });

})();