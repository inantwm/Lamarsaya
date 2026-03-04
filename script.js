(() => {

  // ================================
  // ELEMENT
  // ================================
  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  const fileTtdUpload = document.getElementById("fileTtd"); // upload image ttd
  const canvas = document.getElementById("signaturePad");   // canvas ttd
  const ctx = canvas ? canvas.getContext("2d") : null;
  const fileLampiran = document.getElementById("fileLampiran");

  document.getElementById("year").textContent = new Date().getFullYear();

  let drawing = false;

  // ================================
  // UTIL
  // ================================
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
    return String(name)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .slice(0, 100);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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

  // ================================
  // SIGNATURE PAD (MOBILE SAFE)
  // ================================
  if (canvas && ctx) {

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

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function startDraw(e) {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!drawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stopDraw() {
      drawing = false;
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);

    canvas.addEventListener("touchstart", startDraw);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDraw);
  }

  // ================================
  // TEMPLATE
  // ================================
  const TEMPLATES = {

    formal: (d) => [
      "Dengan hormat,",
      "",
      `Saya ${d.namaPelamar}, bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`,
      "Saya memiliki motivasi tinggi dan siap bekerja profesional.",
      "",
      "Besar harapan saya untuk mengikuti proses seleksi lebih lanjut."
    ],

    operator: (d) => [
      "Dengan hormat,",
      "",
      `Saya mengajukan lamaran sebagai ${d.posisi} di ${d.namaPT}.`,
      "Saya siap bekerja shift dan mengikuti SOP perusahaan.",
      "",
      "Terima kasih atas perhatian Bapak/Ibu."
    ],

    fresh: (d) => [
      "Dengan hormat,",
      "",
      `Perkenalkan saya ${d.namaPelamar}, lulusan ${d.pendidikan}.`,
      `Saya berminat melamar sebagai ${d.posisi}.`,
      "",
      "Saya siap belajar dan berkembang."
    ]
  };

  // ================================
  // PREVIEW
  // ================================
  function buildPreview(d) {
    const header = [
      `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`,
      "",
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT,
      "Di tempat",
      ""
    ];

    const closing = [
      "",
      "Hormat saya,",
      "(Tanda Tangan)",
      d.namaPelamar
    ];

    return header.concat(TEMPLATES[d.template](d)).concat(closing);
  }

  function renderPreview(lines) {
    previewArea.innerHTML = `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
  }

  // ================================
  // EXPORT PDF + LAMPIRAN
  // ================================
  async function exportPDF(d, fileName) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    let y = 30;
    const marginLeft = 25;
    const pageWidth = doc.internal.pageSize.getWidth();

    const lines = buildPreview(d);

    lines.forEach(line => {
      doc.text(line, marginLeft, y);
      y += 7;
    });

    // Signature
    let signatureImage = null;

    if (fileTtdUpload && fileTtdUpload.files[0]) {
      signatureImage = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(fileTtdUpload.files[0]);
      });
    } else if (canvas) {
      const data = canvas.toDataURL("image/png");
      if (data !== "data:,") signatureImage = data;
    }

    if (signatureImage) {
      doc.addImage(signatureImage, "PNG",
        pageWidth - 70,
        doc.internal.pageSize.getHeight() - 60,
        40,
        20
      );
    }

    // Lampiran
    if (fileLampiran && fileLampiran.files.length > 0) {
      doc.addPage();
      doc.text("Lampiran:", 25, 30);
      let yy = 40;
      Array.from(fileLampiran.files).forEach(f => {
        doc.text("- " + f.name, 30, yy);
        yy += 8;
      });
    }

    doc.save(`${fileName}.pdf`);
  }

  // ================================
  // EVENTS
  // ================================
  btnPreview.addEventListener("click", () => {
    renderPreview(buildPreview(getFormData()));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const d = getFormData();
    const fileName = sanitizeFileName(
      `Lamaran - ${d.namaPelamar} - ${d.namaPT}`
    );

    await exportPDF(d, fileName);
  });

})();