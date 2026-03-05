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
    const oldData = canvas.toDataURL();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
    if (oldData !== "data:,") {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio); };
      img.src = oldData;
    }
  }
  resizeCanvas();

  let drawing = false;
  function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  }
  function startDraw(e) { drawing = true; ctx.beginPath(); const p = getPosition(e); ctx.moveTo(p.x, p.y); }
  function draw(e) { if (!drawing) return; e.preventDefault(); const p = getPosition(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
  function endDraw() { drawing = false; }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
  clearBtn.addEventListener("click", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });

  // =========================
  // UTIL
  // =========================
  function formatTanggalIndonesia(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-").map(Number);
    const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${d} ${bulan[m - 1]} ${y}`;
  }

  function sanitizeFileName(name) { return name.replace(/[\\/:*?"<>|]+/g, "-"); }
  function escapeHtml(str) { return str.replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function getFormData() {
    return {
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
      berkasText: document.getElementById("berkasPendukungText").value
    };
  }

  function getLampiranArray() {
    const list = [];
    if (document.getElementById("includeCV").checked) list.push("Curriculum Vitae (CV)");
    if (document.getElementById("includePasFoto").checked) list.push("Pas Foto");
    if (document.getElementById("includeSKCK").checked) list.push("SKCK");
    const customList = document.getElementById("berkasPendukungText").value.split(/[,\n]/).map(s => s.trim()).filter(s => s !== "");
    list.push(...customList);
    return [...new Set(list)];
  }

  function getIdentitasData(d) {
    return [
      ["Nama", d.namaPelamar],
      ["Tempat/Tanggal Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`],
      ["Pendidikan Terakhir", d.pendidikan],
      ["Alamat", d.alamatPelamar],
      ["Email", d.email],
      ["No. HP", d.telepon]
    ];
  }

  const TEMPLATES = {
    formal: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[IDENTITAS]]", "", `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.namaPT} sebagai ${d.posisi}.`, "Saya memiliki motivasi kerja yang tinggi, disiplin, dan mampu bekerja secara individu maupun tim.", "", "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."],
    operator: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[IDENTITAS]]", "", `Dengan ini saya mengajukan lamaran kerja untuk posisi ${d.posisi} di ${d.namaPT}.`, "Saya terbiasa bekerja mengikuti SOP, menjaga kualitas, dan siap bekerja dengan sistem shift.", "", "Saya siap mengikuti proses interview sesuai jadwal yang ditentukan."],
    operatoraja: (d) => ["Dengan hormat,", "", `Berdasarkan informasi lowongan kerja yang saya peroleh pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)}, bahwa perusahaan yang Bapak/Ibu pimpin membutuhkan tenaga kerja sebagai ${d.posisi}, dengan ini saya mengajukan lamaran.`, "[[IDENTITAS]]", "", `Mengajukan permohonan untuk menjadi tenaga kerja di ${d.namaPT} sebagai ${d.posisi}.`],
    fresh: (d) => ["Dengan hormat,", "", `Perkenalkan, saya ${d.namaPelamar} (${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}), lulusan ${d.pendidikan}.`, `Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`, "", "Saya memiliki kemauan belajar yang tinggi, cepat beradaptasi, dan siap berkembang bersama perusahaan.", "", `Kontak saya: ${d.telepon} | ${d.email}`]
  };

  // =========================
  // PREVIEW (Sesuai Garis Merah)
  // =========================
  function renderPreview() {
    const d = getFormData();
    const lampiran = getLampiranArray();
    const templateLines = TEMPLATES[d.template](d);
    const idenData = getIdentitasData(d);
    const tglText = d.kotaSurat && d.tanggalSurat ? `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}` : "";
    
    let headerLeft = lampiran.length > 0 ? `Lampiran : ${lampiran.length} Berkas` : `Perihal : Lamaran Pekerjaan`;
    let subHeader = lampiran.length > 0 ? `<p>Perihal : Lamaran Pekerjaan</p>` : "";

    let html = `<div style="display:flex; justify-content:space-between; font-family:'Times New Roman', Times, serif; font-size:14px; margin-bottom:10px;">
                  <span>${headerLeft}</span>
                  <span>${tglText}</span>
                </div>`;
    
    html += `<div style="font-family:'Times New Roman', Times, serif; font-size:14px; line-height:1.4;">
              ${subHeader}
              <br>
              <p>Kepada Yth,<br>${d.namaPT}<br>${d.lokasiPT || ""}<br>Di tempat</p>
              <br>`;

    templateLines.forEach(line => {
      if (line === "[[IDENTITAS]]") {
        idenData.forEach(item => {
          html += `<div style="display: flex; margin-bottom: 2px;">
                     <div style="width: 140px;">${item[0]}</div>
                     <div style="width: 20px; text-align: center;">:</div>
                     <div style="flex: 1;">${item[1]}</div>
                   </div>`;
        });
      } else {
        html += `<p style="margin: 0;">${escapeHtml(line)}</p>`;
      }
    });

    if (lampiran.length > 0) {
      html += `<br><p>Sebagai bahan pertimbangan, saya lampirkan:</p>`;
      lampiran.forEach((item, i) => { html += `<p style="margin:0;">${i + 1}. ${item}</p>`; });
    }

    html += `<br><p>Demikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.</p>
             <div style="text-align:right; margin-top:30px;">
               <p>Hormat saya,</p>
               <div style="height:60px;"></div>
               <p><b>${d.namaPelamar}</b></p>
             </div>
            </div>`;

    previewArea.innerHTML = html;
    badgeStatus.textContent = "Preview Siap";
  }

  // =========================
  // EXPORT PDF (PRESISI KOORDINAT)
  // =========================
  async function exportPDF(d, fileName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - (margin * 2);
    const lampiran = getLampiranArray();

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    let y = 25;

    // 1. Header & Tanggal
    if (d.kotaSurat && d.tanggalSurat) {
      doc.text(`${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`, pageWidth - margin, y, { align: "right" });
    }
    if (lampiran.length > 0) {
      doc.text(`Lampiran : ${lampiran.length} Berkas`, margin, y);
      doc.text(`Perihal   : Lamaran Pekerjaan`, margin, y + 5);
      y += 15;
    } else {
      doc.text(`Perihal   : Lamaran Pekerjaan`, margin, y);
      y += 10;
    }
    
    // 2. Tujuan Surat
    doc.text("Kepada Yth,", margin, y);
    doc.text(d.namaPT, margin, y + 5);
    doc.text(d.lokasiPT || "", margin, y + 10);
    doc.text("Di tempat", margin, y + 15);
    y += 25;

    const bodyLines = TEMPLATES[d.template](d);
    const idenData = getIdentitasData(d);
    
    // POSISI X UNTUK TITIK DUA (Sama untuk semua baris)
    const dotPositionX = margin + 42; 
    const contentPositionX = dotPositionX + 4;

    // 3. Body & Identitas
    bodyLines.forEach(line => {
      if (line === "[[IDENTITAS]]") {
        idenData.forEach(item => {
          doc.text(item[0], margin, y); // Nama Label
          doc.text(":", dotPositionX, y); // Titik Dua di koordinat X yang tetap
          
          // Value (Handle jika teks terlalu panjang, seperti alamat)
          const valLines = doc.splitTextToSize(item[1], pageWidth - contentPositionX - margin);
          doc.text(valLines, contentPositionX, y);
          y += (valLines.length * 5.5);
        });
      } else if (line.trim() === "") {
        y += 3;
      } else {
        const wrapped = doc.splitTextToSize(line, maxWidth);
        doc.text(wrapped, margin, y);
        y += (wrapped.length * 5.5);
      }
    });

    // 4. Lampiran & Penutup
    if (lampiran.length > 0) {
      y += 5;
      doc.text("Sebagai bahan pertimbangan, saya lampirkan:", margin, y);
      y += 6;
      lampiran.forEach((item, i) => {
        doc.text(`${i + 1}. ${item}`, margin, y);
        y += 5.5;
      });
    }

    y += 5;
    const closing = doc.splitTextToSize("Demikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.", maxWidth);
    doc.text(closing, margin, y);

    // 5. TTD
    const footerY = 240;
    doc.text("Hormat saya,", pageWidth - margin, footerY, { align: "right" });
    const sig = canvas.toDataURL("image/png");
    if (sig !== "data:,") doc.addImage(sig, "PNG", pageWidth - margin - 35, footerY + 2, 30, 15);
    doc.setFont("times", "bold");
    doc.text(d.namaPelamar, pageWidth - margin, footerY + 22, { align: "right" });

    // 6. MERGE FILES
    const { PDFDocument } = window.PDFLib;
    if (PDFDocument) {
      const master = await PDFDocument.create();
      const letterDoc = await PDFDocument.load(doc.output("arraybuffer"));
      const pgs = await master.copyPages(letterDoc, letterDoc.getPageIndices());
      pgs.forEach(p => master.addPage(p));
      
      const fileIds = ["fileCV", "filePasFoto", "fileSKCK"];
      const files = [];
      fileIds.forEach(id => { if(document.getElementById(id).files[0]) files.push(document.getElementById(id).files[0]); });
      const extra = document.getElementById("filePendukung").files;
      if(extra) Array.from(extra).forEach(f => files.push(f));
      
      for (const f of files) {
        const bytes = await f.arrayBuffer();
        const ext = f.name.split('.').pop().toLowerCase();
        if (ext === "pdf") {
          const src = await PDFDocument.load(bytes);
          const copied = await master.copyPages(src, src.getPageIndices());
          copied.forEach(p => master.addPage(p));
        } else if (["jpg","jpeg","png"].includes(ext)) {
          const img = ext === "png" ? await master.embedPng(bytes) : await master.embedJpg(bytes);
          const page = master.addPage();
          const scale = Math.min((page.getSize().width-40)/img.width, (page.getSize().height-40)/img.height);
          page.drawImage(img, { x:(page.getSize().width-img.width*scale)/2, y:(page.getSize().height-img.height*scale)/2, width:img.width*scale, height:img.height*scale });
        }
      }
      const finalBytes = await master.save();
      saveAs(new Blob([finalBytes], {type:"application/pdf"}), `${fileName}.pdf`);
    } else {
      doc.save(`${fileName}.pdf`);
    }
  }

  // =========================
  // EXPORT DOCX (Sesuai Layout)
  // =========================
  async function exportDOCX(d, fileName) {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = window.docx;
    const lampiran = getLampiranArray();
    const templateLines = TEMPLATES[d.template](d);
    const idenData = getIdentitasData(d);
    const font = "Times New Roman";
    const size = 24; 

    const children = [
      new Paragraph({
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: lampiran.length > 0 ? `Lampiran : ${lampiran.length} Berkas` : `Perihal   : Lamaran Pekerjaan`, font, size }),
          new TextRun({ text: "\t\t\t\t\t\t", font, size }),
          new TextRun({ text: `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`, font, size })
        ]
      })
    ];

    if (lampiran.length > 0) children.push(new Paragraph({ children: [new TextRun({ text: "Perihal   : Lamaran Pekerjaan", font, size })] }));

    children.push(
      new Paragraph(""),
      new Paragraph({ children: [new TextRun({ text: "Kepada Yth,", font, size })] }),
      new Paragraph({ children: [new TextRun({ text: d.namaPT, font, size, bold: true })] }),
      new Paragraph({ children: [new TextRun({ text: d.lokasiPT || "", font, size })] }),
      new Paragraph({ children: [new TextRun({ text: "Di tempat", font, size })] }),
      new Paragraph("")
    );

    const noBorder = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

    templateLines.forEach(line => {
      if (line === "[[IDENTITAS]]") {
        const rows = idenData.map(item => new TableRow({
          children: [
            new TableCell({ width: { size: 140, type: WidthType.DXA }, borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: item[0], font, size })] })] }),
            new TableCell({ width: { size: 200, type: WidthType.DXA }, borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: ":", font, size })] })] }),
            new TableCell({ width: { size: 3000, type: WidthType.DXA }, borders: noBorder, children: [new Paragraph({ children: [new TextRun({ text: item[1], font, size })] })] }),
          ]
        }));
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: BorderStyle.NONE, bottom: BorderStyle.NONE, left: BorderStyle.NONE, right: BorderStyle.NONE, insideHorizontal: BorderStyle.NONE, insideVertical: BorderStyle.NONE }, rows }));
      } else {
        children.push(new Paragraph({ children: [new TextRun({ text: line, font, size })] }));
      }
    });

    if (lampiran.length > 0) {
      children.push(new Paragraph(""), new Paragraph({ children: [new TextRun({ text: "Sebagai bahan pertimbangan, saya lampirkan:", font, size })] }));
      lampiran.forEach((item, i) => children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${item}`, font, size })] })));
    }

    children.push(new Paragraph(""), new Paragraph({ children: [new TextRun({ text: "Demikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.", font, size })] }));
    children.push(new Paragraph(""), new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Hormat saya,", font, size })] }));
    children.push(new Paragraph(""), new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: d.namaPelamar, font, size, bold: true })] }));

    const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  }

  // =========================
  // EVENTS
  // =========================
  btnPreview.addEventListener("click", renderPreview);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    badgeStatus.textContent = "Sedang Memproses...";
    const d = getFormData();
    const fileName = sanitizeFileName(`Lamaran - ${d.namaPelamar} - ${d.namaPT}`);
    if (d.mode === "pdf") await exportPDF(d, fileName);
    else await exportDOCX(d, fileName);
    badgeStatus.textContent = "Selesai";
  });
})();
