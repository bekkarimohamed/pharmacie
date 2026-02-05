/**
 * Supabase Cloud Integration for Pharmacie Domicile
 * VERSION 5.0 - API REST directe
 */

const SUPABASE_URL = 'https://oywsadhtcvzhesnmevdg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xJrQOqaul0GTcvoJe92LpA_ACquZtRe';

var isCloudEnabled = false;

// Test connection à Supabase
async function initCloud() {
    try {
        console.log('🔄 Test connexion Supabase...');
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

// Récupérer tous les médicaments
async function getMedicaments() {
    if (!isCloudEnabled) {
        console.warn('Cloud non activé pour getMedicaments');
        return { data: [], error: null };
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
            return { data: null, error: err };
        }
        
        const data = await response.json();
        console.log('Données reçues:', data.length, 'médicaments');
        return { data: data || [], error: null };
    } catch (e) {
        console.error('Erreur get:', e);
        return { data: null, error: e.message };
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

// ========== ACHATS (À ACHETER) ==========

// Récupérer tous les achats
async function getAchats() {
    if (!isCloudEnabled) {
        console.warn('⚠️ Cloud non activé pour getAchats');
        return { data: [], error: null };
    }
    
    console.log('📥 Récupération achats depuis cloud...');
    
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
            console.error('❌ Erreur getAchats:', response.status, err);
            return { data: null, error: err };
        }
        
        const data = await response.json();
        console.log('✅ Achats reçus du cloud:', data.length);
        return { data: data || [], error: null };
    } catch (e) {
        console.error('❌ Erreur getAchats:', e);
        return { data: null, error: e.message };
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
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });
        
        console.log('📥 Réponse addAchat:', response.status);
        
        if (response.ok || response.status === 201) {
            console.log('✅ Achat inséré dans cloud');
            return { error: null };
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

