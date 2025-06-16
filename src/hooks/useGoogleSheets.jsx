// src/hooks/useGoogleSheets.jsx
import { useState, useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

// El hook ya NO acepta onScoreChange como argumento, ya que MatchDisplay lo gestiona localmente
export const useGoogleSheets = (sheetId, sheetName, interval = 5000) => {
  const [data, setData] = useState(() => {
    // Intenta cargar datos desde localStorage al inicializar el estado
    const cachedData = localStorage.getItem(
      `matchData-${sheetId}-${sheetName}`
    );
    return cachedData ? JSON.parse(cachedData) : null;
  });
  // El estado 'loading' indica si hay una petición en curso.
  // Se inicializa a true solo si NO hay datos en caché.
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const prevDataRef = useRef(null); // Para almacenar los datos de la petición anterior

  const cacheKey = `matchData-${sheetId}-${sheetName}`; // Clave única para localStorage de cada partido

  useEffect(() => {
    // Valida que el ID de la hoja y el nombre de la pestaña estén presentes
    if (!sheetId || !sheetName) {
      setData(null);
      setLoading(false);
      setError("Sheet ID or Sheet Name not provided for the hook.");
      return;
    }

    const fetchData = async () => {
      // Activa el indicador de carga solo si el estado actual de 'data' es null
      // (es decir, no hay datos iniciales de caché o se ha reseteado).
      if (!data) {
        setLoading(true);
      }

      try {
        // Construye la URL de la API de Google Sheets
        const range = `${sheetName}!A:D`;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
          // Si la respuesta HTTP no es exitosa, lanza un error
          throw new Error(
            `HTTP error! status: ${response.status} for sheet ${sheetName}`
          );
        }
        const result = await response.json();

        const rawRows = result.values || []; // Obtiene todas las filas de la respuesta

        console.log(
          `useGoogleSheets(${sheetName}): Raw rows directly from Google Sheets API:`,
          rawRows
        );

        // Objeto para almacenar los datos formateados del partido
        let newFormattedData = {
          mainScore: null,
          matchStatus: null,
          comments: [],
        };

        // Procesamiento de la primera fila (marcador principal)
        if (rawRows.length > 0 && rawRows[0].length >= 4) {
          newFormattedData.mainScore = {
            localTeam: rawRows[0][0],
            visitorTeam: rawRows[0][2],
            localScore: parseInt(rawRows[0][1], 10),
            visitorScore: parseInt(rawRows[0][3], 10),
          };
        } else {
          console.warn(
            `useGoogleSheets(${sheetName}): Primera fila no tiene suficientes datos o no existe para mainScore.`
          );
        }

        // Procesamiento de la segunda fila (estado del partido)
        if (rawRows.length > 1 && rawRows[1].length >= 3) {
          newFormattedData.matchStatus = {
            day: rawRows[1][0],
            time: rawRows[1][1],
            statusText: rawRows[1][2],
          };
        } else {
          console.warn(
            `useGoogleSheets(${sheetName}): Segunda fila no tiene suficientes datos o no existe para matchStatus.`
          );
        }

        // Procesamiento de las filas de comentarios (desde la tercera fila en adelante)
        for (let i = 2; i < rawRows.length; i++) {
          const row = rawRows[i];
          // Detiene la lectura si encuentra una fila completamente vacía (columna A vacía)
          if (!row || row.length === 0 || !row[0]) {
            break;
          }
          newFormattedData.comments.push(row[0]);
        }

        // Lógica de detección de cambio de marcador para activar el resaltado
        let changedScores = {};
        // Compara los nuevos datos con los datos previos almacenados en useRef
        if (
          newFormattedData.mainScore &&
          prevDataRef.current &&
          prevDataRef.current.mainScore
        ) {
          if (
            prevDataRef.current.mainScore.localScore !==
            newFormattedData.mainScore.localScore
          ) {
            changedScores.local = true;
          }
          if (
            prevDataRef.current.mainScore.visitorScore !==
            newFormattedData.mainScore.visitorScore
          ) {
            changedScores.visitor = true;
          }
        }
        // Adjunta las banderas 'changedScores' al objeto mainScore
        newFormattedData.mainScore = newFormattedData.mainScore
          ? { ...newFormattedData.mainScore, changedScores }
          : null;

        console.log(
          `useGoogleSheets(${sheetName}): Formatted data being set to state:`,
          newFormattedData
        );

        setData(newFormattedData); // Actualiza el estado con los nuevos datos
        prevDataRef.current = newFormattedData; // Actualiza la referencia a los datos previos

        // Guarda los nuevos datos en localStorage para caché
        try {
          localStorage.setItem(cacheKey, JSON.stringify(newFormattedData));
        } catch (e) {
          console.error("Error saving to localStorage:", e);
        }

        setError(null); // Limpia cualquier error anterior
      } catch (err) {
        console.error(`Error fetching sheet data for ${sheetName}:`, err);
        setError(err.message || "Failed to fetch data.");
        // Si la petición falla y no hay datos en caché, el estado 'data' podría quedar nulo.
        // Si había datos en caché, se mantienen visibles.
        if (!data) {
          setData(null);
        }
      } finally {
        setLoading(false); // Siempre finaliza el estado de carga
      }
    };

    // Ejecuta fetchData la primera vez y luego establece el polling
    fetchData();
    const pollInterval = setInterval(fetchData, interval);

    // Función de limpieza para detener el polling cuando el componente se desmonta o las dependencias cambian
    return () => {
      clearInterval(pollInterval);
    };
  }, [sheetId, sheetName, interval]); // Dependencias del useEffect

  return { data, loading, error };
};
