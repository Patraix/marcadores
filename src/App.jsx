// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import { useGoogleSheets } from "./hooks/useGoogleSheets";
import MatchDisplay from "./components/MatchDisplay";
import "./App.css"; // Estilos generales

const SheetPage = () => {
  const { sheetName } = useParams(); // Obtiene el GUID de la URL
  const { data, loading, error } = useGoogleSheets(sheetName, 3000); // Petición cada 3 segundos

  return <MatchDisplay data={data} loading={loading} error={error} />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/match/:sheetName" element={<SheetPage />} />
          <Route
            path="/"
            element={
              <div className="home-page">
                <h2>Bienvenido a la App de Resultados</h2>
                <p>Usa la URL para ver un partido específico:</p>
                <p>
                  Ejemplo: <code>/match/TU_GUID_DE_PESTAÑA</code>
                </p>
                <p>
                  Asegúrate de que la pestaña con ese GUID exista en tu Google
                  Sheet.
                </p>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="not-found-page">
                <h2>404 - Página no encontrada</h2>
                <p>
                  La URL que has introducido no coincide con ningún partido.
                </p>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
