// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import { useGoogleSheets } from "./hooks/useGoogleSheets.jsx"; // Hook para leer datos de Google Sheets
import MatchDisplay from "./components/MatchDisplay.jsx"; // Componente para mostrar un partido
import "./App.css"; // Estilos generales para el contenedor de la aplicación

// Importa las variables de entorno
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const MAIN_INDEX_SHEET_ID = import.meta.env.VITE_MAIN_INDEX_SHEET_ID;

/**
 * MatchWrapper Componente
 * Este componente es un wrapper para cada MatchDisplay.
 * Ya no gestiona el resaltado global, cada MatchDisplay lo gestiona localmente.
 *
 * @param {string} matchSheetId - El ID de la hoja de Google Sheets que contiene este partido.
 * @param {string} matchSheetName - El nombre de la pestaña (sheet) dentro de esa hoja que corresponde a este partido.
 */
function MatchWrapper({ matchSheetId, matchSheetName }) {
  // activeHighlight y triggerGlobalHighlight ELIMINADOS
  // Cada MatchWrapper utiliza el hook useGoogleSheets para obtener los datos de SU partido.
  const { data, loading, error } = useGoogleSheets(
    matchSheetId,
    matchSheetName,
    5000 // Polling cada 5 segundos
    // onScoreChange callback ELIMINADO de aquí
  );

  // Muestra el MatchDisplay siempre. MatchDisplay ahora maneja si mostrar datos o valores por defecto.
  return (
    <div className="pure-u-1 pure-u-sm-1-2 pure-u-md-1-3 pure-u-lg-1-4">
      <MatchDisplay
        data={data}
        error={error}
        matchName={matchSheetName} // Pasamos el nombre del partido para el título
        // activeHighlight ELIMINADO de aquí
      />
    </div>
  );
}

/**
 * App Componente
 * Orquesta la carga de los múltiples marcadores.
 * La gestión del resaltado ya NO es global aquí.
 */
function App() {
  const { indexSheetName = "JornadaActual" } = useParams();

  const [matchSheetId, setMatchSheetId] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [errorIndex, setErrorIndex] = useState(null);

  // === ESTADO GLOBAL DE RESALTADO ELIMINADO DE AQUÍ ===
  // const [activeHighlight, setActiveHighlight] = useState(null);
  // const highlightTimeoutRef = useRef(null);
  // const triggerGlobalHighlight = useCallback((matchName, scoreType) => { ... }, []);

  // Primer useEffect: Obtener el ID de la hoja de partidos
  useEffect(() => {
    console.log(
      "App useEffect: Checking environment variables and params for initial fetch:"
    );
    console.log("App useEffect: API_KEY =", API_KEY);
    console.log("App useEffect: MAIN_INDEX_SHEET_ID =", MAIN_INDEX_SHEET_ID);
    console.log(
      "App useEffect: indexSheetName (from URL/default) =",
      indexSheetName
    );

    const fetchMatchSheetId = async () => {
      setLoadingIndex(true);
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${MAIN_INDEX_SHEET_ID}/values/${indexSheetName}!A1?key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} for main index sheet. URL: ${url}`
          );
        }
        const result = await response.json();
        const idFromCell =
          result.values && result.values[0] && result.values[0][0]
            ? result.values[0][0]
            : null;

        if (idFromCell) {
          setMatchSheetId(idFromCell);
          setErrorIndex(null);
          console.log("App: Match Sheet ID obtained from A1:", idFromCell);
        } else {
          throw new Error(
            "No Google Sheet ID found in A1 of the main index sheet. Please ensure cell A1 contains the ID of your matchday sheet."
          );
        }
      } catch (err) {
        console.error(
          "App: Error fetching Match Sheet ID from main index sheet:",
          err
        );
        setErrorIndex(
          err.message || "Failed to fetch Match Sheet ID from main index sheet."
        );
        setMatchSheetId(null);
      } finally {
        setLoadingIndex(false);
      }
    };

    if (MAIN_INDEX_SHEET_ID && API_KEY && indexSheetName) {
      fetchMatchSheetId();
    } else {
      console.error(
        "App useEffect: One or more critical variables are missing or undefined for initial fetch."
      );
      console.error(
        "App useEffect: MAIN_INDEX_SHEET_ID is",
        MAIN_INDEX_SHEET_ID ? "defined" : "UNDEFINED/NULL"
      );
      console.error(
        "App useEffect: API_KEY is",
        API_KEY ? "defined" : "UNDEFINED/NULL"
      );
      console.error(
        "App useEffect: indexSheetName is",
        indexSheetName ? "defined" : "UNDEFINED/NULL"
      );
      setErrorIndex(
        "MAIN_INDEX_SHEET_ID, API_KEY, or indexSheetName is missing. Check your .env file and Netlify settings."
      );
      setLoadingIndex(false);
    }
  }, [MAIN_INDEX_SHEET_ID, API_KEY, indexSheetName]);

  // Segundo useEffect: Obtener todos los nombres de las pestañas (partidos)
  useEffect(() => {
    const fetchSheetNames = async () => {
      if (!matchSheetId) {
        setSheetNames([]);
        return;
      }
      setLoadingIndex(true);
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${matchSheetId}?key=${API_KEY}&fields=sheets.properties.title`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} when fetching sheet names for sheet ID: ${matchSheetId}`
          );
        }
        const result = await response.json();
        const names = result.sheets
          ? result.sheets.map((sheet) => sheet.properties.title)
          : [];
        const filteredNames = names.filter(
          (name) => !["Instrucciones", "Ayuda", "Configuración"].includes(name)
        );

        setSheetNames(filteredNames);
        setErrorIndex(null);
        console.log("App: Sheet names (match tabs) found:", filteredNames);
      } catch (err) {
        console.error("App: Error fetching sheet names for match sheet:", err);
        setErrorIndex(
          err.message || "Failed to fetch sheet names for match sheet."
        );
        setSheetNames([]);
      } finally {
        setLoadingIndex(false);
      }
    };

    if (matchSheetId) {
      fetchSheetNames();
    }
  }, [matchSheetId, API_KEY]);

  if (loadingIndex) {
    return <div className="app-container loading">Cargando jornada...</div>;
  }

  if (errorIndex) {
    return (
      <div className="app-container error">
        Error al cargar la jornada: {errorIndex}
      </div>
    );
  }

  if (!matchSheetId || sheetNames.length === 0) {
    return (
      <div className="app-container no-data">
        No se encontraron partidos o el ID de la hoja de jornada no es válido.
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="main-app-title">Marcadores de la Jornada</h1>
      <div className="match-list pure-g">
        {sheetNames.map((sheetName) => (
          <MatchWrapper
            key={sheetName}
            matchSheetId={matchSheetId}
            matchSheetName={sheetName}
            // activeHighlight y triggerGlobalHighlight ELIMINADOS de aquí
          />
        ))}
      </div>
    </div>
  );
}

// Envuelve el componente App en el Router
function RootApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/jornada/:indexSheetName" element={<App />} />
        <Route
          path="*"
          element={
            <div className="app-container not-found-page">
              <h2>404 - Página no encontrada</h2>
              <p>La URL que has introducido no coincide con ninguna jornada.</p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default RootApp;
