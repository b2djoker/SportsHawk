import { Navigate, useLocation } from "react-router-dom";
import { getAccountType, getHomePath } from "../lib/account.js";

export default function RoleGate({ allowed, children }) {
  const location = useLocation();
  const accountType = getAccountType();

  if (!accountType) return <Navigate to="/onboarding" replace />;
  if (accountType !== allowed) {
    return (
      <Navigate
        to={getHomePath(accountType)}
        replace
        state={getRoleBlockState(accountType, allowed, location.pathname)}
      />
    );
  }

  return children;
}

function getRoleBlockState(accountType, allowed, pathname) {
  if (accountType === "player" && allowed === "coach") {
    return {
      roleBlock: {
        title: "Coach-only area blocked",
        body: "Player accounts cannot access scout or coach dashboards. SportsHawk keeps player development and coach scouting as separate account types."
      }
    };
  }

  if (accountType === "coach" && allowed === "player") {
    const isDrillRoute = pathname.startsWith("/drills");

    return {
      roleBlock: {
        title: isDrillRoute
          ? "Drill upload blocked"
          : "Player-only activity blocked",
        body: isDrillRoute
          ? "Coach accounts cannot upload drill videos or participate in player activities. Create a player account through SportsHawk support if you need athlete access."
          : "Coach accounts cannot participate in player activities, appear on player leaderboards, or use player-only development tools."
      }
    };
  }

  return {
    roleBlock: {
      title: "Account area blocked",
      body: "This account type cannot access that SportsHawk workspace."
    }
  };
}
