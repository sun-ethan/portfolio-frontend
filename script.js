// Backend proxy
const BACKEND_URL = 'https://your-api-url.com/api';

let localData = { sections: [], config: { hash: "TURQU1VQRVI=", favicon: "" } };

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function insertAtCursor(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = before + selected + after;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
    autoResize(textarea);
}

function buildTextToolbar(i, si, li) {
    return `<div class="text-toolbar" data-for="txt-${i}-${si}-${li}">
        <button type="button" class="fmt-btn" title="Gras" onclick="formatText('${i}','${si}','${li}','bold')"><b>G</b></button>
        <button type="button" class="fmt-btn" title="Retour à la ligne" onclick="formatText('${i}','${si}','${li}','newline')">↵</button>
        <button type="button" class="fmt-btn" title="Tabulation" onclick="formatText('${i}','${si}','${li}','tab')">⇥ Tab</button>
        <select class="fmt-select" title="Taille du texte" onchange="formatText('${i}','${si}','${li}','size:'+this.value); this.value=''">
            <option value="">Taille...</option>
            <option value="0.75em">🔡 Petit</option>
            <option value="1em">🔤 Normal</option>
            <option value="1.25em">🅰️ Moyen</option>
            <option value="1.6em">🅰 Grand</option>
            <option value="2em">🔠 Très Grand</option>
        </select>
    </div>`;
}

function formatText(i, si, li, action) {
    const ta = document.getElementById(`txt-${i}-${si}-${li}`);
    if (!ta) return;
    if (action === 'bold') insertAtCursor(ta, '<b>', '</b>');
    else if (action === 'newline') insertAtCursor(ta, '\n<br>', '');
    else if (action === 'tab') insertAtCursor(ta, '&nbsp;&nbsp;&nbsp;&nbsp;', '');
    else if (action.startsWith('size:')) {
        const size = action.split(':')[1];
        insertAtCursor(ta, `<span style="font-size:${size}">`, '</span>');
    }
}

function showNotify(msg) {
    const t = document.getElementById('notify-toast');
    t.innerText = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- LOGIQUE DATA ---
async function loadData() {
    // 1. Afficher immédiatement les données en cache (si elles existent)
    const cached = localStorage.getItem('portfolioData');
    if (cached) {
        try {
            localData = JSON.parse(cached);
            if(!localData.config) localData.config = { hash: "TURQU1VQRVI=", favicon: "" };
            applySettings(); 
            renderPortfolio();
        } catch(e) { console.warn("Cache invalide", e); }
    }

    // 2. Récupérer les données fraîches en arrière-plan
    try {
        const res = await fetch(`${BACKEND_URL}/get`);
        if(!res.ok) throw new Error('Erreur serveur');
        const json = await res.json();
        
        // 3. Mettre à jour seulement si les données ont changé
        if (JSON.stringify(json) !== cached) {
            localData = json; 
            if(!localData.config) localData.config = { hash: "TURQU1VQRVI=", favicon: "" };
            localStorage.setItem('portfolioData', JSON.stringify(localData));
            applySettings(); 
            renderPortfolio();
        }
    } catch (e) { 
        if (!cached) showNotify("Erreur de connexion au serveur"); 
        console.error(e); 
    }
}

function applySettings() { if(localData.config.favicon) document.getElementById('favicon').href = localData.config.favicon; }

function updateFaviconPreview() {
    const url = document.getElementById('faviconInput').value.trim();
    const img = document.getElementById('favicon-img');
    const urlDisplay = document.getElementById('favicon-url');
    if(url) {
        img.src = url;
        img.style.display = 'block';
        urlDisplay.innerText = url;
    } else {
        img.style.display = 'none';
        urlDisplay.innerText = 'Aucun favicon';
    }
}

function verifyAdmin() {
    const pass = document.getElementById('adminPassInput').value;
    if(btoa(pass) === (localData.config.hash || "TURQU1VQRVI=")) {
        document.getElementById('authView').style.display = 'none';
        const ev = document.getElementById('editView');
        ev.style.display = 'flex';
        setTimeout(() => ev.classList.add('visible'), 10);
        document.getElementById('faviconInput').value = localData.config.favicon || '';
        updateFaviconPreview();
        renderAdminList();
    } else { showNotify("Code incorrect"); }
}

// --- RENDU FRONT-END ---
function renderPortfolio() {
    const tC = document.getElementById('tabContainer');
    const cC = document.getElementById('contentContainer');
    tC.innerHTML = ''; cC.innerHTML = '';
    localData.sections.forEach((sec, idx) => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${idx === 0 ? 'active' : ''}`;
        btn.innerText = sec.title;
        btn.onclick = (e) => openMainTab(e, `main-${idx}`);
        tC.appendChild(btn);

        const div = document.createElement('div');
        div.id = `main-${idx}`;
        div.className = `content-section ${idx === 0 ? 'active' : ''}`;
        let html = `<h2>${sec.title}</h2><div class="sub-tabs">`;
        sec.subs.forEach((sub, si) => html += `<button class="sub-btn ${si===0?'active':''}" onclick="openSubTab(event,'s-${idx}-${si}')">${sub.title}</button>`);
        html += `</div>`;
        sec.subs.forEach((sub, si) => {
            let contentHtml = ``;
            if(sub.links && sub.links.length > 0) {
                sub.links.forEach(l => {
                    const linkContentType = l.contentType || 'button';
                    if(linkContentType === 'image') {
                        if(l.url) {
                            const widthStyle = l.width ? `width:${l.width}px;` : `width:100%;`;
                            const heightStyle = l.height ? `height:${l.height}px;` : `height:auto;`;
                            contentHtml += `<div class="media-item" style="display:flex; justify-content:center;"><img src="${l.url}" alt="Image" onerror="this.style.display='none'" style="${widthStyle}${heightStyle}max-height:600px; object-fit:contain;"></div>`;
                        }
                    } else if(linkContentType === 'video') {
                        if(l.url) {
                            const widthStyle = l.width ? `width:${l.width}px;` : `width:100%;`;
                            const heightStyle = l.height ? `height:${l.height}px;` : `height:auto;`;
                            contentHtml += `<div class="media-item" style="background:rgba(0,0,0,0.2);"><video controls style="${widthStyle}${heightStyle}max-height:600px;"><source src="${l.url}" type="video/mp4"></video></div>`;
                        }
                    } else if(linkContentType === 'text') {
                        contentHtml += `<div style="margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.1); border-left: 4px solid rgba(255,255,255,0.3); border-radius: 8px; line-height: 1.6;">${l.content || ''}</div>`;
                    } else if(linkContentType === 'button') {
                        if(l.url) contentHtml += `<a href="${l.url}" class="action-link" target="_blank">${l.label || 'Lien'}</a>`;
                    }
                });
            }
            html += `<div id="s-${idx}-${si}" class="sub-content ${si===0?'active':''}">${contentHtml}</div></div>`;
        });
;
        div.innerHTML = html;
        cC.appendChild(div);
    });
}

// --- RENDU ADMIN ---
function renderAdminList() {
    const list = document.getElementById('sectionsList');
    list.innerHTML = '';
    localData.sections.forEach((sec, i) => {
        const box = document.createElement('div');
        box.className = 'item-box';
        box.innerHTML = `
            <div class="admin-row">
                <span class="handle">⠿</span>
                <input type="text" value="${sec.title}" oninput="localData.sections[${i}].title = this.value" style="font-weight:bold">
                <button class="btn btn-delete" onclick="removeSection(${i})">Supprimer</button>
            </div>
            <div class="sub-list" data-idx="${i}"></div>
            <button class="btn" style="background:#f0f4ff; color:#6c5ce7; width:100%; margin-top:10px; font-size:0.8rem" onclick="addSub(${i})">+ Ajouter un sous-onglet</button>
        `;
        list.appendChild(box);

        const subList = box.querySelector('.sub-list');
        sec.subs.forEach((sub, si) => {
            const sBox = document.createElement('div');
            sBox.className = 'sub-item-box';
            sBox.innerHTML = `
                <div class="admin-row">
                    <span class="handle">⠿</span>
                    <input type="text" value="${sub.title}" oninput="localData.sections[${i}].subs[${si}].title = this.value">
                    <button class="btn" style="background:#fff3cd; color:#856404; padding:8px 12px; font-size:0.8rem;" onclick="moveBlock(${i}, ${si}, 'up')" ${si===0?'disabled style="opacity:0.5;"':''}>↑</button>
                    <button class="btn" style="background:#fff3cd; color:#856404; padding:8px 12px; font-size:0.8rem;" onclick="moveBlock(${i}, ${si}, 'down')" ${si===localData.sections[i].subs.length-1?'disabled style="opacity:0.5;"':''}>↓</button>
                    <button class="btn btn-delete" onclick="removeSub(${i}, ${si})">X</button>
                </div>
                <div class="link-list" data-sec="${i}" data-sub="${si}"></div>
                <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
                    <button class="btn" style="background:#ffe6e6; color:#ff7675; flex: 1; min-width: 100px; font-size:0.7rem;" onclick="addLinkType(${i}, ${si}, 'text')">+ 📝 Texte</button>
                    <button class="btn" style="background:#e6f7ff; color:#1890ff; flex: 1; min-width: 100px; font-size:0.7rem;" onclick="addLinkType(${i}, ${si}, 'image')">+ 🖼️ Image</button>
                    <button class="btn" style="background:#f6e6ff; color:#722ed1; flex: 1; min-width: 100px; font-size:0.7rem;" onclick="addLinkType(${i}, ${si}, 'video')">+ 🎬 Vidéo</button>
                    <button class="btn" style="background:#eafff2; color:#2ecc71; flex: 1; min-width: 100px; font-size:0.7rem;" onclick="addLinkType(${i}, ${si}, 'button')">+ 🔗 Bouton</button>
                </div>
            `;
            subList.appendChild(sBox);

            const linkList = sBox.querySelector('.link-list');
            if(sub.links) {
                sub.links.forEach((l, li) => {
                    const lRow = document.createElement('div');
                    lRow.className = 'sub-item-box';
                    const contentType = l.contentType || 'text';
                    let contentHtml = '';
                    if(contentType === 'text') {
                        contentHtml = buildTextToolbar(i, si, li);
                        contentHtml += `<textarea id="txt-${i}-${si}-${li}" oninput="localData.sections[${i}].subs[${si}].links[${li}].content = this.value; autoResize(this)" placeholder="Texte à afficher...">${l.content || ''}</textarea>`;
                    } else if(contentType === 'image') {
                        contentHtml = `<input type="text" value="${l.url || ''}" placeholder="URL de l'image" oninput="localData.sections[${i}].subs[${si}].links[${li}].url = this.value">`;
                        contentHtml += `<label style="display:block; margin-top:10px; font-size:0.9rem; font-weight:bold; color:#666;">Taille Largeur :</label>`;
                        contentHtml += `<select onchange="const sizes={small:300,small_med:500,medium:700,med_large:900,large:1200,xlarge:1500}; localData.sections[${i}].subs[${si}].links[${li}].width = sizes[this.value] || ''" style="width:100%; padding:10px; border:2px solid #ddd; border-radius:6px; margin-top:5px;">
                            <option value="">Choisir une taille...</option>
                            <option value="small" ${l.width==300?'selected':''}>Petit (300px)</option>
                            <option value="small_med" ${l.width==500?'selected':''}>Petit-Moyen (500px)</option>
                            <option value="medium" ${l.width==700?'selected':''}>Moyen (700px)</option>
                            <option value="med_large" ${l.width==900?'selected':''}>Moyen-Grand (900px)</option>
                            <option value="large" ${l.width==1200?'selected':''}>Grand (1200px)</option>
                            <option value="xlarge" ${l.width==1500?'selected':''}>Très Grand (1500px)</option>
                        </select>`;
                        contentHtml += `<label style="display:block; margin-top:10px; font-size:0.9rem; font-weight:bold; color:#666;">Taille Hauteur :</label>`;
                        contentHtml += `<select onchange="const sizes={small:200,small_med:350,medium:500,med_large:650,large:800,xlarge:1000}; localData.sections[${i}].subs[${si}].links[${li}].height = sizes[this.value] || ''" style="width:100%; padding:10px; border:2px solid #ddd; border-radius:6px; margin-top:5px;">
                            <option value="">Choisir une taille...</option>
                            <option value="small" ${l.height==200?'selected':''}>Petit (200px)</option>
                            <option value="small_med" ${l.height==350?'selected':''}>Petit-Moyen (350px)</option>
                            <option value="medium" ${l.height==500?'selected':''}>Moyen (500px)</option>
                            <option value="med_large" ${l.height==650?'selected':''}>Moyen-Grand (650px)</option>
                            <option value="large" ${l.height==800?'selected':''}>Grand (800px)</option>
                            <option value="xlarge" ${l.height==1000?'selected':''}>Très Grand (1000px)</option>
                        </select>`;
                        if(l.url) contentHtml += `<div style="margin: 10px 0; border-radius: 8px; overflow: hidden; background: #eee;"><img src="${l.url}" style="width:100%; height:150px; object-fit:cover;" onerror="this.style.display='none'"></div>`;
                    } else if(contentType === 'video') {
                        contentHtml = `<input type="text" value="${l.url || ''}" placeholder="URL de la vidéo" oninput="localData.sections[${i}].subs[${si}].links[${li}].url = this.value">`;
                        contentHtml += `<label style="display:block; margin-top:10px; font-size:0.9rem; font-weight:bold; color:#666;">Taille Largeur :</label>`;
                        contentHtml += `<select onchange="const sizes={small:300,small_med:500,medium:700,med_large:900,large:1200,xlarge:1500}; localData.sections[${i}].subs[${si}].links[${li}].width = sizes[this.value] || ''" style="width:100%; padding:10px; border:2px solid #ddd; border-radius:6px; margin-top:5px;">
                            <option value="">Choisir une taille...</option>
                            <option value="small" ${l.width==300?'selected':''}>Petit (300px)</option>
                            <option value="small_med" ${l.width==500?'selected':''}>Petit-Moyen (500px)</option>
                            <option value="medium" ${l.width==700?'selected':''}>Moyen (700px)</option>
                            <option value="med_large" ${l.width==900?'selected':''}>Moyen-Grand (900px)</option>
                            <option value="large" ${l.width==1200?'selected':''}>Grand (1200px)</option>
                            <option value="xlarge" ${l.width==1500?'selected':''}>Très Grand (1500px)</option>
                        </select>`;
                        contentHtml += `<label style="display:block; margin-top:10px; font-size:0.9rem; font-weight:bold; color:#666;">Taille Hauteur :</label>`;
                        contentHtml += `<select onchange="const sizes={small:200,small_med:350,medium:500,med_large:650,large:800,xlarge:1000}; localData.sections[${i}].subs[${si}].links[${li}].height = sizes[this.value] || ''" style="width:100%; padding:10px; border:2px solid #ddd; border-radius:6px; margin-top:5px;">
                            <option value="">Choisir une taille...</option>
                            <option value="small" ${l.height==200?'selected':''}>Petit (200px)</option>
                            <option value="small_med" ${l.height==350?'selected':''}>Petit-Moyen (350px)</option>
                            <option value="medium" ${l.height==500?'selected':''}>Moyen (500px)</option>
                            <option value="med_large" ${l.height==650?'selected':''}>Moyen-Grand (650px)</option>
                            <option value="large" ${l.height==800?'selected':''}>Grand (800px)</option>
                            <option value="xlarge" ${l.height==1000?'selected':''}>Très Grand (1000px)</option>
                        </select>`;
                        if(l.url) contentHtml += `<div style="margin: 10px 0; border-radius: 8px; overflow: hidden; background: #eee;"><video style="width:100%; height:150px; object-fit:cover;" controls><source src="${l.url}"></video></div>`;
                    } else if(contentType === 'button') {
                        contentHtml = `<input type="text" value="${l.label || ''}" placeholder="Texte du bouton" oninput="localData.sections[${i}].subs[${si}].links[${li}].label = this.value">
                        <input type="text" value="${l.url || ''}" placeholder="URL du lien" oninput="localData.sections[${i}].subs[${si}].links[${li}].url = this.value">`;
                    }
                    lRow.innerHTML = `
                        <div class="admin-row">
                            <span class="handle">⠿</span>
                            <select onchange="localData.sections[${i}].subs[${si}].links[${li}].contentType = this.value; renderAdminList()" style="flex-grow: 1; padding: 12px; border: 2px solid #eee; border-radius: 10px;">
                                <option value="text" ${contentType==='text'?'selected':''}>📝 Texte</option>
                                <option value="image" ${contentType==='image'?'selected':''}>🖼️ Image</option>
                                <option value="video" ${contentType==='video'?'selected':''}>🎬 Vidéo</option>
                                <option value="button" ${contentType==='button'?'selected':''}>🔗 Bouton</option>
                            </select>
                            <button class="btn btn-delete" onclick="localData.sections[${i}].subs[${si}].links.splice(${li},1);renderAdminList()">X</button>
                        </div>
                        ${contentHtml}
                    `;
                    linkList.appendChild(lRow);
                });
            }
        });
    });
    initSort();
    document.querySelectorAll('textarea').forEach(autoResize);
}

function initSort() {
    // Déplacement des Onglets
    new Sortable(document.getElementById('sectionsList'), { handle: '.handle', animation: 150, ghostClass: 'sortable-ghost', onEnd: (e) => {
        const item = localData.sections.splice(e.oldIndex, 1)[0];
        localData.sections.splice(e.newIndex, 0, item);
        renderAdminList();
    }});
    // Déplacement des Sous-onglets
    document.querySelectorAll('.sub-list').forEach(el => {
        new Sortable(el, { handle: '.handle', animation: 150, ghostClass: 'sortable-ghost', onEnd: (e) => {
            const i = el.dataset.idx;
            const item = localData.sections[i].subs.splice(e.oldIndex, 1)[0];
            localData.sections[i].subs.splice(e.newIndex, 0, item);
            renderAdminList();
        }});
    });
    // Déplacement des Boutons
    document.querySelectorAll('.link-list').forEach(el => {
        new Sortable(el, { handle: '.handle', animation: 150, ghostClass: 'sortable-ghost', onEnd: (e) => {
            const sIdx = el.dataset.sec;
            const subIdx = el.dataset.sub;
            const item = localData.sections[sIdx].subs[subIdx].links.splice(e.oldIndex, 1)[0];
            localData.sections[sIdx].subs[subIdx].links.splice(e.newIndex, 0, item);
            renderAdminList();
        }});
    });
}

async function saveChanges() {
    const np = document.getElementById('newPassInput').value.trim();
    if(np) localData.config.hash = btoa(np);
    localData.config.favicon = document.getElementById('faviconInput').value.trim();
    try {
        const res = await fetch(`${BACKEND_URL}/save`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localData) });
        if(!res.ok) throw new Error('Erreur sauvegarde');
        localStorage.setItem('portfolioData', JSON.stringify(localData)); // Update cache immediately
        showNotify("Modifications publiées ! ✅");
        setTimeout(() => location.reload(), 800);
    } catch (e) { showNotify("Erreur de sauvegarde"); console.error(e); }
}

function openAdmin() { const a = document.getElementById('adminOverlay'); a.style.display = 'flex'; setTimeout(() => a.classList.add('show'), 10); }
function closeAdmin() { const a = document.getElementById('adminOverlay'); a.classList.remove('show'); setTimeout(() => a.style.display = 'none', 400); }

function switchAdminTab(t) {
    document.getElementById('admin-tab-content').style.display = (t==='content'?'block':'none');
    document.getElementById('admin-tab-settings').style.display = (t==='settings'?'block':'none');
    document.getElementById('nav-btn-content').classList.toggle('active', t==='content');
    document.getElementById('nav-btn-settings').classList.toggle('active', t==='settings');
}

function openMainTab(e, id) {
    if (e.currentTarget.classList.contains('active')) return;
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    const elem = document.getElementById(id);
    void elem.offsetWidth;
    elem.classList.add('active'); 
    e.currentTarget.classList.add('active');
}

function openSubTab(e, id) {
    if (e.currentTarget.classList.contains('active')) return;
    const p = e.currentTarget.parentElement.parentElement;
    p.querySelectorAll('.sub-content').forEach(s => s.classList.remove('active'));
    p.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    const elem = document.getElementById(id);
    void elem.offsetWidth;
    elem.classList.add('active'); 
    e.currentTarget.classList.add('active');
}

function addNewSection() { localData.sections.push({ title: "Nouvel Onglet", subs: [] }); renderAdminList(); }
function moveBlock(i, si, direction) {
    if(direction === 'up' && si > 0) {
        const item = localData.sections[i].subs.splice(si, 1)[0];
        localData.sections[i].subs.splice(si - 1, 0, item);
        renderAdminList();
    } else if(direction === 'down' && si < localData.sections[i].subs.length - 1) {
        const item = localData.sections[i].subs.splice(si, 1)[0];
        localData.sections[i].subs.splice(si + 1, 0, item);
        renderAdminList();
    }
}
function addSub(i) { localData.sections[i].subs.push({ title: "Nouveau bloc", links: [] }); renderAdminList(); }
function addLinkType(i, si, type) {
    const newLink = { contentType: type };
    if(type === 'text') newLink.content = "";
    if(type === 'button') { newLink.label = "Bouton"; newLink.url = "https://"; }
    if(type === 'image' || type === 'video') newLink.url = "https://";
    localData.sections[i].subs[si].links.push(newLink);
    renderAdminList();
}
function addLink(i, si) { addLinkType(i, si, 'button'); }
function removeSection(i) { if(confirm("Supprimer cet onglet ?")) { localData.sections.splice(i,1); renderAdminList(); } }
function removeSub(i, si) { localData.sections[i].subs.splice(si,1); renderAdminList(); }

window.addEventListener('keydown', (e) => { 
    if (e.altKey && e.key.toLowerCase() === 'k') {
        const overlay = document.getElementById('adminOverlay');
        if (overlay.style.display === 'flex') closeAdmin();
        else openAdmin();
    }
    if (e.key === 'Escape') closeAdmin();
});


// --- MODE SOMBRE + ÉTOILES ---
function generateStars() {
    const container = document.getElementById('stars-container');
    container.innerHTML = '';

    // Petites étoiles (150)
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 2.5 + 0.5;
        const isBig = size > 2.5;
        star.className = 'star' + (isBig ? ' big' : '');
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${1.5 + Math.random() * 4}s;
            animation-delay: ${Math.random() * 5}s;
            opacity: ${Math.random() * 0.5 + 0.2};
        `;
        container.appendChild(star);
    }

    // Quelques grosses étoiles lumineuses (15)
    for (let i = 0; i < 15; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 3 + 3;
        star.className = 'star big';
        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${2 + Math.random() * 3}s;
            animation-delay: ${Math.random() * 4}s;
        `;
        container.appendChild(star);
    }

    // Étoile filante toutes les ~8s
    shootStar(container);
}

function shootStar(container) {
    setTimeout(() => {
        if (!document.body.classList.contains('dark')) return;
        const s = document.createElement('div');
        const startX = Math.random() * 80;
        const startY = Math.random() * 40;
        s.style.cssText = `
            position:absolute; left:${startX}%; top:${startY}%;
            width:${60 + Math.random()*80}px; height:2px;
            background:linear-gradient(90deg,white,transparent);
            border-radius:2px; opacity:0;
            transform:rotate(-30deg);
            transition:opacity 0.2s ease, transform 1s ease;
        `;
        container.appendChild(s);
        requestAnimationFrame(() => {
            s.style.opacity = '1';
            s.style.transform = 'rotate(-30deg) translateX(200px)';
            setTimeout(() => { s.style.opacity = '0'; setTimeout(() => s.remove(), 300); }, 700);
        });
        shootStar(container);
    }, 6000 + Math.random() * 8000);
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    if (isDark) generateStars();
    else document.getElementById('stars-container').innerHTML = '';

    // Cache l'astuce définitivement jusqu'au prochain rafraîchissement
    const tip = document.getElementById('dark-mode-tip');
    if (tip) tip.style.opacity = '0';
}

// Restaurer la préférence au chargement
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    generateStars();
}

loadData();
