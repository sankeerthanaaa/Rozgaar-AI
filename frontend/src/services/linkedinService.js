// src/services/linkedinService.js
import api from '../lib/axios'

const linkedinService = {
  /**
   * Redirects the browser to LinkedIn OAuth authorization URL.
   * Call this when the user clicks "Connect LinkedIn".
   */
  redirectToLinkedIn() {
    const clientId    = import.meta.env.VITE_LINKEDIN_CLIENT_ID
    const redirectUri = encodeURIComponent('http://localhost:5173/linkedin/callback')
    const scope       = encodeURIComponent('openid profile email')
    const state       = crypto.randomUUID()          // CSRF guard

    // Persist state so the callback page can verify it
    sessionStorage.setItem('linkedin_oauth_state', state)

    const authUrl =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}`

    window.location.href = authUrl
  },

  /**
   * Called on /linkedin/callback page.
   * Sends the OAuth code to the backend, which exchanges it and returns profile data.
   * @param {string} code  — the ?code= query param from LinkedIn redirect
   * @returns {Promise<{ success: boolean, data: object }>}
   */
  async handleCallback(code) {
    const res = await api.get(`/linkedin/callback?code=${encodeURIComponent(code)}`)
    return res.data   // { success: true, data: { profile... } }
  },

  /**
   * Imports resume data from LinkedIn using the access token returned after OAuth.
   * @param {string} accessToken
   * @returns {Promise<{ success: boolean, data: object }>}
   */
  async importLinkedinProfile(accessToken) {
    const res = await api.post('/linkedin/import', { accessToken })
    return res.data   // { success: true, data: { resumeData... } }
  },
}

export default linkedinService
