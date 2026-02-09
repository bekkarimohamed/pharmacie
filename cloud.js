/**
 * Supabase Cloud Integration for Pharmacie Domicile
 * VERSION 6.0 - API REST directe - CORRIGÉ
 */

const SUPABASE_URL = 'https://oywsadhtcvzhesnmevdg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xJrQOqaul0GTcvoJe92LpA_ACquZtRe';

var isCloudEnabled = false;
var cloudMedsPoller = null;
var supabaseClient = null;
var realtimeChannel = null;
var realtimeAchatsChannel = null;

// Test connection à Supabase
async function initCloud() {
    try {
        console.log('🔄 Test connexion Supabase...');
        if (!supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?select=count`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        console.log('📡 Réponse Supabase:', response.status);
        
        if (response.ok || response.status === 200 || response.status === 406) {
            isCloudEnabled = true;
            console.log('✅ Cloud Supabase CONNECTÉ avec succès');
            return true;
        } else {
            console.warn('❌ Connection failed:', response.status);
            isCloudEnabled = false;
            return false;
        }
    } catch (e) {
        console.error('❌ Connection error:', e);
        isCloudEnabled = false;
        return false;
    }
}

// Récupérer tous les médicaments - retourne un tableau simple
async function getMedicaments() {
    if (!isCloudEnabled) {
        console.warn('Cloud non activé pour getMedicaments');
        return [];
    }
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?select=*&order=nom.asc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const err = await response.text();
            console.error('Erreur get:', response.status, err);
            return [];
        }
        
    const data = await response.json();
        console.log('✅ Médicaments cloud:', data.length);
        return data || [];
    } catch (e) {
        console.error('Erreur get:', e);
        return [];
    }
}

// Ajouter un médicament
async function addMedicament(med) {
    if (!isCloudEnabled) {
        console.warn('Cloud non activé');
        return { error: 'Cloud not enabled' };
    }
    
    const data = {
        nom: med.name,
        dosage: med.dosage,
        genre: med.genre,
        quantite: med.quantity,
        stock_initial: med.initialStock,
        prix: med.price,
        nb_boites: med.nbBoxes,
        date_peremption: med.expiry,
        date_achat: med.purchaseDate || null,
        notes: med.notes || ''
    };
    
    console.log('Insertion:', data);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Réponse insert:', response.status);
        
        if (response.ok || response.status === 201) {
            const result = await response.json();
            console.log('ID créé:', result[0]?.id);
            return { error: null, data: result };
        } else {
            const err = await response.text();
            console.error('Erreur insert:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('Erreur insert:', e);
        return { error: e.message };
    }
}

// Supprimer un médicament par ID ou par nom+dosage
async function deleteMedicament(id, name, dosage) {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };
    
    let url = `${SUPABASE_URL}/rest/v1/medicaments`;
    
    if (id) {
        // Supprimer par ID
        url += `?id=eq.${id}`;
    } else if (name && dosage) {
        // Supprimer par nom+dosage (fallback)
        const encodedName = encodeURIComponent(name);
        const encodedDosage = encodeURIComponent(dosage);
        url += `?nom=eq.${encodedName}&dosage=eq.${encodedDosage}`;
    } else {
        return { error: 'Pas d\'ID ni de nom+dosage pour la suppression' };
    }
    
    console.log('🗑️ Suppression cloud, URL:', url);
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        console.log('Réponse delete:', response.status);
        
        if (response.ok) {
            return { error: null };
        } else {
            const err = await response.text();
            console.error('Erreur delete:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('Exception delete:', e);
        return { error: e.message };
    }
}

// Mettre à jour un médicament
async function updateMedicament(id, med) {
    if (!isCloudEnabled) {
        console.warn('⚠️ Cloud non activé pour updateMedicament');
        return { error: 'Cloud not enabled' };
    }
    
    const data = {
        nom: med.name,
        dosage: med.dosage,
        genre: med.genre,
        quantite: med.quantity,
        stock_initial: med.initialStock,
        prix: med.price,
        nb_boites: med.nbBoxes,
        date_peremption: med.expiry,
        date_achat: med.purchaseDate || null,
        notes: med.notes || ''
    };
    
    console.log('📤 Mise à jour medicament cloud:', data);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Réponse updateMedicament:', response.status);
        
        if (response.ok) {
            console.log('✅ Médicament mis à jour dans cloud');
            return { error: null };
        } else {
            const err = await response.text();
            console.error('❌ Erreur updateMedicament:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('❌ Erreur updateMedicament:', e);
        return { error: e.message };
    }
}

// Status
function getCloudStatus() {
    return { enabled: isCloudEnabled };
}


// Quick change signature for fast polling
async function getMedicamentsSignature() {
    if (!isCloudEnabled) return '';
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?select=id,updated_at,created_at,quantite,prix,stock_initial,nb_boites,date_peremption,date_achat&order=id.asc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            return '';
        }
        const data = await response.json();
        if (!Array.isArray(data)) return '';
        return data.map(row => {
            const ts = row.updated_at || row.created_at || '';
            return `${row.id}|${ts}|${row.quantite}|${row.prix}|${row.stock_initial}|${row.nb_boites}|${row.date_peremption || ''}|${row.date_achat || ''}`;
        }).join(';');
    } catch (e) {
        console.warn('Signature fetch error:', e);
        return '';
    }
}

// Subscription for fast sync (realtime if available, else polling)
function subscribeToMedicaments(onChange, options) {
    if (!isCloudEnabled) return null;

    if (supabaseClient && typeof supabaseClient.channel === 'function') {
        if (realtimeChannel) {
            try { supabaseClient.removeChannel(realtimeChannel); } catch (e) {}
        }
        realtimeChannel = supabaseClient
            .channel('medicaments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medicaments' }, (payload) => {
                try { onChange(payload); } catch (e) { console.warn('onChange error:', e); }
            })
            .subscribe();

        return function unsubscribe() {
            if (realtimeChannel) {
                try { supabaseClient.removeChannel(realtimeChannel); } catch (e) {}
                realtimeChannel = null;
            }
        };
    }

    const cfg = options || {};
    const intervalMs = Math.max(2000, Number(cfg.intervalMs) || 5000);
    let lastSig = null;
    let stopped = false;

    async function poll() {
        if (stopped) return;
        const sig = await getMedicamentsSignature();
        if (!sig) return;
        if (lastSig && sig !== lastSig) {
            try {
                onChange({ type: 'change', source: 'poll' });
            } catch (e) {
                console.warn('onChange error:', e);
            }
        }
        lastSig = sig;
    }

    poll();
    const id = setInterval(poll, intervalMs);
    cloudMedsPoller = id;

    return function unsubscribe() {
        stopped = true;
        if (id) clearInterval(id);
        if (cloudMedsPoller === id) cloudMedsPoller = null;
    };
}

// Subscription for achats (realtime if available, else polling)
function subscribeToAchats(onChange, options) {
    if (!isCloudEnabled) return null;

    if (supabaseClient && typeof supabaseClient.channel === 'function') {
        if (realtimeAchatsChannel) {
            try { supabaseClient.removeChannel(realtimeAchatsChannel); } catch (e) {}
        }
        realtimeAchatsChannel = supabaseClient
            .channel('achats-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'achats' }, (payload) => {
                try { onChange(payload); } catch (e) { console.warn('onChange error:', e); }
            })
            .subscribe();

        return function unsubscribe() {
            if (realtimeAchatsChannel) {
                try { supabaseClient.removeChannel(realtimeAchatsChannel); } catch (e) {}
                realtimeAchatsChannel = null;
            }
        };
    }

    const cfg = options || {};
    const intervalMs = Math.max(2000, Number(cfg.intervalMs) || 5000);
    let lastSig = null;
    let stopped = false;

    async function poll() {
        if (stopped) return;
        const sig = await getAchats();
        const nextSig = Array.isArray(sig) ? sig.map(a => `${a.id}|${a.updated_at || a.created_at || ''}|${a.quantite}|${a.nom}`).join(';') : '';
        if (!nextSig) return;
        if (lastSig && nextSig !== lastSig) {
            try {
                onChange({ type: 'change', source: 'poll' });
            } catch (e) {
                console.warn('onChange error:', e);
            }
        }
        lastSig = nextSig;
    }

    poll();
    const id = setInterval(poll, intervalMs);

    return function unsubscribe() {
        stopped = true;
        if (id) clearInterval(id);
    };
}

// Supprimer tous les medicaments du cloud
async function clearAllCloudMeds() {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?id=not.is.null`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            return { error: null };
        } else {
            const err = await response.text();
            return { error: err };
        }
    } catch (e) {
        return { error: e.message };
    }
}
// ========== ACHATS (À ACHETER) ==========

// Récupérer tous les achats - retourne un tableau simple
async function getAchats() {
    if (!isCloudEnabled) {
        console.warn('⚠️ Cloud non activé pour getAchats');
        return [];
    }
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/achats?select=*&order=id.desc`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const err = await response.text();
            console.error('❌ Erreur getAchats:', err);
            return [];
        }
        
        const data = await response.json();
        console.log('✅ Achats reçus:', data.length);
        return data || [];
    } catch (e) {
        console.error('❌ Erreur getAchats:', e);
        return [];
    }
}

// Ajouter un achat
async function addAchat(item) {
    if (!isCloudEnabled) {
        console.warn('⚠️ Cloud non activé pour addAchat');
        return { error: 'Cloud not enabled' };
    }
    
    const data = {
        nom: item.name,
        quantite: item.qty,
        notes: item.notes || ''
    };
    
    console.log('📤 Envoi addAchat vers cloud:', data);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/achats`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Réponse addAchat:', response.status);
        
        if (response.ok || response.status === 201) {
            const result = await response.json();
            console.log('✅ Achat inséré dans cloud');
            return { error: null, data: result };
        } else {
            const err = await response.text();
            console.error('❌ Erreur addAchat:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('❌ Erreur addAchat:', e);
        return { error: e.message };
    }
}

// Supprimer un achat par nom
async function deleteAchatByName(name) {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/achats?nom=eq.${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Achat', name, 'supprimé du cloud');
            return { error: null };
        } else {
            const err = await response.text();
            console.error('❌ Erreur deleteAchatByName:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('❌ Erreur deleteAchatByName:', e);
        return { error: e.message };
    }
}

// Supprimer un achat par id
async function deleteAchatById(id) {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };
    if (!id) return { error: 'Missing id' };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/achats?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (response.ok) {
            console.log('✅ Achat id', id, 'supprimé du cloud');
            return { error: null };
        } else {
            const err = await response.text();
            console.error('❌ Erreur deleteAchatById:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('❌ Erreur deleteAchatById:', e);
        return { error: e.message };
    }
}

// Mettre à jour un achat par id
async function updateAchatById(id, item) {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };
    if (!id) return { error: 'Missing id' };

    const data = {
        nom: item.name,
        quantite: item.qty,
        notes: item.notes || ''
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/achats?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            return { error: null };
        } else {
            const err = await response.text();
            console.error('❌ Erreur updateAchatById:', err);
            return { error: err };
        }
    } catch (e) {
        console.error('❌ Erreur updateAchatById:', e);
        return { error: e.message };
    }
}

// Vider tous les achats
async function clearAchats() {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/achats`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (response.ok) {
            return { error: null };
        } else {
            const err = await response.text();
            return { error: err };
        }
    } catch (e) {
        return { error: e.message };
    }
}

// ========== EXPOSER GLOBALEMENT POUR MOBILE ==========
window.initCloud = initCloud;
window.getMedicaments = getMedicaments;
window.addMedicament = addMedicament;
window.updateMedicament = updateMedicament;
window.deleteMedicament = deleteMedicament;
window.getAchats = getAchats;
window.addAchat = addAchat;
window.deleteAchatByName = deleteAchatByName;
window.clearAchats = clearAchats;
window.subscribeToMedicaments = subscribeToMedicaments;
window.clearAllCloudMeds = clearAllCloudMeds;
window.subscribeToAchats = subscribeToAchats;
window.deleteAchatById = deleteAchatById;
window.updateAchatById = updateAchatById;

