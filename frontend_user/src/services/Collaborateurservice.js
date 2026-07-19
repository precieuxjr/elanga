import api from './api';

export default {
  // POST /api/collaborateur/demande
  async demander({ type_organisation, nom_organisation, justification }) {
    const { data } = await api.post('/collaborateur/demande', {
      type_organisation, nom_organisation, justification
    });
    return data;
  },

  // GET /api/collaborateur/ma-demande
  async maDemande() {
    const { data } = await api.get('/collaborateur/ma-demande');
    return data;
  },

  // GET /api/collaborateur/signalements (signalements ouverts a une proposition)
  async getSignalements() {
    const { data } = await api.get('/collaborateur/signalements');
    return data;
  },

  // POST /api/collaborateur/signalements/:id/proposer
  // Cree un evenement d'assainissement : titre, date prevue, message.
  async proposerSolution(signalementId, { titre, date_evenement, message }) {
    const { data } = await api.post(`/collaborateur/signalements/${signalementId}/proposer`, {
      titre, date_evenement, message
    });
    return data;
  },

  // GET /api/collaborateur/propositions (mes evenements, tous statuts)
  async mesPropositions() {
    const { data } = await api.get('/collaborateur/propositions');
    return data;
  },

  // POST /api/collaborateur/collaborations/:id/debuter
  // Etape 1 : photo du lieu avant intervention (multipart).
  async demarrerAssainissement(collaborationId, fichierPhotoAvant) {
    const form = new FormData();
    form.append('photo_avant', fichierPhotoAvant);
    const { data } = await api.post(`/collaborateur/collaborations/${collaborationId}/debuter`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  // POST /api/collaborateur/propositions/:id/rapport
  // Etape 2 : rapport texte + photo du lieu apres intervention (multipart).
  async envoyerRapport(collaborationId, rapportTexte, fichierPhotoApres) {
    const form = new FormData();
    form.append('rapport', rapportTexte);
    form.append('photo_apres', fichierPhotoApres);
    const { data } = await api.post(`/collaborateur/propositions/${collaborationId}/rapport`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  // --- Evenements publics (tout utilisateur connecte) ---
  async getEvenements() {
    const { data } = await api.get('/evenements');
    return data;
  },
  async getStatistiquesEvenements() {
    const { data } = await api.get('/evenements/statistiques');
    return data;
  },
  async rejoindreEvenement(id) {
    const { data } = await api.post(`/evenements/${id}/rejoindre`);
    return data;
  },
  async quitterEvenement(id) {
    const { data } = await api.post(`/evenements/${id}/quitter`);
    return data;
  }
};