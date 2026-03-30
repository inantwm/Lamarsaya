(() => {
  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  
  // Navbar Dropdown Logic
  const profileBtn = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("myDropdown");
  if (profileBtn) {
    profileBtn.onclick = (e) => { e.stopPropagation(); dropdownMenu.classList.toggle("show"); };
  }
  window.onclick = () => dropdownMenu && dropdownMenu.classList.remove("show");

  // =========================
  // SIGNATURE CANVAS (ORISINIL)
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
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight); };
      img.src = oldData;
    }
  }
  window.onresize = resizeCanvas;
  resizeCanvas();

  let drawing = false;
  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  };
  canvas.onmousedown = (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
  canvas.onmousemove = (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  canvas.onmouseup = () => drawing = false;
  canvas.ontouchstart = (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
  canvas.ontouchmove = (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  canvas.ontouchend = () => drawing = false;
  clearBtn.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

  // =========================
  // DATA & TEMPLATES (ORISINIL)
  // =========================
  function formatTanggalIndonesia(isoDate) {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-").map(Number);
    const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${d} ${bulan[m - 1]} ${y}`;
  }

  function sanitizeFileName(name) { return name.replace(/[\\/:*?"<>|]+/g, "-"); }
  function escapeHtml(str) { return str ? str.replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }

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
      posisi: document.getElementById("posisi").value.trim(),
      template: document.getElementById("template").value,
      berkasLain: document.getElementById("berkasLain").value
    };
  }

  function getLampiranArray() {
    const list = [];
    if (document.getElementById("includeCV").checked) list.push("Curriculum Vitae (CV)");
    if (document.getElementById("includePasFoto").checked) list.push("Pas Foto");
    if (document.getElementById("includeSKCK").checked) list.push("SKCK");
    const lain = document.getElementById("berkasLain").value;
    if (lain) list.push(...lain.split(',').map(s => s.trim()).filter(s => s !== ""));
    return [...new Set(list)];
  }

  const TEMPLATES = {
    formal: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[IDENTITAS]]", "", `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.namaPT} sebagai ${d.posisi}.`, "Saya memiliki motivasi kerja yang tinggi, disiplin, dan mampu bekerja secara individu maupun tim.", "", "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."],
    operator: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[IDENTITAS]]", "", `Dengan ini saya mengajukan lamaran kerja untuk posisi ${d.posisi} di ${d.namaPT}.`, "Saya terbiasa bekerja mengikuti SOP, menjaga kualitas, dan siap bekerja dengan sistem shift.", "", "Saya siap mengikuti proses interview sesuai jadwal yang ditentukan."],
    operatoraja: (d) => ["Dengan hormat,", "", `Berdasarkan informasi lowongan kerja yang saya peroleh pada tanggal ${formatTanggalIndonesia(d.tanggalSurat)}, bahwa perusahaan yang Bapak/Ibu pimpin membutuhkan tenaga kerja sebagai ${d.posisi}, dengan ini saya mengajukan lamaran.`, "[[IDENTITAS]]", "", `Mengajukan permohonan untuk menjadi tenaga kerja di ${d.namaPT} sebagai ${d.posisi}.`],
    fresh: (d) => ["Dengan hormat,", "", `Perkenalkan, saya ${d.namaPelamar} (${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}), lulusan ${d.pendidikan}.`, `Saya bermaksud melamar posisi ${d.posisi} di ${d.namaPT}.`, "", "Saya memiliki kemauan belajar yang tinggi, cepat beradaptasi, dan siap berkembang bersama perusahaan.", "", `Kontak saya: ${d.telepon} | ${d.email}`]
  };

  // =========================
  // PREVIEW (SINKRON ORISINIL)
  // =========================
  btnPreview.onclick = () => {
    const d = getFormData();
    const lampiran = getLampiranArray();
    const templateLines = TEMPLATES[d.template](d);
    const tglText = d.kotaSurat && d.tanggalSurat ? `${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}` : "";
    
    let html = `<div style="font-family:'Times New Roman', serif; font-size:14px; color:#000;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                  <span>${lampiran.length > 0 ? 'Lampiran : ' + lampiran.length + ' Berkas' : 'Perihal : Lamaran Pekerjaan'}</span>
                  <span>${tglText}</span>
                </div>
                ${lampiran.length > 0 ? '<p style="margin:0">Perihal : Lamaran Pekerjaan</p>' : ''}
                <br><p>Kepada Yth,<br>${d.namaPT}<br>Di tempat</p><br>`;

    templateLines.forEach(line => {
      if (line === "[[IDENTITAS]]") {
        const idenData = [["Nama", d.namaPelamar], ["Tempat/Tgl Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`], ["Pendidikan", d.pendidikan], ["Alamat", d.alamatPelamar], ["Email", d.email], ["No. HP", d.telepon]];
        idenData.forEach(item => {
          html += `<div style="display: flex; margin-bottom: 2px;"><div style="width: 140px;">${item[0]}</div><div style="width: 20px; text-align: center;">:</div><div style="flex: 1;">${item[1]}</div></div>`;
        });
      } else { html += `<p style="margin: 0; text-align: justify;">${escapeHtml(line)}</p>`; }
    });

    if (lampiran.length > 0) {
      html += `<br><p>Sebagai bahan pertimbangan, saya lampirkan:</p>`;
      lampiran.forEach((item, i) => { html += `<p style="margin:0;">${i + 1}. ${item}</p>`; });
    }

    html += `<br><p style="text-align: justify;">Demikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.</p>
             <div style="text-align:right; margin-top:30px; padding-right:20px;">
               <p>Hormat saya,</p>
               <div style="margin-bottom:10px;"><img src="${canvas.toDataURL()}" style="height:60px; display:${canvas.toDataURL()==="data:,"?'none':'inline-block'}"></div>
               <p><b>${d.namaPelamar}</b></p>
             </div></div>`;
    previewArea.innerHTML = html;
    badgeStatus.textContent = "Preview Siap";
  };

  // =========================
  // DOWNLOAD (ORISINIL PRESISI)
  // =========================
  form.onsubmit = async (e) => {
    e.preventDefault();
    badgeStatus.textContent = "Proses...";
    const d = getFormData();
    const { jsPDF } = window.jspdf;
    const { PDFDocument } = window.PDFLib;
    
    const doc = new jsPDF();
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    
    let y = 30;
    const margin = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const lampiran = getLampiranArray();

    if (d.kotaSurat && d.tanggalSurat) doc.text(`${d.kotaSurat}, ${formatTanggalIndonesia(d.tanggalSurat)}`, pageWidth - margin, y, { align: "right" });
    doc.text(lampiran.length > 0 ? `Lampiran : ${lampiran.length} Berkas` : `Perihal : Lamaran Pekerjaan`, margin, y);
    y += 15;

    doc.text("Kepada Yth,", margin, y);
    doc.text(d.namaPT, margin, y + 5);
    doc.text("Di tempat", margin, y + 10);
    y += 25;

    TEMPLATES[d.template](d).forEach(line => {
      if (line === "[[IDENTITAS]]") {
        const idenData = [["Nama", d.namaPelamar], ["Tempat/Tgl Lahir", `${d.tempatLahir}, ${formatTanggalIndonesia(d.tglLahir)}`], ["Pendidikan", d.pendidikan], ["Alamat", d.alamatPelamar], ["Email", d.email], ["No. HP", d.telepon]];
        idenData.forEach(item => {
          doc.text(item[0], margin, y); doc.text(":", margin + 42, y); doc.text(item[1], margin + 46, y);
          y += 6;
        });
      } else if (line === "") { y += 4; }
      else { 
        const split = doc.splitTextToSize(line, 160); 
        doc.text(split, margin, y); 
        y += (split.length * 6); 
      }
    });

    if (lampiran.length > 0) {
      y += 5; doc.text("Sebagai bahan pertimbangan, saya lampirkan:", margin, y); y += 6;
      lampiran.forEach((item, i) => { doc.text(`${i + 1}. ${item}`, margin, y); y += 6; });
    }

    y += 10; doc.text("Demikian surat lamaran ini saya sampaikan. Terima kasih.", margin, y);
    y += 20; doc.text("Hormat saya,", 190, y, { align: "right" });
    if (canvas.toDataURL() !== "data:,") doc.addImage(canvas.toDataURL(), "PNG", 155, y + 2, 35, 15);
    doc.setFont("times", "bold"); doc.text(d.namaPelamar, 190, y + 25, { align: "right" });

    // MERGE PDF
    const master = await PDFDocument.create();
    const letterBytes = await doc.output("arraybuffer");
    const letterPdf = await PDFDocument.load(letterBytes);
    (await master.copyPages(letterPdf, letterPdf.getPageIndices())).forEach(p => master.addPage(p));

    // Handle Lampiran Files
    const files = [];
    ["fileCV", "filePasFoto", "fileSKCK"].forEach(id => {
      const inp = document.getElementById(id);
      if(inp && inp.files[0]) files.push(inp.files[0]);
    });
    const extra = document.getElementById("filePendukung").files;
    if(extra) Array.from(extra).forEach(f => files.push(f));

    for (const f of files) {
      const bytes = await f.arrayBuffer();
      const ext = f.name.split('.').pop().toLowerCase();
      if(ext === "pdf") {
        const src = await PDFDocument.load(bytes);
        (await master.copyPages(src, src.getPageIndices())).forEach(p => master.addPage(p));
      } else if(["jpg","jpeg","png"].includes(ext)) {
        const img = ext === "png" ? await master.embedPng(bytes) : await master.embedJpg(bytes);
        const p = master.addPage();
        const sc = Math.min((p.getSize().width-40)/img.width, (p.getSize().height-40)/img.height);
        p.drawImage(img, { x:(p.getSize().width-img.width*sc)/2, y:(p.getSize().height-img.height*sc)/2, width:img.width*sc, height:img.height*sc });
      }
    }

    const finalBytes = await master.save();
    saveAs(new Blob([finalBytes], { type: "application/pdf" }), `Lamaran_${d.namaPelamar}.pdf`);
    badgeStatus.textContent = "Selesai";
  };
})();
