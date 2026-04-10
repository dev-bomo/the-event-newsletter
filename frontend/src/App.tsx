import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import "./i18n/config";

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
