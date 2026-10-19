/* Master_core/UI_Form.js - Interfaccia Form, Sconti, Auto-Couple e Iniettore Modelli Privacy */

document.addEventListener('DOMContentLoaded', () => {
    const __twNoteProtector = document.createElement('style');
    __twNoteProtector.innerHTML = "textarea#aNote { resize: none !important; }";
    document.head.appendChild(__twNoteProtector);

    const serviceArea = document.getElementById('serviceRenderArea');
    if (serviceArea && !document.getElementById('discountModule')) {
        const discountHtml = `
            <div id="discountModule" style="display:none; background:rgba(251, 191, 36, 0.08); border:1px dashed var(--gold); border-radius:8px; padding:12px; margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:10px; font-weight:900; color:var(--gold); text-transform:uppercase; display:flex; align-items:center; gap:4px;">
                        <i class="material-icons-round" style="font-size:14px;">local_offer</i> Applica Sconto
                    </span>
                    <i class="material-icons-round" style="font-size:16px; color:var(--text-muted); cursor:pointer;" title="Rimuovi Sconto" onclick="window.sysRemoveDiscount()">close</i>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="number" id="discountValue" class="form-input" placeholder="Valore sconto..." style="flex:1; height:36px;" oninput="window.sysCalculatePrice()">
                    <button type="button" id="btnScontoEuro" onclick="window.sysSetDiscountType('euro')" style="height:36px; padding:0 12px; border-radius:6px; border:1px solid var(--accent); background:var(--accent); color:#0f172a; font-weight:900; cursor:pointer;">€</button>
                    <button type="button" id="btnScontoPerc" onclick="window.sysSetDiscountType('perc')" style="height:36px; padding:0 12px; border-radius:6px; border:1px solid var(--border-line); background:transparent; color:var(--text-main); font-weight:900; cursor:pointer;">%</button>
                </div>
            </div>
        `;
        serviceArea.insertAdjacentHTML('afterend', discountHtml);
    }

    // Iniezione Modulo Selezione Documento Privacy
    const privacyBox = document.getElementById('uiPrivacyBox');
    if (privacyBox && !document.getElementById('privacyDocSelect')) {
        const docHtml = `
            <select id="privacyDocSelect" class="form-input" style="margin-bottom:10px; font-size:12px; height:36px; padding:0 10px; border-color:var(--accent); background:rgba(0,0,0,0.2);">
                <option value="">Caricamento Modelli...</option>
            </select>
        `;
        const btnContainer = privacyBox.querySelector('div[style*="display:flex"]');
        if (btnContainer) {
            btnContainer.insertAdjacentHTML('beforebegin', docHtml);
        }
        
        setTimeout(() => {
            const structId = localStorage.getItem("tw_structure_id");
            if (structId && typeof firebase !== 'undefined') {
                firebase.database().ref('MASTER_ADMIN_DB/structures_data/' + structId + '/settings/firma/modelli').once('value').then(snap => {
                    const modelli = snap.val();
                    const sel = document.getElementById('privacyDocSelect');
                    if (modelli && sel) {
                        sel.innerHTML = '';
                        Object.keys(modelli).forEach(k => {
                            const m = modelli[k];
                            const isDef = m.isDefault ? 'selected' : '';
                            sel.innerHTML += `<option value="${k}" ${isDef}>${m.titolo}</option>`;
                        });
                    } else if(sel) {
                        sel.innerHTML = '<option value="default">Modello Base (Predefinito)</option>';
                    }
                });
            }
        }, 1000);
    }
});

window.sysPopulateSecondCabin = function(selectedCab2 = null) {
    const cab2Select = document.getElementById('aCab2');
    if (!cab2Select) return;

    const currentCab1 = parseInt(document.getElementById('aCab')?.value || 1, 10);
    let cabineConfig = [];
    if (window.db && window.db.settings && window.db.settings.cabine_config) {
        cabineConfig = Object.values(window.db.settings.cabine_config);
    } else {
        const cached = localStorage.getItem('tw_cached_cabine');
        if (cached) { try { cabineConfig = JSON.parse(cached); } catch(e){} }
    }
    if (!cabineConfig || cabineConfig.length === 0) {
        cabineConfig = [{ attiva: true, nome: "Cabina 1" }, { attiva: true, nome: "Cabina 2" }];
    }

    let html = '';
    cabineConfig.forEach((c, idx) => {
        const num = idx + 1;
        if (c.attiva !== false) {
            html += `<option value="${num}">${c.nome || ('Cabina ' + num)}</option>`;
        }
    });

    cab2Select.innerHTML = html;
    if (selectedCab2) {
        cab2Select.value = selectedCab2;
    } else {
        cab2Select.value = currentCab1; 
    }
};

window.sysToggleCoupleMode = function(enable, cab2Val = null, op2Val = null) {
    const isCoupleInput = document.getElementById('aIsCouple');
    const coupleFields = document.getElementById('coupleFields');

    if (isCoupleInput) isCoupleInput.value = enable ? "true" : "false";

    if (enable) {
        window.sysPopulateSecondCabin(cab2Val);
        if (coupleFields) coupleFields.style.display = 'block';
        window.sysPopulateOperators();
        if (document.getElementById('aOp2')) {
            setTimeout(() => { document.getElementById('aOp2').value = op2Val || ""; }, 30);
        }
    } else {
        if (coupleFields) coupleFields.style.display = 'none';
        if (document.getElementById('aCab2')) document.getElementById('aCab2').value = "";
        if (document.getElementById('aOp2')) document.getElementById('aOp2').value = "";
    }
};

window.sysCloseSidebar = function(e, force = false) {
    const sidebar = document.getElementById('sideForm');
    if(!sidebar) return;
    if (force || (e && (e.target.classList.contains('layout') || e.target.classList.contains('grid-container')))) {
        sidebar.classList.remove('active'); sidebar.classList.remove('request-mode');
    }
};

window.sysRenderServiceBox = function() {
    const area = document.getElementById('serviceRenderArea'); 
    if(!area) return;
    const sName = document.getElementById('aServ') ? document.getElementById('aServ').value : "";
    
    if(sName) { 
        const baseP = parseFloat(document.getElementById('aBasePrice')?.value) || 0;
        const finalP = parseFloat(document.getElementById('aPrice')?.value) || 0;
        const dur = document.getElementById('aDur')?.value || 30;
        const priceHtml = (finalP < baseP) 
            ? `<span style="text-decoration:line-through; opacity:0.6; margin-right:5px;">${baseP.toFixed(2)}€</span><span style="color:var(--gold); font-weight:900;">${finalP.toFixed(2)} €</span>`
            : `${finalP.toFixed(2)} €`;

        area.innerHTML = `
            <div class="selected-service-badge" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div class="info">
                    <b style="color: var(--green); display: block; font-size: 13px; margin-bottom: 2px; text-transform:uppercase;">${sName}</b>
                    <span style="color: var(--text-muted); font-size: 10px; font-weight: bold;">${dur} min | ${priceHtml}</span>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <div title="Applica Sconto" onclick="if(document.getElementById('discountModule')) document.getElementById('discountModule').style.display='block';" style="color: var(--gold); background: rgba(251, 191, 36, 0.1); border: 1px solid var(--gold); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
                        <i class="material-icons-round" style="font-size:14px;">local_offer</i>
                    </div>
                    <div title="Rimuovi Servizio" onclick="if(typeof window.sysExecuteRemoveService === 'function') window.sysExecuteRemoveService()" style="color: var(--red); background: rgba(239, 68, 68, 0.1); border: 1px solid var(--red); border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;">
                        <i class="material-icons-round" style="font-size:14px;">close</i>
                    </div>
                </div>
            </div>`; 
    } 
    else { 
        area.innerHTML = `
            <button type="button" class="btn-save" style="background: #2563eb !important; border: 1px solid #1d4ed8 !important; margin-bottom: 12px;" onclick="if(typeof window.sysOpenServiceSelector === 'function') window.sysOpenServiceSelector()">
                <i class="material-icons-round" style="color: #ffffff !important;">add_circle</i> <span style="color: #ffffff !important;">AGGIUNGI SERVIZIO</span>
            </button>`; 
    }
};

window.sysExecuteRemoveService = function() { 
    ['aServ', 'aDur', 'aPrice', 'aBasePrice'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = (id==="aDur"?"30":""); });
    window.sysRemoveDiscount();
    window.sysToggleCoupleMode(false);
    window.sysRenderServiceBox();
};

window.sysSetDiscountType = function(type) {
    if(document.getElementById('aDiscountType')) document.getElementById('aDiscountType').value = type;
    if(document.getElementById('btnScontoPerc')) { document.getElementById('btnScontoPerc').style.background = type === 'perc' ? 'var(--accent)' : 'transparent'; document.getElementById('btnScontoPerc').style.color = type === 'perc' ? '#0f172a' : 'var(--text-main)'; }
    if(document.getElementById('btnScontoEuro')) { document.getElementById('btnScontoEuro').style.background = type === 'euro' ? 'var(--accent)' : 'transparent'; document.getElementById('btnScontoEuro').style.color = type === 'euro' ? '#0f172a' : 'var(--text-main)'; }
    window.sysCalculatePrice();
};

window.sysCalculatePrice = function() {
    const base = parseFloat(document.getElementById('aBasePrice')?.value) || 0;
    const type = document.getElementById('aDiscountType')?.value || 'euro';
    const val = parseFloat(document.getElementById('discountValue')?.value) || 0;
    let finalPrice = base;
    if (val > 0) { if(type === 'euro') finalPrice = base - val; else if(type === 'perc') finalPrice = base - (base * (val / 100)); }
    if(finalPrice < 0) finalPrice = 0;
    if(document.getElementById('aPrice')) document.getElementById('aPrice').value = finalPrice.toFixed(2);
    window.sysRenderServiceBox(); 
};

window.sysRemoveDiscount = function() {
    if(document.getElementById('discountModule')) document.getElementById('discountModule').style.display = 'none';
    if(document.getElementById('discountValue')) document.getElementById('discountValue').value = '';
    window.sysSetDiscountType('euro'); 
};

window.sysPopulateOperators = function() {
    const op1 = document.getElementById('aOp'); const op2 = document.getElementById('aOp2');
    if (!op1 && !op2) return;
    const currentVal1 = op1 ? op1.value : null; const currentVal2 = op2 ? op2.value : null;
    const d = document.getElementById('aDate') ? document.getElementById('aDate').value : null;
    const ora = document.getElementById('aOra') ? document.getElementById('aOra').value : null;
    const dur = parseInt(document.getElementById('aDur') ? document.getElementById('aDur').value : 30, 10);
    const currentAppId = document.getElementById('mId') ? document.getElementById('mId').value : null;
    let dayApps = (d && window.db && window.db.app && window.db.app[d]) ? window.normalizeFbArray(window.db.app[d]) : [];
    let startMin = (ora && typeof window.tToM === 'function') ? window.tToM(ora) : null;
    let endMin = startMin !== null ? startMin + dur : null;

    let optionsHtml = '<option value="">-- Operatore Casuale --</option>';

    if (window.allUsersData && window.twStructId) {
        Object.values(window.allUsersData).forEach(u => {
            const isGhost = (u.attivo === false || u.attiva === false || u.eliminato === true || u.deleted === true);
            if (String(u.structureId) === String(window.twStructId) && !isGhost) {
                let isBusy = false; 
                if (startMin !== null) {
                    isBusy = dayApps.some(a => {
                        if (a.id === currentAppId || a.id === "TWIN_" + currentAppId) return false;
                        if ((a.op || '').toLowerCase() !== (u.nick || '').toLowerCase()) return false;
                        const aStart = window.tToM(a.ora); const aEnd = aStart + (parseInt(a.dur) || 30) + 10;
                        return (startMin < aEnd && endMin > aStart);
                    });
                }
                const cleanName = `${u.name || ''} ${u.surname || ''}`.trim();
                if (isBusy) { optionsHtml += `<option value="${u.nick}">🔴 ${cleanName}</option>`; } 
                else { optionsHtml += `<option value="${u.nick}">🟢 ${cleanName}</option>`; }
            }
        });
    }
    if (op1) { op1.innerHTML = optionsHtml; if (currentVal1) op1.value = currentVal1; }
    if (op2) { op2.innerHTML = optionsHtml; if (currentVal2) op2.value = currentVal2; }
};

window.sysHandleOperatorChange = function(selectElement) {
    if (!selectElement.value) return;
    window.sysPopulateOperators();
};

window.sysOpenSlot = function(ora, cab) {
    window._currentEditingOldName = null; const sideForm = document.getElementById('sideForm'); if(!sideForm) return;
    if (sideForm.classList.contains('active')) { 
        if(document.getElementById("aOra")) document.getElementById("aOra").value = ora; 
        if(document.getElementById("aCab")) document.getElementById("aCab").value = cab; 
        if(document.getElementById('aIsCouple')?.value === "true") window.sysPopulateSecondCabin();
        window.sysPopulateOperators(); 
        return; 
    }
    
    sideForm.classList.remove('request-mode'); 
    if(document.getElementById("sidebarTitle")) { document.getElementById("sidebarTitle").innerText = "Nuovo Appuntamento"; document.getElementById("sidebarTitle").style.color = "#ffffff"; }
    if(document.getElementById("mId")) document.getElementById("mId").value = ""; 
    const cd = document.getElementById("mainDate") ? document.getElementById("mainDate").value : new Date().toISOString().split('T')[0]; 
    if(document.getElementById("aDate")) document.getElementById("aDate").value = cd; 
    if(document.getElementById("mOldDate")) document.getElementById("mOldDate").value = cd; 
    if(document.getElementById("aOra")) document.getElementById("aOra").value = ora; 
    if(document.getElementById("aCab")) document.getElementById("aCab").value = cab;
    
    ['aCam', 'aCog', 'aTel', 'aDataNascita', 'aOp', 'aNote', 'aFattura', 'aCodCliente', 'aPatologie'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
    
    window.sysToggleCoupleMode(false);
    window.sysRemoveDiscount();
    if(document.getElementById('aServ')) document.getElementById('aServ').value = ""; if(document.getElementById('aDur')) document.getElementById('aDur').value = "30"; 
    if(document.getElementById('aPrice')) document.getElementById('aPrice').value = "0"; if(document.getElementById('aBasePrice')) document.getElementById('aBasePrice').value = "0"; 
    
    if(document.getElementById("patologieWrapper")) { document.getElementById("patologieWrapper").style.display = "none"; if(document.getElementById("btnShowPatologie")) document.getElementById("btnShowPatologie").style.display = "flex"; }
    if(document.getElementById("aEseguito")) document.getElementById("aEseguito").checked = false;
    if(document.getElementById("btnSaveAppStandard")) document.getElementById("btnSaveAppStandard").style.display = "flex"; 
    if(document.getElementById("editActionButtons")) document.getElementById("editActionButtons").style.setProperty("display", "none", "important"); 
    
    window.sysRenderServiceBox(); window.sysPopulateOperators(); sideForm.classList.add('active');
};

window.sysOpenEdit = function(id) {
    const d = document.getElementById("mainDate") ? document.getElementById("mainDate").value : null;
    if(!d || !window.db || !window.db.app) return;
    let apps = window.normalizeFbArray(window.db.app[d]);
    let app = apps.find(x => x.id === id); if(!app) return;
    
    if(app.isCouple && app.id.toString().startsWith("TWIN_")) {
        app = apps.find(x => x.id === app.linkedId) || app;
    }

    window._currentEditingOldName = app.cog || "Ospite"; const sideForm = document.getElementById('sideForm'); if(!sideForm) return;

    sideForm.classList.remove('request-mode'); 
    if(document.getElementById("sidebarTitle")) { document.getElementById("sidebarTitle").innerText = "Modifica Appuntamento"; document.getElementById("sidebarTitle").style.color = "#ffffff"; }
    
    if(document.getElementById("mId")) document.getElementById("mId").value = app.id; 
    if(document.getElementById("aDate")) document.getElementById("aDate").value = d; 
    if(document.getElementById("mOldDate")) document.getElementById("mOldDate").value = d;
    if(document.getElementById("aOra")) document.getElementById("aOra").value = app.ora; 
    if(document.getElementById("aCab")) document.getElementById("aCab").value = app.cab;
    if(document.getElementById("aCam")) document.getElementById("aCam").value = app.cam || "";
    if(document.getElementById("aCog")) document.getElementById("aCog").value = app.cog || ""; 
    if(document.getElementById("aTel")) document.getElementById("aTel").value = app.tel || "";
    if(document.getElementById("aFattura")) document.getElementById("aFattura").value = app.fattura || "";
    if(document.getElementById("aCodCliente")) document.getElementById("aCodCliente").value = app.codCliente || "";
    if(document.getElementById("aDataNascita")) document.getElementById("aDataNascita").value = app.dataNascita || "";
    if(document.getElementById("aNote")) document.getElementById("aNote").value = app.note || ""; 
    
    let twinCab = null;
    let twinOp = null;
    if(app.isCouple) {
        const twin = apps.find(x => x.id === app.linkedId || x.id === "TWIN_" + app.id);
        if(twin) { twinCab = twin.cab; twinOp = twin.op; }
        window.sysToggleCoupleMode(true, twinCab, twinOp);
    } else {
        window.sysToggleCoupleMode(false);
    }

    if(document.getElementById("aEseguito")) document.getElementById("aEseguito").checked = app.eseguito === true;
    
    let patValue = app.patologie || "";
    if (!patValue && window.globalCustomers && app.cog) {
        const crmMatch = window.globalCustomers.find(c => c.nome && c.nome.toLowerCase() === app.cog.toLowerCase());
        if (crmMatch && crmMatch.patologie) patValue = crmMatch.patologie;
    }
    
    if(document.getElementById("aPatologie")) {
        document.getElementById("aPatologie").value = patValue;
        if(patValue.trim() !== "") { 
            document.getElementById("patologieWrapper").style.display = "block";
            if(document.getElementById("btnShowPatologie")) document.getElementById("btnShowPatologie").style.display = "none"; 
        } else { 
            document.getElementById("patologieWrapper").style.display = "none";
            if(document.getElementById("btnShowPatologie")) document.getElementById("btnShowPatologie").style.display = "flex"; 
        }
    }
    
    if(app.serv) { 
        if(document.getElementById('aServ')) document.getElementById('aServ').value = app.serv; 
        if(document.getElementById('aDur')) document.getElementById('aDur').value = app.dur || 30; 
        
        let displayBasePrice = parseFloat(app.basePrice !== undefined ? app.basePrice : (app.price || 0));
        let displayPrice = parseFloat(app.price || 0);

        if (app.isCouple) {
            displayBasePrice = displayBasePrice * 2;
            displayPrice = displayPrice * 2;
        }

        if(document.getElementById('aBasePrice')) document.getElementById('aBasePrice').value = displayBasePrice.toFixed(2);
        if(document.getElementById('aPrice')) document.getElementById('aPrice').value = displayPrice.toFixed(2);
        
        if(app.discountValue > 0) {
            if(document.getElementById('discountModule')) document.getElementById('discountModule').style.display = 'block';
            if(document.getElementById('discountValue')) document.getElementById('discountValue').value = app.discountValue;
            window.sysSetDiscountType(app.discountType || 'euro');
        } else {
            window.sysRemoveDiscount();
        }
    }
    window.sysRenderServiceBox(); window.sysPopulateOperators();
    setTimeout(() => {
        if(document.getElementById("aOp")) document.getElementById("aOp").value = app.op || ""; 
        if(app.isCouple && twinOp && document.getElementById("aOp2")) document.getElementById("aOp2").value = twinOp;
        if(app.isCouple && twinCab && document.getElementById("aCab2")) document.getElementById("aCab2").value = twinCab;
    }, 50);
    
    if(document.getElementById("btnSaveAppStandard")) document.getElementById("btnSaveAppStandard").style.display = "flex"; 
    if(document.getElementById("editActionButtons")) document.getElementById("editActionButtons").style.setProperty("display", "flex", "important"); 
    sideForm.classList.add('active');
};

// ... Resto del file invariato per Profilo CRM
window.currentOpenCustId = null;

window.sysViewPdfModal = function(url, docId) {
    if(!url) return;
    let previewUrl = url;
    if(url.includes('/view')) previewUrl = url.substring(0, url.indexOf('/view')) + '/preview';
    
    const modalId = 'tw-pdf-viewer';
    if(document.getElementById(modalId)) document.getElementById(modalId).remove();
    
    const html = `
    <div id="${modalId}" class="modal-overlay" style="display:flex; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.95); backdrop-filter:blur(8px); z-index:100000; align-items:center; justify-content:center; flex-direction:column;">
        <div style="width:95%; max-width:1000px; background:var(--bg-panel); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; height:95vh; border:1px solid var(--border-line); box-shadow:0 20px 50px rgba(0,0,0,0.8);">
            <div style="padding:12px 20px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); border-bottom:1px solid var(--border-line);">
                <h3 style="margin:0; color:var(--accent); font-size:16px; display:flex; align-items:center; gap:8px;">
                    <i class="material-icons-round">picture_as_pdf</i> ANTEPRIMA DOCUMENTO
                </h3>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.sysDownloadPdf('${url}')" style="background:rgba(16, 185, 129, 0.1); color:var(--green); border:1px solid rgba(16, 185, 129, 0.3); border-radius:8px; padding:6px 12px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:5px; transition:0.2s;" onmouseover="this.style.background='var(--green)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='var(--green)';">
                        <i class="material-icons-round" style="font-size:16px;">download</i> SALVA
                    </button>
                    <button onclick="window.sysDeletePdf('${docId}')" style="background:rgba(239, 68, 68, 0.1); color:var(--red); border:1px solid rgba(239, 68, 68, 0.3); border-radius:8px; padding:6px 12px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:5px; transition:0.2s;" onmouseover="this.style.background='var(--red)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='var(--red)';">
                        <i class="material-icons-round" style="font-size:16px;">delete</i> ELIMINA
                    </button>
                    <button onclick="document.getElementById('${modalId}').remove()" style="background:transparent; color:var(--text-muted); border:1px solid var(--border-line); border-radius:8px; padding:6px 12px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:5px; transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#fff';">
                        <i class="material-icons-round" style="font-size:16px;">close</i> CHIUDI
                    </button>
                </div>
            </div>
            <div style="flex:1; background:#f8fafc; position:relative;">
                <iframe src="${previewUrl}" style="width:100%; height:100%; border:none;"></iframe>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.sysDownloadPdf = function(url) {
    if(!url) return;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if(match && match[1]) {
        window.open(`https://drive.google.com/uc?export=download&id=${match[1]}`, '_blank');
    } else {
        window.open(url, '_blank');
    }
};

window.sysDeletePdf = function(docId) {
    if(!confirm("ATTENZIONE: Vuoi rimuovere questo documento dall'anagrafica del cliente?")) return;
    if(window.currentOpenCustId) {
        firebase.database().ref(`MASTER_ADMIN_DB/global_customers/${window.currentOpenCustId}/docs/${docId}`).remove().then(() => {
            if(window.showToast) window.showToast("Documento rimosso dall'anagrafica.");
            if(document.getElementById('tw-pdf-viewer')) document.getElementById('tw-pdf-viewer').remove();
            const row = document.getElementById(`row_doc_${docId}`);
            if(row) row.remove();
        });
    }
};

window.sysOpenProfileTab = function(tabName) {
    const h = document.getElementById('tab-history');
    const d = document.getElementById('tab-docs');
    if(h) h.style.display = tabName === 'history' ? 'block' : 'none';
    if(d) d.style.display = tabName === 'docs' ? 'block' : 'none';
    
    const btns = document.querySelectorAll('#customerProfileModal .tab-btn');
    if (btns && btns.length >= 2) {
        btns[0].style.color = tabName === 'history' ? 'var(--accent)' : 'var(--text-muted)';
        btns[0].style.borderBottomColor = tabName === 'history' ? 'var(--accent)' : 'transparent';
        btns[1].style.color = tabName === 'docs' ? 'var(--accent)' : 'var(--text-muted)';
        btns[1].style.borderBottomColor = tabName === 'docs' ? 'var(--accent)' : 'transparent';
    }
};

window.sysSaveCustomerNote = function() {
    const note = document.getElementById('cp_note') ? document.getElementById('cp_note').value : '';
    if(window.currentOpenCustId) {
        firebase.database().ref('MASTER_ADMIN_DB/global_customers').child(window.currentOpenCustId).update({ note: note });
        if(window.showToast) window.showToast("Note aggiornate!");
    }
};

window.sysOpenCRMProfileGrid = function(nomeCliente) {
    if (!nomeCliente || nomeCliente === "N.D." || nomeCliente.toLowerCase() === "ospite") {
        if(window.showErrorToast) window.showErrorToast("Ospite generico, nessun profilo CRM associato.");
        return;
    }
    if (!window.globalCustomers) {
        if(window.showErrorToast) window.showErrorToast("Anagrafica CRM in caricamento...");
        return;
    }
    const match = window.globalCustomers.find(c => c.nome && c.nome.toLowerCase() === nomeCliente.toLowerCase());
    if (!match) {
        if(window.showErrorToast) window.showErrorToast("Cliente non trovato in anagrafica CRM.");
        return;
    }
    
    window.currentOpenCustId = match.id;
    const mod = document.getElementById('customerProfileModal');
    if (mod) {
        document.getElementById('cp_nome').innerText = match.nome || "Sconosciuto";
        document.getElementById('cp_tel').innerText = match.tel || "-";
        document.getElementById('cp_dob').innerText = match.dataNascita || "-";
        document.getElementById('cp_note').value = match.note || "";
        
        let spesaTotale = 0; let histHtml = '';
        let cApps = [];
        
        if(window.db && window.db.app) {
            Object.keys(window.db.app).forEach(date => {
                const dayApps = Array.isArray(window.db.app[date]) ? window.db.app[date] : Object.values(window.db.app[date]);
                dayApps.forEach(a => {
                    if(a && a.cog && a.cog.toLowerCase() === match.nome.toLowerCase()) {
                        cApps.push({ ...a, dataString: date });
                    }
                });
            });
        }
        
        cApps.sort((a, b) => new Date(b.dataString) - new Date(a.dataString));
        
        if(cApps.length === 0) { 
            histHtml = '<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted);">Nessun trattamento registrato nell\'agenda.</td></tr>'; 
        } else {
            cApps.forEach(a => {
                const price = parseFloat(a.price || a.prezzo || 0); 
                if(a.pagato) spesaTotale += price;
                const dateParts = a.dataString.split('-'); 
                const dateIt = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : a.dataString;
                const stato = a.pagato ? '<span style="color:var(--green); font-size:10px; font-weight:bold; border:1px solid var(--green); padding:2px 4px; border-radius:4px;">PAGATO</span>' : '<span style="color:var(--red); font-size:10px; font-weight:bold; border:1px solid var(--red); padding:2px 4px; border-radius:4px;">DA PAGARE</span>';
                
                histHtml += `<tr><td style="font-weight:bold; color:var(--text-main); font-size:14px;">${dateIt}</td><td style="color:var(--text-muted); font-size:12px;">TOUCH WELNESS</td><td><b style="display:block; color:var(--accent); font-size:13px; text-transform:uppercase;">${a.serv || 'Trattamento'} (${a.dur || 30} min)</b><span style="font-size:11px; color:var(--gold); font-weight:bold;">OPERATORE: ${a.op || 'Non Assegnato'}</span></td><td style="text-align:right;"><b style="display:block; font-size:16px; color:var(--green); margin-bottom:4px;">${price.toFixed(2)} €</b>${stato}</td></tr>`;
            });
        }
        
        document.getElementById('cp_history').innerHTML = histHtml;
        document.getElementById('cp_spent').innerText = spesaTotale.toFixed(2) + " €";
        
        const docsTable = document.getElementById('cp_docs_table');
        if (docsTable) {
            docsTable.innerHTML = "";
            if(match.docs && Object.keys(match.docs).length > 0) {
                Object.entries(match.docs).forEach(([docId, doc]) => {
                    docsTable.innerHTML += `
                    <tr id="row_doc_${docId}">
                        <td style="font-size:12px; font-weight:bold;">${doc.dataInserimento || '-'}</td>
                        <td><b style="color:var(--text-main); font-size:14px;">${doc.nomeDoc || 'Consenso Privacy'}</b></td>
                        <td style="text-align:right; display:flex; justify-content:flex-end; gap:6px;">
                            <button onclick="window.sysViewPdfModal('${doc.link}', '${docId}')" style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:rgba(56, 189, 248, 0.1); color:var(--accent); border:1px solid var(--accent); border-radius:8px; cursor:pointer; transition:0.2s;" title="Visualizza" onmouseover="this.style.background='var(--accent)'; this.style.color='#0f172a';" onmouseout="this.style.background='rgba(56, 189, 248, 0.1)'; this.style.color='var(--accent)';">
                                <i class="material-icons-round" style="font-size:16px;">visibility</i>
                            </button>
                            <button onclick="window.sysDownloadPdf('${doc.link}')" style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:rgba(16, 185, 129, 0.1); color:var(--green); border:1px solid var(--green); border-radius:8px; cursor:pointer; transition:0.2s;" title="Salva su PC" onmouseover="this.style.background='var(--green)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='var(--green)';">
                                <i class="material-icons-round" style="font-size:16px;">download</i>
                            </button>
                            <button onclick="window.sysDeletePdf('${docId}')" style="display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; background:rgba(239, 68, 68, 0.1); color:var(--red); border:1px solid var(--red); border-radius:8px; cursor:pointer; transition:0.2s;" title="Elimina" onmouseover="this.style.background='var(--red)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='var(--red)';">
                                <i class="material-icons-round" style="font-size:16px;">delete</i>
                            </button>
                        </td>
                    </tr>`;
                });
            } else { 
                docsTable.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:40px; color:var(--text-muted)'><i class='material-icons-round' style='font-size:32px; opacity:0.5; margin-bottom:10px;'>find_in_page</i><br>Nessun documento firmato.<br><span style='font-size:12px;'>Il file apparirà qui automaticamente dopo la firma sul Tablet.</span></td></tr>"; 
            }
        }

        if(typeof window.sysOpenProfileTab === 'function') window.sysOpenProfileTab('history');
        if(document.getElementById('customerProfileModal')) document.getElementById('customerProfileModal').style.display = 'flex';
    }
};