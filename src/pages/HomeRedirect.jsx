import { Navigate } from "react-router-dom";
import { getHomePath } from "../lib/account.js";

export default function HomeRedirect() {
  return <Navigate to={getHomePath()} replace />;
}
