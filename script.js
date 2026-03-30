(() => {
  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  const canvas = document.getElementById("signaturePad");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearTtd");

  // --- Signature Logic ---
  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const oldData = canvas.toDataURL();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
    if (oldData !== "data:,") {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      img.src = oldData;
    }
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  let drawing = false;
  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  };
  canvas.addEventListener("mousedown", (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener("mousemove", (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("touchstart", (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); }, {passive: false});
  canvas.addEventListener("touchmove", (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, {passive: false});
  canvas.addEventListener("touchend", () => drawing = false);
  clearBtn.addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));

  const fmtTgl = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const bln = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${d} ${bln[m-1]} ${y}`;
  };

  const getLampiran = () => {
    let list = [];
    if (document.getElementById("includeCV").checked) list.push("Curriculum Vitae (CV)");
    if (document.getElementById("includePasFoto").checked) list.push("Pas Foto");
    if (document.getElementById("includeSKCK").checked) list.push("SKCK");
    const lain = document.getElementById("berkasLain").value;
    if (lain) list = [...list, ...lain.split(',').map(s => s.trim()).filter(s => s !== "")];
    return list;
  };

  const getFormData = () => ({
    nama: document.getElementById("namaPelamar").value.trim(),
    tempat: document.getElementById("tempatLahir").value.trim(),
    tglLahir: document.getElementById("tglLahir").value,
    pendidikan: document.getElementById("pendidikan").value.trim(),
    alamat: document.getElementById("alamatPelamar").value.trim(),
    email: document.getElementById("email").value.trim(),
    telepon: document.getElementById("telepon").value.trim(),
    kota: document.getElementById("kotaSurat").value.trim(),
    tglSurat: document.getElementById("tanggalSurat").value,
    pt: document.getElementById("namaPT").value.trim(),
    posisi: document.getElementById("posisi").value.trim(),
    template: document.getElementById("template").value,
    mode: document.getElementById("modeEkspor").value
  });

  const TEMPLATES = {
    formal: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.pt} sebagai ${d.posisi}.`, "Saya memiliki motivasi kerja yang tinggi, disiplin, dan mampu bekerja secara individu maupun tim.", "", "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."],
    operator: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Mengajukan lamaran kerja sebagai ${d.posisi} di ${d.pt}.`, "Saya terbiasa bekerja mengikuti SOP, menjaga kualitas, dan siap bekerja dengan sistem shift.", "", "Saya siap mengikuti proses interview sesuai jadwal yang ditentukan."],
    fresh: (d) => ["Dengan hormat,", "", `Perkenalkan, saya ${d.nama} (${d.tempat}, ${fmtTgl(d.tglLahir)}), lulusan ${d.pendidikan}.`, `Saya bermaksud melamar posisi ${d.posisi} di ${d.pt}.`, "", "Saya memiliki kemauan belajar yang tinggi, cepat beradaptasi, dan siap berkembang bersama perusahaan.", "", `Kontak saya: ${d.telepon} | ${d.email}`]
  };

  // --- Render Preview ---
  function render() {
    const d = getFormData();
    const lampiran = getLampiran();
    const lines = TEMPLATES[d.template](d);
    const tglSrt = d.kota && d.tglSurat ? `${d.kota}, ${fmtTgl(d.tglSurat)}` : "";

    let html = `<div style="font-family:'Times New Roman', serif !important; color:#000; font-size:14px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
        <div>
           <p style="margin:0">Perihal : Lamaran Pekerjaan</p>
           ${lampiran.length > 0 ? `<p style="margin:0">Lampiran : ${lampiran.length} Berkas</p>` : ''}
        </div>
        <span>${tglSrt}</span>
      </div>
      
      <p style="margin-top:20px;">Kepada Yth,<br><b>HRD ${d.pt}</b><br>Di tempat</p><br>`;

    lines.forEach(l => {
      if (l === "[[ID]]") {
        const iden = [
            ["Nama", d.nama], 
            ["Tempat/Tgl Lahir", `${d.tempat}, ${fmtTgl(d.tglLahir)}`], 
            ["Pendidikan", d.pendidikan], 
            ["Alamat", d.alamat], 
            ["Email", d.email],
            ["No. HP", d.telepon]
        ];
        iden.forEach(i => {
          html += `<div style="display:flex; margin-bottom:2px;"><div style="width:130px">${i[0]}</div><div style="width:20px">:</div><div style="flex:1">${i[1]}</div></div>`;
        });
      } else { 
        html += `<p style="margin: 0; text-align: justify;">${l}</p>`; 
      }
    });

    if (lampiran.length > 0) {
      html += `<br><p style="margin-bottom:5px;">Sebagai bahan pertimbangan, saya lampirkan:</p>`;
      lampiran.forEach((item, i) => { html += `<p style="margin:0">${i + 1}. ${item}</p>`; });
    }

    html += `<br><p style="text-align: justify;">Demikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.</p>
      <div style="text-align:right; margin-top:40px; padding-right:20px;">
        <p style="margin-bottom:40px;">Hormat saya,</p>
        <div style="margin-bottom:10px;">
          <img src="${canvas.toDataURL()}" style="height:60px; display:${canvas.toDataURL()==="data:,"?'none':'inline-block'}; margin-bottom:-20px;">
        </div>
        <p><b>${d.nama}</b></p>
      </div></div>`;
    
    previewArea.innerHTML = html;
    badgeStatus.textContent = "Preview Siap";
    badgeStatus.style.background = "#dcfce7";
  }

  // --- Export PDF ---
  async function exportPDF(d, fileName) {
    const { jsPDF } = window.jspdf;
    const { PDFDocument } = window.PDFLib;
    const doc = new jsPDF();
    const lampiran = getLampiran();
    let y = 30;

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    if (d.kota && d.tglSurat) doc.text(`${d.kota}, ${fmtTgl(d.tglSurat)}`, 190, y, {align:"right"});
    doc.text(`Perihal : Lamaran Pekerjaan`, 20, y);
    if (lampiran.length > 0) {
        doc.text(`Lampiran : ${lampiran.length} Berkas`, 20, y+6);
        y += 20;
    } else {
        y += 15;
    }

    doc.text("Kepada Yth,", 20, y);
    doc.setFont("times", "bold"); doc.text(`HRD ${d.pt}`, 20, y+6);
    doc.setFont("times", "normal"); doc.text("Di tempat", 20, y+12);
    y += 25;

    TEMPLATES[d.template](d).forEach(l => {
      if(l === "[[ID]]") {
        const iden = [["Nama", d.nama], ["Tempat/Tgl Lahir", `${d.tempat}, ${fmtTgl(d.tglLahir)}`], ["Pendidikan", d.pendidikan], ["Alamat", d.alamat], ["Email", d.email], ["No. HP", d.telepon]];
        iden.forEach(i => { doc.text(i[0], 20, y); doc.text(":", 60, y); doc.text(i[1], 65, y); y += 7; });
      } else if (l === "") { y += 4; }
      else { 
        const splitText = doc.splitTextToSize(l, 170);
        doc.text(splitText, 20, y); 
        y += (splitText.length * 6); 
      }
    });

    if (lampiran.length > 0) {
      y += 5; doc.text("Sebagai bahan pertimbangan, saya lampirkan:", 20, y); y += 7;
      lampiran.forEach((item, i) => { doc.text(`${i+1}. ${item}`, 20, y); y += 6; });
    }

    y += 10; doc.text(doc.splitTextToSize("Demikian surat lamaran ini saya sampaikan. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.", 170), 20, y);
    
    y += 20; doc.text("Hormat saya,", 190, y, {align:"right"});
    if (canvas.toDataURL() !== "data:,") doc.addImage(canvas.toDataURL(), "PNG", 155, y+2, 35, 15);
    doc.setFont("times", "bold"); doc.text(d.nama, 190, y+25, {align:"right"});

    const master = await PDFDocument.create();
    const letter = await PDFDocument.load(doc.output("arraybuffer"));
    (await master.copyPages(letter, letter.getPageIndices())).forEach(p => master.addPage(p));

    const inputs = ["fileCV", "filePasFoto", "fileSKCK"];
    const extra = document.getElementById("filePendukung").files;
    let allFiles = [];
    inputs.forEach(id => { if(document.getElementById(id).files[0]) allFiles.push(document.getElementById(id).files[0]); });
    if(extra) Array.from(extra).forEach(f => allFiles.push(f));

    for (const f of allFiles) {
        try {
            const bytes = await f.arrayBuffer();
            const ext = f.name.split('.').pop().toLowerCase();
            if (ext === "pdf") {
                const src = await PDFDocument.load(bytes);
                (await master.copyPages(src, src.getPageIndices())).forEach(p => master.addPage(p));
            } else if (["jpg","jpeg","png"].includes(ext)) {
                const img = ext==="png"? await master.embedPng(bytes) : await master.embedJpg(bytes);
                const p = master.addPage();
                const sc = Math.min((p.getSize().width-40)/img.width, (p.getSize().height-40)/img.height);
                p.drawImage(img, { x:(p.getSize().width-img.width*sc)/2, y:(p.getSize().height-img.height*sc)/2, width:img.width*sc, height:img.height*sc });
            }
        } catch (e) { console.warn("Skip file", e); }
    }
    saveAs(new Blob([await master.save()], {type:"application/pdf"}), `${fileName}.pdf`);
  }

  btnPreview.addEventListener("click", render);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    badgeStatus.textContent = "Proses...";
    const d = getFormData();
    await exportPDF(d, `Lamaran_${d.nama}`);
    badgeStatus.textContent = "Selesai";
  });
})();
(() => {
  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");
  const canvas = document.getElementById("signaturePad");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearTtd");

  // Resize Canvas untuk TTD
  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const oldData = canvas.toDataURL();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
    if (oldData !== "data:,") {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      img.src = oldData;
    }
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Draw TTD
  let drawing = false;
  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  };
  canvas.addEventListener("mousedown", (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
  canvas.addEventListener("mousemove", (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
  canvas.addEventListener("mouseup", () => drawing = false);
  canvas.addEventListener("touchstart", (e) => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); }, {passive: false});
  canvas.addEventListener("touchmove", (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, {passive: false});
  canvas.addEventListener("touchend", () => drawing = false);
  clearBtn.addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));

  const fmtTgl = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const bln = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return `${d} ${bln[m-1]} ${y}`;
  };

  const getLampiran = () => {
    let list = [];
    if (document.getElementById("includeCV").checked) list.push("Curriculum Vitae (CV)");
    if (document.getElementById("includePasFoto").checked) list.push("Pas Foto");
    if (document.getElementById("includeSKCK").checked) list.push("SKCK");
    const lain = document.getElementById("berkasLain").value;
    if (lain) list = [...list, ...lain.split(',').map(s => s.trim()).filter(s => s !== "")];
    return list;
  };

  const getFormData = () => ({
    nama: document.getElementById("namaPelamar").value.trim(),
    tempat: document.getElementById("tempatLahir").value.trim(),
    tglLahir: document.getElementById("tglLahir").value,
    pendidikan: document.getElementById("pendidikan").value.trim(),
    alamat: document.getElementById("alamatPelamar").value.trim(),
    email: document.getElementById("email").value.trim(),
    telepon: document.getElementById("telepon").value.trim(),
    kota: document.getElementById("kotaSurat").value.trim(),
    tglSurat: document.getElementById("tanggalSurat").value,
    pt: document.getElementById("namaPT").value.trim(),
    posisi: document.getElementById("posisi").value.trim(),
    template: document.getElementById("template").value,
  });

  const TEMPLATES = {
    formal: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.pt} sebagai ${d.posisi}.`, "Saya memiliki motivasi kerja yang tinggi, disiplin, dan mampu bekerja secara individu maupun tim.", "", "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."],
    operator: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Mengajukan lamaran kerja sebagai ${d.posisi} di ${d.pt}.`, "Saya terbiasa bekerja mengikuti SOP dan siap bekerja dengan sistem shift.", "", "Demikian permohonan ini saya sampaikan."],
    fresh: (d) => ["Dengan hormat,", "", `Saya ${d.nama}, lulusan ${d.pendidikan}.`, `Saya bermaksud melamar posisi ${d.posisi} di ${d.pt}.`, "", "Saya adalah pribadi yang cepat belajar dan adaptif.", "", `Kontak: ${d.telepon} | ${d.email}`]
  };

  // Preview Render
  function render() {
    const d = getFormData();
    const lampiran = getLampiran();
    const lines = TEMPLATES[d.template](d);
    const tglSrt = d.kota && d.tglSurat ? `${d.kota}, ${fmtTgl(d.tglSurat)}` : "";

    let html = `<div style="font-family:'Times New Roman', serif; line-height:1.6;">
      <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
        <div>
          <p style="margin:0">Perihal : Lamaran Pekerjaan</p>
          ${lampiran.length > 0 ? `<p style="margin:0">Lampiran : ${lampiran.length} Berkas</p>` : ''}
        </div>
        <span>${tglSrt}</span>
      </div>
      <p>Kepada Yth,<br><b>HRD ${d.pt}</b><br>Di tempat</p><br>`;

    lines.forEach(l => {
      if (l === "[[ID]]") {
        const iden = [["Nama", d.nama], ["Tempat/Tgl Lahir", `${d.tempat}, ${fmtTgl(d.tglLahir)}`], ["Pendidikan", d.pendidikan], ["Alamat", d.alamat], ["Email", d.email], ["WhatsApp", d.telepon]];
        iden.forEach(i => {
          html += `<div style="display:flex; margin-bottom:2px;"><div style="width:140px">${i[0]}</div><div style="width:20px">:</div><div>${i[1]}</div></div>`;
        });
      } else { html += `<p style="margin:0; text-align:justify;">${l}</p>`; }
    });

    if (lampiran.length > 0) {
      html += `<br><p style="margin-bottom:5px;">Sebagai bahan pertimbangan, saya lampirkan:</p>`;
      lampiran.forEach((item, i) => { html += `<p style="margin:0">${i + 1}. ${item}</p>`; });
    }

    // TTD Section Lebih Dekat
    html += `<br><p>Demikian surat ini saya sampaikan. Terima kasih.</p>
      <div style="float:right; text-align:right; margin-top:30px; width:200px;">
        <p style="margin-bottom:0;">Hormat saya,</p>
        <div style="height:60px; display:flex; align-items:center; justify-content:flex-end;">
          <img src="${canvas.toDataURL()}" style="max-height:60px; display:${canvas.toDataURL()==="data:,"?'none':'block'};">
        </div>
        <p style="margin:0;"><b>${d.nama}</b></p>
      </div>
      <div style="clear:both;"></div></div>`;
    
    previewArea.innerHTML = html;
    badgeStatus.textContent = "Preview Siap";
  }

  btnPreview.addEventListener("click", render);
  // Sisa fungsi export PDF (PDF-Lib) tetap menggunakan logika ID yang sama.
})();