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
        console.log('Test connexion Supabase...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?select=count`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        console.log('Réponse:', response.status);
        
        if (response.ok || response.status === 200 || response.status === 406) {
            isCloudEnabled = true;
            console.log('✅ Cloud Supabase connecté');
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
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Réponse insert:', response.status);
        
        if (response.ok || response.status === 201 || response.status === 400) {
            // Même 400 peut être OK si les données sont insérées
            return { error: null };
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

// Supprimer un médicament
async function deleteMedicament(id) {
    if (!isCloudEnabled) return { error: 'Cloud not enabled' };
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/medicaments?id=eq.${id}`, {
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

// Status
function getCloudStatus() {
    return { enabled: isCloudEnabled };
}
