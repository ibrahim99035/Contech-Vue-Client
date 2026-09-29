/**
 * Google Identity Services (GIS) wrapper — NO PKCE.
 *
 * This is a CONFIDENTIAL web client: the server holds GOOGLE_CLIENT_SECRET and
 * exchanges the authorization code for an id_token itself (see Contech-IoT-Server
 * src/controllers/auth/googleAuth.js exchangeCodeForTokens). Because the server
 * does the exchange as a confidential client using client_secret, PKCE is NOT
 * used: Google rejects a code_verifier ("code_verifier or verifier is not
 * needed") when a confidential-client exchange supplies client_secret.
 *
 * So this module just opens the GIS popup and resolves with the bare auth code.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

let gisScriptPromise = null

function loadGisScript() {
  if (window.google?.accounts) {
    console.log('[NO-PKCE] ✅ using cached window.google.accounts')
    return Promise.resolve(window.google)
  }
  if (gisScriptPromise) return gisScriptPromise

  console.log('[NO-PKCE] 🚀 creating GIS <script>...')
  gisScriptPromise = new Promise((resolve, reject) => {
    document.querySelectorAll('script[data-gis-nopkce]').forEach((el) => el.remove())

    const script = document.createElement('script')
    const cleanup = () => {
      gisScriptPromise = null
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
    }
    const onLoad = () => {
      cleanup()
      console.log('[NO-PKCE] ✅ GIS script loaded')
      resolve(window.google)
    }
    const onError = () => {
      cleanup()
      script.remove()
      reject(new Error('Failed to load Google Identity Services'))
    }

    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.setAttribute('data-gis-nopkce', '1')
    document.head.appendChild(script)
  })

  return gisScriptPromise
}

/**
 * Opens the Google popup and resolves with the raw authorization code.
 * @param {string|null} clientIdOverride optional override client id
 * @returns {Promise<{ code: string }>}
 */
export async function getGoogleIdToken(clientIdOverride) {
  const clientId = clientIdOverride || CLIENT_ID
  if (!clientId) {
    throw new Error(
      'Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.'
    )
  }

  const google = await loadGisScript()
  console.log(`[NO-PKCE] ✅ GIS ready; opening popup with client_id ${clientId.slice(0, 14)}…`)

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (fn, arg) => {
      if (!settled) {
        settled = true
        fn(arg)
      }
    }

    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      redirect_uri: 'postmessage',
      callback: (response) => {
        console.log('[NO-PKCE] ↪️ GIS callback:', {
          error: response?.error,
          hasCode: Boolean(response?.code),
          codeLen: response?.code?.length
        })
        if (response.error) {
          finish(
            reject,
            new Error(response.error_description || response.error)
          )
        } else if (response.code) {
          console.log(`[NO-PKCE] ✅ received auth code (${response.code.length} chars)`)
          finish(resolve, { code: response.code })
        } else {
          finish(reject, new Error('Google Sign-In was cancelled'))
        }
      },
      error_callback: (err) => {
        console.log('[NO-PKCE] ❌ GIS error_callback:', err?.type)
        finish(reject, new Error(err?.type || 'Google Sign-In failed'))
      }
    })

    console.log('[NO-PKCE] 🚀 requestCode() → popup opens')
    client.requestCode()
  })
}
