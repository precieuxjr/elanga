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

  // GET /api/collaborateur/signalements (une fois le statut collaborateur obtenu)
  async getSignalements() {
    const { data } = await api.get('/collaborateur/signalements');
    return data;
  },

  // POST /api/collaborateur/signalements/:id/proposer
  async proposerSolution(signalementId, message) {
    const { data } = await api.post(`/collaborateur/signalements/${signalementId}/proposer`, { message });
    return data;
  },

  // GET /api/collaborateur/propositions
  async mesPropositions() {
    const { data } = await api.get('/collaborateur/propositions');
    return data;
  },

  // POST /api/collaborateur/propositions/:id/rapport
  async envoyerRapport(propositionId, rapport) {
    const { data } = await api.post(`/collaborateur/propositions/${propositionId}/rapport`, { rapport });
    return data;
  }
};