import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme/provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { TerminologyProvider } from '@/contexts/terminology-context'
import ProtectedRoute from '@/components/auth/protected-route'
import PlatformLayout from '@/components/nav/platform/layout'
import { useAuth } from '@/hooks/use-auth'

// Public Routes
import Home from '@/routes/home'
import Invite from '@/routes/invite'
import Login from '@/routes/auth/login'
import Signup from '@/routes/auth/signup'
import VerifyEmail from '@/routes/auth/verify-email'
import ForgotPassword from '@/routes/auth/forgot-password'
import Privacy from '@/routes/privacy'
import PrivacyContact from './routes/privacy-contact/page'
import Terms from '@/routes/terms'
import Thread from '@/routes/thread'
import ManifestPublicContact from '@/routes/manifest-public/contact'
import ManifestPublicJourney from '@/routes/manifest-public/journey'
import ManifestPublicPage from '@/routes/manifest-public'

// Protected Routes
import Admin from '@/routes/admin'
import Basecamp from '@/routes/basecamp'
import Guides from '@/routes/guides'
import GuidePass from '@/routes/guides/guide-pass'
import GuideTraverse from '@/routes/guides/guide-traverse'
import Itinerary from '@/routes/itinerary'
import Logs from '@/routes/logs'
import ManifestEdit from '@/routes/manifest-edit'
import NotFound from '@/routes/not-found'
import Provisions from '@/routes/provisions'
import Settings from '@/routes/settings'
import Headwaters from '@/routes/headwaters'
import Starfield from '@/routes/starfield'
import Signals from '@/routes/signals'

/** Full platform nav when logged in; limited public sidebar when anonymous. */
function AdaptivePlatformLayout() {
    const { user } = useAuth()
    return <PlatformLayout mode={user ? 'full' : 'public'} />
}

export default function App() {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <TooltipProvider>
                <TerminologyProvider>
                    <Routes>
                        {/* Adaptive shell — full nav when logged in, Outpost-only when anonymous */}
                        <Route element={<AdaptivePlatformLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/outpost" element={<Navigate to="/" replace />} />
                            <Route path="/manifest/:username" element={<ManifestPublicPage />} />
                            <Route path="/manifest/:username/contact" element={<ManifestPublicContact />} />
                            <Route path="/manifest/:username/journey" element={<ManifestPublicJourney />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/privacy-contact" element={<PrivacyContact />} />
                            <Route path="/terms" element={<Terms />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/verify-email" element={<VerifyEmail />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/invite/:token" element={<Invite />} />
                            <Route path="/thread/:token" element={<Thread />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* Protected routes — full platform sidebar */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<PlatformLayout mode="full" />}>
                                <Route path="/admin" element={<Admin />} />
                                <Route path="/basecamp" element={<Basecamp />} />
                                <Route path="/signals" element={<Signals />} />
                                <Route path="/logs" element={<Logs />} />
                                <Route path="/guides" element={<Guides />} />
                                <Route path="/guides/:guideId/pass" element={<GuidePass />} />
                                <Route path="/guides/traverse" element={<GuideTraverse />} />
                                <Route path="/provisions" element={<Provisions />} />
                                <Route path="/itinerary" element={<Itinerary />} />
                                <Route path="/manifest" element={<ManifestEdit />} />
                                <Route path="/headwaters" element={<Headwaters />} />
                                <Route path="/starfield" element={<Starfield />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>
                        </Route>
                    </Routes>
                </TerminologyProvider>
            </TooltipProvider>
            <Toaster />
        </ThemeProvider>
    )
}
