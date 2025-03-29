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
    const x = Array.from({ length: 1000 }, (_, i) => i / 50 - 10);
    const plots = [];

    expressions.forEach((exp, index) => {
      const raw = normalizeExpression(exp.expr);
      const color = exp.color || colors[index % colors.length];

      try {
        // Compound y inequalities
        const compound = raw.match(/^\s*y\s*([<>]=?)\s*([^&]+)&&\s*y\s*([<>]=?)\s*(.+)$/i);
        if (compound) {
          const [, , expr1, , expr2] = compound;
          const y1 = x.map(val => evaluate(normalizeExpression(expr1), { x: val, ...variables }));
          const y2 = x.map(val => evaluate(normalizeExpression(expr2), { x: val, ...variables }));
          plots.push({ x, y: y1, type: "scatter", mode: "lines", line: { color } });
          plots.push({ x, y: y2, type: "scatter", mode: "lines", line: { color }, fill: "tonexty", fillcolor: color + "33" });
          return;
        }

        // Simple y inequality
        const yIneq = raw.match(/^\s*y\s*([<>]=?)\s*(.+)$/i);
        if (yIneq) {
          const [, , rhs] = yIneq;
          const yVals = x.map(val => evaluate(normalizeExpression(rhs), { x: val, ...variables }));
          plots.push({ x, y: yVals, type: "scatter", mode: "lines", line: { color }, fill: "tonexty", fillcolor: color + "33" });
          return;
        }

        // X inequality
        const xIneq = raw.match(/^\s*x\s*([<>]=?)\s*([\d.\-+*/ePIx()]+)$/i);
        if (xIneq) {
          const [, op, rhs] = xIneq;
          const xVal = evaluate(normalizeExpression(rhs), variables);
          const y = x.map(val => {
            switch (op) {
              case ">": return val > xVal ? 10 : NaN;
              case "<": return val < xVal ? 10 : NaN;
              case ">=": return val >= xVal ? 10 : NaN;
              case "<=": return val <= xVal ? 10 : NaN;
              default: return NaN;
            }
          });
          plots.push({ x, y, type: "scatter", mode: "none", fill: "tozeroy", fillcolor: color + "33", name: exp.expr });
          return;
        }

        // Standard function
        const y = x.map(val =>
          evaluate(normalizeExpression(exp.expr), { x: val, ...variables })
        );

        plots.push({ x, y, type: "scatter", mode: "lines", marker: { color }, name: exp.expr });
      } catch (err) {
        plots.push({
          x: [0], y: [0],
          type: "scatter", mode: "text",
          text: [`❌ Error in: ${exp.expr}`],
          textposition: "top center",
          marker: { color: "red" },
          showlegend: false
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
      <h1>Graphing Calculator</h1>

      {expressions.map(exp => (
        <div key={exp.id} className="expression-row">
          <input
            type="text"
            value={exp.expr}
            onChange={(e) => handleExpressionChange(exp.id, e.target.value)}
            placeholder="Enter expression like sinx, y>x^2, a*sinx"
          />
          <button className="remove-btn" onClick={() => removeExpression(exp.id)}>✖</button>
          {!isValidExpression(exp.expr) &&
            !exp.expr.trim().startsWith("y") &&
            !exp.expr.trim().startsWith("x") && (
              <div style={{ color: "red", fontSize: "0.8em" }}>
                ❌ Invalid Expression
              </div>
            )}
        </div>
      ))}

      <button className="add-btn" onClick={addExpression}>
        + Add Expression
      </button>

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

      <Plot
        data={generatePlotData()}
        layout={{
          autosize: true,
          paper_bgcolor: "#121212",
          plot_bgcolor: "#121212",
          font: { color: "white" },
          margin: { t: 20 },
        }}
        config={{
          displaylogo: false,
          modeBarButtonsToRemove: ['sendDataToCloud'],
        }}
        style={{ width: "100%", height: "500px" }}
      />
    </div>
  );
}
