import { useState, useCallback, lazy, Suspense } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import PageLoader from './components/common/PageLoader.jsx'
import { useArchiveActions } from './hooks/useArchive'
import { queryKeys } from './config/queryClient'
import { getSharedProductId, setProductInUrl } from './utils/share'
import './App.css'

// ---------------------------------------------------------------------------
// Lazy-loaded pages — each becomes its own JS chunk that is only downloaded
// the first time the page is opened. The Catalog (landing page) stays eager.
// ---------------------------------------------------------------------------
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'))

function App() {
  // A shared link (?product=<id>) opens straight into the product detail.
  const [sharedId] = useState(getSharedProductId)

  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState(sharedId ? 'detail' : 'list') // 'list' | 'create' | 'edit' | 'detail' | 'editProfile'
  const [selectedGun, setSelectedGun] = useState(sharedId ? { id: sharedId } : null)
  const [editingGun, setEditingGun] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [profileNotice, setProfileNotice] = useState('')
  const { archiveGun, archiving } = useArchiveActions()
  const queryClient = useQueryClient()

  const clearProfileNotice = useCallback(() => setProfileNotice(''), [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target !== 'Detail') setProductInUrl(null)

    if (target === 'Create') {
      setMode('create')
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      setProductInUrl(payload.id)
    } else if (target === 'EditProfile') {
      setMode('editProfile')
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToList = () => {
    setProductInUrl(null)
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  // After a create / edit the cached product queries are outdated.
  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.guns })
    handleBackToList()
    setTab('Catalog')
  }

  // Resume a saved draft from Profile › Drafts
  const handleOpenDraft = (draftId) => {
    if (draftId === 'create') handleNavigate('Create')
    else handleNavigate('Edit', { id: draftId })
  }

  // Only pass full product data as placeholder (not the bare { id } of a shared link)
  const detailPlaceholder = selectedGun && selectedGun.name ? selectedGun : undefined

  return (
    <div className="shell">
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      <Header
        tab={mode === 'list' ? tab : ''}
        onTab={(newTab) => handleNavigate(newTab)}
        onNavigateCreate={() => handleNavigate('Create')}
      />

      <main className="main">
        <Suspense fallback={<PageLoader />}>
          {/* Sub-page views */}
          {mode === 'create' && (
            <CreateGunPage
              onBack={handleBackToList}
              onSuccess={handleSaved}
            />
          )}

          {mode === 'edit' && (
            <EditGunPage
              gun={editingGun}
              gunId={editingGun?.id}
              onBack={handleBackToList}
              onSuccess={handleSaved}
            />
          )}

          {mode === 'detail' && selectedGun && (
            <ProductDetailPage
              key={selectedGun.id}
              gunId={selectedGun.id}
              initialGun={detailPlaceholder}
              onBack={handleBackToList}
              onEdit={(g) => handleNavigate('Edit', g)}
              onDelete={(g) => setDeleteTarget(g)}
            />
          )}

          {mode === 'editProfile' && (
            <EditProfilePage
              onBack={() => handleNavigate('Profile')}
              onSaved={() => {
                setProfileNotice('Profile successfully updated.')
                handleNavigate('Profile')
              }}
            />
          )}

          {/* Top-level Tabs */}
          {mode === 'list' && (
            <>
              {tab === 'Catalog' && (
                <Catalog
                  onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                />
              )}
              {tab === 'Favorites' && (
                <FavoritesPage
                  onSelectGun={(g) => handleNavigate('Detail', g)}
                  onNavigateCatalog={() => handleNavigate('Catalog')}
                />
              )}
              {tab === 'Cart' && (
                <CartPage onNavigateCatalog={() => handleNavigate('Catalog')} />
              )}
              {tab === 'Profile' && (
                <ProfilePage
                  onReplaySplash={() => setShowSplash(true)}
                  onEditProfile={() => handleNavigate('EditProfile')}
                  onOpenDraft={handleOpenDraft}
                  notice={profileNotice}
                  onNoticeShown={clearProfileNotice}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Global Archive (soft delete) Confirmation */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Archive Hardware Record"
        message={`Move "${deleteTarget?.name}" to the archive? It will be hidden from the catalog and can be restored from Profile › Archive.`}
        confirmLabel="Archive"
        loading={archiving}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await archiveGun(deleteTarget)
            setDeleteTarget(null)
            handleBackToList()
            setTab('Catalog')
          } catch (err) {
            alert(err.message || 'Failed to archive record.')
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
