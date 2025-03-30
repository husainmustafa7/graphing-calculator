import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { evaluate } from "mathjs";
import { normalizeExpression } from "./utils/normalizeExpression";
import "./styles.css";

export default function App() {
  const [expressions, setExpressions] = useState([
    { id: 1, expr: "sinx", color: "blue" }
  ]);
  const [variables, setVariables] = useState({});

  const colors = ["blue", "red", "green", "orange", "purple", "cyan", "magenta"];

  const extractVariables = (expr) => {
    const normalized = normalizeExpression(expr);
    const matches = normalized.match(/\b[a-zA-Z]\b/g); // only single-letter variables
    const letters = [...new Set(matches?.map((l) => l.toLowerCase()) || [])];
    return letters.filter((v) => !["x", "e", "p"].includes(v));
  };

  // ✅ Hook for Android WebView input
  useEffect(() => {
    window.plotFromNative = function (expr) {
      console.log("📡 Received from Android:", expr);
      const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
      const nextColor = colors[expressions.length % colors.length];
      setExpressions(prev => [...prev, { id: nextId, expr: expr, color: nextColor }]);
    };
  }, [expressions]);

  useEffect(() => {
    const allVars = new Set();
    expressions.forEach(exp => {
      extractVariables(exp.expr).forEach(v => allVars.add(v));
    });

    const updated = {};
    allVars.forEach(v => {
      updated[v] = variables[v] ?? 1;
    });

    setVariables(updated);
  }, [expressions]);

  const generatePlotData = () => {
    const plots = [];
  
    // High-res grid for implicit plotting
    const xRange = Array.from({ length: 200 }, (_, i) => i / 10 - 10); // -10 to 10
    const yRange = Array.from({ length: 200 }, (_, j) => j / 10 - 10); // -10 to 10
  
    expressions.forEach((exp, index) => {
      const raw = normalizeExpression(exp.expr);
      const color = exp.color || colors[index % colors.length];
      const isImplicit = raw.includes("=") && raw.includes("x") && raw.includes("y");
  
      try {
        if (isImplicit) {
          console.log("✅ Plotting implicit:", exp.expr);
  
          const expr0 = normalizeExpression(raw.replace("=", "-"));
          const points = { x: [], y: [] };
  
          xRange.forEach(xVal => {
            yRange.forEach(yVal => {
              const scope = { x: xVal, y: yVal, ...variables };
              const result = evaluate(expr0, scope);
              if (Math.abs(result) < 0.8) {
                points.x.push(xVal);
                points.y.push(yVal);
              }
            });
          });
  
          plots.push({
            x: points.x,
            y: points.y,
            type: "scatter",
            mode: "markers",
            marker: { color, size: 3 },
            name: exp.expr,
            hoverinfo: "skip",
          });
  
          return; // ❗ Prevent standard plotting below
        }
  
        // ✅ Standard function plot (y = f(x))
        const x = Array.from({ length: 1000 }, (_, i) => i / 50 - 10);
        const y = x.map(val =>
          evaluate(normalizeExpression(exp.expr), { x: val, ...variables })
        );
  
        plots.push({
          x,
          y,
          type: "scatter",
          mode: "lines",
          marker: { color },
          name: exp.expr,
        });
  
      } catch (err) {
        console.warn(`❌ Error parsing: ${exp.expr}`, err);
  
        plots.push({
          x: [0], y: [0],
          type: "scatter",
          mode: "text",
          text: [`❌ ${exp.expr}`],
          textposition: "top center",
          marker: { color: "red" },
          showlegend: false,
        });
      }
    });
  
    return plots;
  };       

  const isValidExpression = (expr) => {
    try {
      evaluate(normalizeExpression(expr), { x: 0, ...variables });
      return true;
    } catch {
      return false;
    }
  };

  const handleExpressionChange = (id, value) => {
    setExpressions(expressions.map(exp =>
      exp.id === id ? { ...exp, expr: value } : exp
    ));
  };

  const addExpression = () => {
    const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
    const nextColor = colors[expressions.length % colors.length];
    setExpressions([...expressions, { id: nextId, expr: "", color: nextColor }]);
  };

  const removeExpression = (id) => {
    setExpressions(expressions.filter(exp => exp.id !== id));
  };

  return (
  <div className="container">
    <div className="sidebar">
      <h2>Graphing Calculator</h2>

      {expressions.map(exp => (
        <div key={exp.id} className="expression-row">
          <input
            type="text"
            value={exp.expr}
            onChange={(e) => handleExpressionChange(exp.id, e.target.value)}
            placeholder="e.g. y = sinx"
          />
          <button className="remove-btn" onClick={() => removeExpression(exp.id)}>✖</button>
        </div>
      ))}

      <button className="add-btn" onClick={addExpression}>+ Add Expression</button>

      <div className="sliders">
        {Object.keys(variables).map(v => (
          <div key={v} className="slider-container">
            <label>
              {v} = {variables[v]}
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={variables[v]}
                onChange={(e) =>
                  setVariables({ ...variables, [v]: parseFloat(e.target.value) })
                }
              />
            </label>
          </div>
        ))}
      </div>
    </div>

    <div className="plot-area">
      <Plot
        data={generatePlotData()}
        layout={{
          autosize: true,
          xaxis: { range: [-6, 6] },
          yaxis: { range: [-6, 6] },
          plot_bgcolor: "#121212",
          paper_bgcolor: "#121212",
          font: { color: "white" },
          margin: { t: 20 }
        }}
        config={{
          displaylogo: false,
          modeBarButtonsToRemove: ['sendDataToCloud'],
        }}
        style={{ width: "100%", height: "500px" }}
      />
      </div>
    </div>
  );
}
