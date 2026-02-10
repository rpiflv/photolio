// Register service worker for PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('ServiceWorker registered:', registration)
        })
        .catch((error) => {
          console.log('ServiceWorker registration failed:', error)
        })
    })
  }
}

// PWA install prompt
let deferredPrompt: any = null

export function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e
    // Update UI to show install button
    showInstallPromotion()
  })

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully')
    deferredPrompt = null
  })
}

function showInstallPromotion() {
  // You can show a custom install button here
  console.log('App can be installed')
}

export async function promptInstall() {
  if (!deferredPrompt) {
    return false
  }

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  console.log(`User response to install prompt: ${outcome}`)
  deferredPrompt = null
  return outcome === 'accepted'
}
