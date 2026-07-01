import { Navigate, Route, Routes } from "react-router-dom";
import AssessmentCenterPage from "./pages/AssessmentCenterPage.jsx";
import AppShell from "./components/AppShell.jsx";
import CardCustomizePage from "./pages/CardCustomizePage.jsx";
import CoachDashboardPage from "./pages/CoachDashboardPage.jsx";
import CoachMatchmakingPage from "./pages/CoachMatchmakingPage.jsx";
import CoachOnboardingPage from "./pages/CoachOnboardingPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ConnectionsPage from "./pages/ConnectionsPage.jsx";
import DrillLibraryPage from "./pages/DrillLibraryPage.jsx";
import HomeRedirect from "./pages/HomeRedirect.jsx";
import JugglingScoringPage from "./pages/JugglingScoringPage.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import PlayerDashboard from "./pages/PlayerDashboard.jsx";
import PlayerOnboardingPage from "./pages/PlayerOnboardingPage.jsx";
import PlayerMatchmakingPage from "./pages/PlayerMatchmakingPage.jsx";
import PlayerSettingsPage from "./pages/PlayerSettingsPage.jsx";
import StorePage from "./pages/StorePage.jsx";
import StoreRedemptionsPage from "./pages/StoreRedemptionsPage.jsx";
import SubscriptionPage from "./pages/SubscriptionPage.jsx";
import SkillTreePage from "./pages/SkillTreePage.jsx";
import ResetPage from "./pages/ResetPage.jsx";
import RoleGate from "./components/RoleGate.jsx";
import ScoutDashboardPage from "./pages/ScoutDashboardPage.jsx";
import WalletPage from "./pages/WalletPage.jsx";
import WeeklyReportPage from "./pages/WeeklyReportPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/reset" element={<ResetPage />} />
        <Route path="/onboarding/player" element={<PlayerOnboardingPage />} />
        <Route path="/onboarding/coach" element={<CoachOnboardingPage />} />
        <Route
          path="/player"
          element={
            <RoleGate allowed="player">
              <PlayerDashboard />
            </RoleGate>
          }
        />
        <Route
          path="/player/skill-tree"
          element={
            <RoleGate allowed="player">
              <SkillTreePage />
            </RoleGate>
          }
        />
        <Route
          path="/player/card"
          element={
            <RoleGate allowed="player">
              <CardCustomizePage />
            </RoleGate>
          }
        />
        <Route
          path="/player/weekly-report"
          element={
            <RoleGate allowed="player">
              <WeeklyReportPage />
            </RoleGate>
          }
        />
        <Route
          path="/player/settings"
          element={
            <RoleGate allowed="player">
              <PlayerSettingsPage />
            </RoleGate>
          }
        />
        <Route
          path="/player/matchmaking"
          element={
            <RoleGate allowed="player">
              <PlayerMatchmakingPage />
            </RoleGate>
          }
        />
        <Route
          path="/player/connections"
          element={
            <RoleGate allowed="player">
              <ConnectionsPage />
            </RoleGate>
          }
        />
        <Route
          path="/player/chat/:connectionId"
          element={
            <RoleGate allowed="player">
              <ChatPage />
            </RoleGate>
          }
        />
        <Route
          path="/drills"
          element={
            <RoleGate allowed="player">
              <DrillLibraryPage />
            </RoleGate>
          }
        />
        <Route
          path="/drills/juggling"
          element={
            <RoleGate allowed="player">
              <JugglingScoringPage />
            </RoleGate>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RoleGate allowed="player">
              <LeaderboardPage />
            </RoleGate>
          }
        />
        <Route
          path="/assessment"
          element={
            <RoleGate allowed="player">
              <AssessmentCenterPage />
            </RoleGate>
          }
        />
        <Route
          path="/wallet"
          element={
            <RoleGate allowed="player">
              <WalletPage />
            </RoleGate>
          }
        />
        <Route
          path="/player/store"
          element={
            <RoleGate allowed="player">
              <StorePage />
            </RoleGate>
          }
        />
        <Route
          path="/player/store/redemptions"
          element={
            <RoleGate allowed="player">
              <StoreRedemptionsPage />
            </RoleGate>
          }
        />
        <Route
          path="/player/subscription"
          element={
            <RoleGate allowed="player">
              <SubscriptionPage />
            </RoleGate>
          }
        />
        <Route
          path="/coach"
          element={
            <RoleGate allowed="coach">
              <CoachDashboardPage />
            </RoleGate>
          }
        />
        <Route
          path="/coach/matchmaking"
          element={
            <RoleGate allowed="coach">
              <CoachMatchmakingPage />
            </RoleGate>
          }
        />
        <Route
          path="/coach/connections"
          element={
            <RoleGate allowed="coach">
              <ConnectionsPage />
            </RoleGate>
          }
        />
        <Route
          path="/coach/chat/:connectionId"
          element={
            <RoleGate allowed="coach">
              <ChatPage />
            </RoleGate>
          }
        />
        <Route
          path="/scout"
          element={
            <RoleGate allowed="coach">
              <ScoutDashboardPage />
            </RoleGate>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
