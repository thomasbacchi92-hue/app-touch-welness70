/* Master_core/Logic_CRM.js - Sincronizzazione CRM, Autocomplete e Gestione Cambio Nome Anti-Duplicati */

window.sysCheckCustomerInput = function() {
    const input = document.getElementById('aCog');
    const box = document.getElementById('cogSuggestions');
    if(!input || !box || !window.globalCustomers) return;

    const val = input.value.toLowerCase().trim();
    if(val.length < 2) { box.style.display = 'none'; return; }

    const matches = window.globalCustomers.filter(c => c.nome && c.nome.toLowerCase().includes(val)).slice(0, 5);
    if(matches.length === 0) { box.style.display = 'none'; return; }

    box.innerHTML = ''; box.style.display = 'block'; box.style.zIndex = '99999'; 

    matches.forEach(c => {
        const div = document.createElement('div');
        div.className = 'auto-item';
        div.innerHTML = `<div><b style="color:var(--accent); font-size:12px; text-transform:uppercase; display:block; margin-bottom:2px;">${c.nome}</b><span style="font-size:10px; color:var(--text-muted);">${c.tel || 'Nessun tel.'}</span></div>`;
        
        div.onclick = function() {
            input.value = c.nome;
            if(document.getElementById('aTel') && c.tel && c.tel !== 'N.D.') document.getElementById('aTel').value = c.tel;
            if(document.getElementById('aDataNascita') && c.dataNascita && c.dataNascita !== 'N.D.') document.getElementById('aDataNascita').value = c.dataNascita;
            if(document.getElementById('aCodCliente') && c.codCliente) document.getElementById('aCodCliente').value = c.codCliente;
            
            if(document.getElementById('aCam') && c.cam) document.getElementById('aCam').value = c.cam;
            if(document.getElementById('aPatologie') && c.patologie) {
                document.getElementById('aPatologie').value = c.patologie;
                if(document.getElementById('patologieWrapper')) document.getElementById('patologieWrapper').style.display = 'block';
                if(document.getElementById('btnShowPatologie')) document.getElementById('btnShowPatologie').style.display = 'none';
            }
            box.style.display = 'none';
        };
        box.appendChild(div);
    });
};

document.addEventListener('click', function(e) {
    if(!e.target.closest('#aCog') && !e.target.closest('#cogSuggestions')) {
        const box = document.getElementById('cogSuggestions');
        if(box) box.style.display = 'none';
    }
});

window.sysUpdateCRM = function(appObj, ignoreCamera, isEdit = false, actionParams = 'update') {
    if (!window.twStructId) return;
    const crmRef = firebase.database().ref('MASTER_ADMIN_DB/global_customers');
    const oldName = window._currentEditingOldName ? window._currentEditingOldName.toLowerCase() : "";
    const newName = (appObj.cog || "Ospite").toLowerCase();

    if (newName === "ospite" || newName === "n.d.") return;

    let targetId = null;
    let updateData = {
        nome: appObj.cog || "Ospite",
        tel: appObj.tel || "",
        dataNascita: appObj.dataNascita || "",
        note: appObj.note || "",
        patologie: appObj.patologie || "",
        structId: window.twStructId,
        last_update: new Date().toISOString()
    };
    if (!ignoreCamera) updateData.cam = appObj.cam || "";

    if (window.globalCustomers) {
        if (isEdit && actionParams === 'correction' && oldName) {
            const oldCustomer = window.globalCustomers.find(c => c.nome && c.nome.toLowerCase() === oldName);
            if (oldCustomer) targetId = oldCustomer.id;
        } else if (actionParams !== 'new') {
            const existingCustomer = window.globalCustomers.find(c => c.nome && c.nome.toLowerCase() === newName);
            if (existingCustomer) targetId = existingCustomer.id;
        }
    }

    if (targetId) {
        crmRef.child(targetId).update(updateData);
    } else {
        updateData.created_at = new Date().toISOString();
        crmRef.push(updateData);
    }
};