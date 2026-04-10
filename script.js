(() => {
  const form = document.getElementById("formLamaran");
  const previewArea = document.getElementById("previewArea");
  const btnPreview = document.getElementById("btnPreview");
  const badgeStatus = document.getElementById("badgeStatus");

  // ── Auto-Save & Restore Form (localStorage) ───────────
  const SAVE_KEY = "lamarsaya_form_data";

  const FORM_FIELDS = [
    { id: "namaPelamar",   type: "text"     },
    { id: "tempatLahir",   type: "text"     },
    { id: "tglLahir",      type: "text"     },
    { id: "pendidikan",    type: "text"     },
    { id: "alamatPelamar", type: "textarea" },
    { id: "email",         type: "text"     },
    { id: "telepon",       type: "text"     },
    { id: "kotaSurat",     type: "text"     },
    { id: "tanggalSurat",  type: "text"     },
    { id: "namaPT",        type: "text"     },
    { id: "posisi",        type: "text"     },
    { id: "berkasLain",    type: "text"     },
    { id: "template",      type: "select"   },
    { id: "includeCV",     type: "checkbox" },
    { id: "includePasFoto",type: "checkbox" },
    { id: "includeSKCK",   type: "checkbox" },
  ];

  function saveFormData() {
    const data = {};
    FORM_FIELDS.forEach(({ id, type }) => {
      const el = document.getElementById(id);
      if (!el) return;
      data[id] = type === "checkbox" ? el.checked : el.value;
    });
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* storage penuh / private mode */ }
  }

  function restoreFormData() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      FORM_FIELDS.forEach(({ id, type }) => {
        const el = document.getElementById(id);
        if (!el || !(id in data)) return;
        if (type === "checkbox") el.checked = data[id];
        else el.value = data[id];
      });
    } catch (e) { /* data korup, abaikan */ }
  }

  // Pasang listener auto-save pada setiap field
  FORM_FIELDS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input",  saveFormData);
    el.addEventListener("change", saveFormData);
  });

  // Restore data saat load
  restoreFormData();

  // 2. Signature Logic
  const canvas = document.getElementById("signaturePad");
  const ctx = canvas.getContext("2d");
  const clearBtn = document.getElementById("clearTtd");

  function resizeCanvas() {
    if (!canvas) return;
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

  // ── Signature Tab & Upload Logic ───────────────
  let signatureMode = 'draw';
  let uploadedSignatureData = '';
  
  const tabDraw = document.getElementById('tabDrawTtd');
  const tabUpload = document.getElementById('tabUploadTtd');
  const drawArea = document.getElementById('ttdDrawArea');
  const uploadArea = document.getElementById('ttdUploadArea');
  const uploadInput = document.getElementById('uploadTtdInput');
  const uploadPreview = document.getElementById('uploadTtdPreview');
  const clearUploadBtn = document.getElementById('clearUploadTtd');
  const uploadLabel = document.getElementById('uploadTtdLabel');

  if (tabDraw && tabUpload) {
    tabDraw.onclick = () => {
      signatureMode = 'draw';
      tabDraw.style.background = '#eff6ff'; tabDraw.style.color = '#2563eb'; tabDraw.style.borderColor = '#2563eb';
      tabUpload.style.background = 'transparent'; tabUpload.style.color = 'inherit'; tabUpload.style.borderColor = 'transparent';
      drawArea.style.display = 'block'; uploadArea.style.display = 'none';
      resizeCanvas();
    };
    tabUpload.onclick = () => {
      signatureMode = 'upload';
      tabUpload.style.background = '#eff6ff'; tabUpload.style.color = '#2563eb'; tabUpload.style.borderColor = '#2563eb';
      tabDraw.style.background = 'transparent'; tabDraw.style.color = 'inherit'; tabDraw.style.borderColor = 'transparent';
      uploadArea.style.display = 'flex'; drawArea.style.display = 'none';
    };
  }

  if (uploadInput) {
    uploadInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedSignatureData = ev.target.result;
        uploadPreview.src = uploadedSignatureData;
        uploadPreview.style.display = 'block';
        clearUploadBtn.style.display = 'block';
        uploadLabel.style.display = 'none';
      };
      reader.readAsDataURL(file);
    };
  }

  if (clearUploadBtn) {
    clearUploadBtn.onclick = () => {
      uploadedSignatureData = '';
      uploadInput.value = '';
      uploadPreview.style.display = 'none';
      uploadPreview.src = '';
      clearUploadBtn.style.display = 'none';
      uploadLabel.style.display = 'flex';
    };
  }

  const getSignatureData = () => {
    if (signatureMode === 'draw') return canvas.toDataURL();
    return uploadedSignatureData || "data:,";
  };

  // 3. Helpers
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

  const TEMPLATES = {
    formal: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Dengan ini mengajukan permohonan untuk melamar pekerjaan di ${d.pt} sebagai ${d.posisi}.`, "Saya memiliki motivasi kerja yang tinggi, disiplin, dan mampu bekerja secara individu maupun tim.", "", "Besar harapan saya untuk dapat mengikuti proses seleksi lebih lanjut."],
    operator: (d) => ["Dengan hormat,", "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Mengajukan lamaran kerja sebagai ${d.posisi} di ${d.pt}.`, "Saya terbiasa bekerja mengikuti SOP, menjaga kualitas, dan siap bekerja dengan sistem shift.", "", "Saya siap mengikuti proses interview sesuai jadwal yang ditentukan."],
    operatoraja: (d) => ["Dengan hormat,", "", `Berdasarkan informasi lowongan kerja yang saya peroleh pada tanggal ${fmtTgl(d.tglSurat)}, bahwa perusahaan yang Bapak/Ibu pimpin membutuhkan tenaga kerja sebagai ${d.posisi}, dengan ini saya bermaksud mengajukan lamaran.`, "", "Saya yang bertanda tangan di bawah ini:", "[[ID]]", "", `Mengajukan permohonan untuk menjadi tenaga kerja di ${d.pt} sebagai ${d.posisi}.`, "", "Saya siap mengikuti proses seleksi sesuai jadwal yang telah ditentukan."],
    fresh: (d) => ["Dengan hormat,", "", `Perkenalkan, saya ${d.nama} (${d.tempat}, ${fmtTgl(d.tglLahir)}), lulusan ${d.pendidikan}.`, `Saya bermaksud melamar posisi ${d.posisi} di ${d.pt}.`, "", "Saya memiliki kemauan belajar yang tinggi, cepat beradaptasi, dan siap berkembang bersama perusahaan.", "", `Kontak saya: ${d.telepon} | ${d.email}`]
  };

  // 4. Preview
  btnPreview.onclick = () => {
    const d = {
      nama: document.getElementById("namaPelamar").value,
      tempat: document.getElementById("tempatLahir").value,
      tglLahir: document.getElementById("tglLahir").value,
      pendidikan: document.getElementById("pendidikan").value,
      alamat: document.getElementById("alamatPelamar").value,
      email: document.getElementById("email").value,
      telepon: document.getElementById("telepon").value,
      kota: document.getElementById("kotaSurat").value,
      tglSurat: document.getElementById("tanggalSurat").value,
      pt: document.getElementById("namaPT").value,
      posisi: document.getElementById("posisi").value,
      template: document.getElementById("template").value
    };
    const lampiran = getLampiran();
    const lines = TEMPLATES[d.template](d);
    const tglSrt = d.kota && d.tglSurat ? `${d.kota}, ${fmtTgl(d.tglSurat)}` : "";

    let html = `<div style="font-family:'Times New Roman', serif !important;">
      <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
        <div><p style="margin:0">Perihal : Lamaran Pekerjaan</p>${lampiran.length > 0 ? `<p style="margin:0">Lampiran : ${lampiran.length} Berkas</p>` : ''}</div>
        <span>${tglSrt}</span>
      </div>
      <p style="margin-top:20px;">Kepada Yth,<br><b>HRD ${d.pt}</b><br>Di tempat</p><br>`;

    lines.forEach(l => {
      if (l === "[[ID]]") {
        const iden = [["Nama", d.nama], ["Tempat/Tgl Lahir", `${d.tempat}, ${fmtTgl(d.tglLahir)}`], ["Pendidikan", d.pendidikan], ["Alamat", d.alamat], ["Email", d.email], ["No. HP", d.telepon]];
        iden.forEach(i => { html += `<div style="display:flex; margin-bottom:2px;"><div style="width:130px">${i[0]}</div><div style="width:20px">:</div><div style="flex:1">${i[1]}</div></div>`; });
      } else { html += `<p style="margin:0; text-align:justify;">${l}</p>`; }
    });

    if (lampiran.length > 0) {
      html += `<br><p style="margin-bottom:5px;">Sebagai bahan pertimbangan, saya lampirkan:</p>`;
      lampiran.forEach((item, i) => { html += `<p style="margin:0">${i + 1}. ${item}</p>`; });
    }

    html += `<br><p>Demikian surat lamaran ini saya sampaikan. Terima kasih.</p>
      <div style="text-align:right; margin-top:30px; padding-right:20px;">
        <p style="margin-bottom:40px;">Hormat saya,</p>
        <div style="margin-bottom:10px;"><img src="${getSignatureData()}" style="height:60px; display:${getSignatureData()==="data:,"?'none':'inline-block'}"></div>
        <p><b>${d.nama}</b></p>
      </div></div>`;
    previewArea.innerHTML = html;
  };

  // 5. Download Logic
  form.onsubmit = async (e) => {
    e.preventDefault();
    badgeStatus.textContent = "Proses...";
    
    try {
      const { jsPDF } = window.jspdf;
      const { PDFDocument } = window.PDFLib;
      
      const d = {
        nama: document.getElementById("namaPelamar").value,
        tempat: document.getElementById("tempatLahir").value,
        tglLahir: document.getElementById("tglLahir").value,
        pendidikan: document.getElementById("pendidikan").value,
        alamat: document.getElementById("alamatPelamar").value,
        email: document.getElementById("email").value,
        telepon: document.getElementById("telepon").value,
        kota: document.getElementById("kotaSurat").value,
        tglSurat: document.getElementById("tanggalSurat").value,
        pt: document.getElementById("namaPT").value,
        posisi: document.getElementById("posisi").value,
        template: document.getElementById("template").value
      };

      const doc = new jsPDF();
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      
      let y = 30;
      const margin = 20;
      const lampiran = getLampiran();

      // Buat Surat
      if (d.kota && d.tglSurat) doc.text(`${d.kota}, ${fmtTgl(d.tglSurat)}`, 190, y, {align:"right"});
      doc.text(`Perihal : Lamaran Pekerjaan`, margin, y);
      if (lampiran.length > 0) { doc.text(`Lampiran : ${lampiran.length} Berkas`, margin, y+6); y += 20; } else { y += 15; }

      doc.text("Kepada Yth,", margin, y);
      doc.setFont("times", "bold"); doc.text(`HRD ${d.pt}`, margin, y+6);
      doc.setFont("times", "normal"); doc.text("Di tempat", margin, y+12);
      y += 25;

      TEMPLATES[d.template](d).forEach(l => {
        if(l === "[[ID]]") {
          const iden = [["Nama", d.nama], ["Tempat/Tgl Lahir", `${d.tempat}, ${fmtTgl(d.tglLahir)}`], ["Pendidikan", d.pendidikan], ["Alamat", d.alamat], ["Email", d.email], ["No. HP", d.telepon]];
          iden.forEach(i => { doc.text(i[0], margin, y); doc.text(":", 60, y); doc.text(i[1], 65, y); y += 6.5; });
        } else if (l === "") { y += 4; }
        else { const st = doc.splitTextToSize(l, 170); doc.text(st, margin, y); y += (st.length * 6); }
      });

      if (lampiran.length > 0) {
        y += 5; doc.text("Sebagai bahan pertimbangan, saya lampirkan:", margin, y); y += 7;
        lampiran.forEach((item, i) => { doc.text(`${i+1}. ${item}`, margin, y); y += 6; });
      }

      y += 10; doc.text("Demikian surat lamaran ini saya sampaikan. Terima kasih.", margin, y);
      y += 20; doc.text("Hormat saya,", 190, y, {align:"right"});
      if (getSignatureData() !== "data:,") doc.addImage(getSignatureData(), "PNG", 155, y+2, 35, 15);
      doc.setFont("times", "bold"); doc.text(d.nama, 190, y+25, {align:"right"});

      // Merge PDF
      const master = await PDFDocument.create();
      const letterBytes = await doc.output("arraybuffer");
      const letterPdf = await PDFDocument.load(letterBytes);
      const copiedPages = await master.copyPages(letterPdf, letterPdf.getPageIndices());
      copiedPages.forEach(p => master.addPage(p));

      // Ambil file yang ada
      const fileInputs = ["fileCV", "filePasFoto", "fileSKCK"];
      const multiInput = document.getElementById("filePendukung");
      let filesToMerge = [];

      fileInputs.forEach(id => {
        const inp = document.getElementById(id);
        if (inp && inp.files[0]) filesToMerge.push(inp.files[0]);
      });
      if (multiInput && multiInput.files.length > 0) {
        Array.from(multiInput.files).forEach(f => filesToMerge.push(f));
      }

      for (const file of filesToMerge) {
        const bytes = await file.arrayBuffer();
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === "pdf") {
          const src = await PDFDocument.load(bytes);
          const pgs = await master.copyPages(src, src.getPageIndices());
          pgs.forEach(p => master.addPage(p));
        } else if (["jpg","jpeg","png"].includes(ext)) {
          const img = ext === "png" ? await master.embedPng(bytes) : await master.embedJpg(bytes);
          const page = master.addPage();
          const { width, height } = page.getSize();
          const sc = Math.min((width - 40) / img.width, (height - 40) / img.height);
          page.drawImage(img, { x: (width - img.width * sc) / 2, y: (height - img.height * sc) / 2, width: img.width * sc, height: img.height * sc });
        }
      }

      const finalBytes = await master.save();
      const blob = new Blob([finalBytes], { type: "application/pdf" });
      saveAs(blob, `Lamaran_${d.nama.replace(/\s+/g, '_')}.pdf`);
      
      badgeStatus.textContent = "Selesai";
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membuat PDF. Pastikan koneksi stabil.");
      badgeStatus.textContent = "Gagal";
    }
  };
})();