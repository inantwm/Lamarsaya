(() => {

  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  document.getElementById("year").textContent = new Date().getFullYear();

  // =========================
  // INPUT LAMPIRAN
  // =========================

  const includeCV = document.getElementById("includeCV");
  const includePasFoto = document.getElementById("includePasFoto");
  const includeSKCK = document.getElementById("includeSKCK");

  const fileCV = document.getElementById("fileCV");
  const filePasFoto = document.getElementById("filePasFoto");
  const fileSKCK = document.getElementById("fileSKCK");
  const filePendukung = document.getElementById("filePendukung");
  const berkasPendukungText = document.getElementById("berkasPendukungText");

  // =========================
  // SIGNATURE CANVAS (STABLE MOBILE)
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

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e) {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function endDraw() {
    drawing = false;
    savedSignature = canvas.toDataURL("image/png");
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

  function splitLampiranText(input) {
    return String(input || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
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
  // 4 TEMPLATE
  // =========================

  const TEMPLATES = {
    formal: (d) => {
      const id = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar],
        ["Email", d.email],
        ["No. HP", d.telepon],
      ]);
      return ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", ...id, "",
        `Dengan ini mengajukan lamaran sebagai ${d.posisi} di ${d.namaPT}.`,
        "Saya siap bekerja profesional dan bertanggung jawab."
      ];
    },

    operator: (d) => {
      const id = formatIdentitasBlock([
        ["Nama", d.namaPelamar],
        ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
        ["Pendidikan Terakhir", d.pendidikan],
        ["Alamat", d.alamatPelamar],
      ]);
      return ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", ...id, "",
        `Mengajukan lamaran posisi ${d.posisi} di ${d.namaPT}.`,
        "Saya siap bekerja shift dan mengikuti SOP."
      ];
    },

    operatoraja: (d) => [
      "Dengan hormat,", "",
      `Berdasarkan informasi lowongan pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)},`,
      `Saya bermaksud melamar sebagai ${d.posisi} di ${d.namaPT}.`
    ],

    fresh: (d) => [
      "Dengan hormat,", "",
      `Perkenalkan saya ${d.namaPelamar}, lulusan ${d.pendidikan}.`,
      `Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`
    ]
  };

  // =========================
  // BUILD LETTER
  // =========================

  function buildLetter(d) {

    const lines = [];

    if (d.kotaSurat && d.tanggalSurat) {
      lines.push(`${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`);
      lines.push("");
    }

    lines.push(
      "Perihal : Lamaran Pekerjaan",
      "",
      "Kepada Yth,",
      d.namaPT,
      d.lokasiPT || "",
      "Di tempat",
      ""
    );

    lines.push(...TEMPLATES[d.template](d));

    const lampiran = [];
    if (includeCV.checked) lampiran.push("Curriculum Vitae (CV)");
    if (includePasFoto.checked) lampiran.push("Pas Foto");
    if (includeSKCK.checked) lampiran.push("SKCK");

    lampiran.push(...splitLampiranText(berkasPendukungText.value));

    if (lampiran.length > 0) {
      lines.push("", "Sebagai bahan pertimbangan, berikut saya lampirkan:");
      lampiran.forEach((l,i)=> lines.push(`${i+1}. ${l}`));
    }

    lines.push("", "Hormat saya,");

    return lines;
  }

  // =========================
  // EXPORT PDF PROFESIONAL + MERGE
  // =========================

  async function exportPDF(d, fileName) {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:"mm", format:"a4" });

    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin*2;

    doc.setFont("courier","normal");
    doc.setFontSize(12);

    if (d.kotaSurat && d.tanggalSurat) {
      doc.text(
        `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`,
        pageWidth - margin,
        margin,
        { align:"right" }
      );
    }

    let y = margin + 15;
    const lines = buildLetter(d);

    lines.forEach(line=>{
      const wrapped = doc.splitTextToSize(line, maxWidth);
      wrapped.forEach(w=>{
        doc.text(w, margin, y);
        y+=6;
      });
      if (line.trim()==="") y+=2;
    });

    const signY = pageHeight - 55;

    doc.text("Hormat saya,", pageWidth - margin, signY, {align:"right"});

    if (savedSignature) {
      doc.addImage(savedSignature,"PNG",
        pageWidth - margin - 45,
        signY + 5,
        40,
        20
      );
    }

    doc.text(d.namaPelamar, pageWidth - margin, signY + 30, {align:"right"});

    const { PDFDocument } = window.PDFLib;
    const master = await PDFDocument.create();
    const letterBytes = doc.output("arraybuffer");
    const letterDoc = await PDFDocument.load(letterBytes);
    const pages = await master.copyPages(letterDoc, letterDoc.getPageIndices());
    pages.forEach(p=>master.addPage(p));

    const attachments = [];

    if (includeCV.checked && fileCV.files[0]) attachments.push(fileCV.files[0]);
    if (includePasFoto.checked && filePasFoto.files[0]) attachments.push(filePasFoto.files[0]);
    if (includeSKCK.checked && fileSKCK.files[0]) attachments.push(fileSKCK.files[0]);

    for (const f of (filePendukung.files || [])) attachments.push(f);

    for (const f of attachments) {

      const bytes = await f.arrayBuffer();

      if (f.type === "application/pdf") {
        const src = await PDFDocument.load(bytes);
        const pgs = await master.copyPages(src, src.getPageIndices());
        pgs.forEach(p=>master.addPage(p));
      }
      else if (f.type.startsWith("image/")) {
        const imgDoc = await PDFDocument.create();
        let img;
        if (f.type === "image/png")
          img = await imgDoc.embedPng(bytes);
        else
          img = await imgDoc.embedJpg(bytes);

        const page = imgDoc.addPage();
        const { width, height } = page.getSize();

        const scale = Math.min(width/img.width, height/img.height)*0.9;
        page.drawImage(img,{
          x:(width-img.width*scale)/2,
          y:(height-img.height*scale)/2,
          width:img.width*scale,
          height:img.height*scale
        });

        const imgBytes = await imgDoc.save();
        const finalImgDoc = await PDFDocument.load(imgBytes);
        const pgs = await master.copyPages(finalImgDoc, finalImgDoc.getPageIndices());
        pgs.forEach(p=>master.addPage(p));
      }
    }

    const finalBytes = await master.save();
    const blob = new Blob([finalBytes],{type:"application/pdf"});
    saveAs(blob, `${fileName}.pdf`);
  }

  // =========================
  // EXPORT DOCX
  // =========================

  async function exportDOCX(d,fileName){

    const { Document, Packer, Paragraph, TextRun } = window.docx;
    const lines = buildLetter(d);

    const paragraphs = lines.map(l=>
      new Paragraph({
        children:[new TextRun({text:l,font:"Times New Roman",size:24})]
      })
    );

    const doc = new Document({ sections:[{children:paragraphs}]});
    const blob = await Packer.toBlob(doc);
    saveAs(blob,`${fileName}.docx`);
  }

  // =========================
  // EVENTS
  // =========================

  btnPreview.addEventListener("click",()=>{
    const d = getFormData();
    previewArea.innerHTML="<pre>"+buildLetter(d).join("\n")+"</pre>";
  });

  form.addEventListener("submit", async(e)=>{
    e.preventDefault();
    const d = getFormData();
    const fileName = sanitizeFileName(`Lamaran - ${d.namaPelamar}`);
    if(d.mode==="pdf") await exportPDF(d,fileName);
    else await exportDOCX(d,fileName);
  });

})();