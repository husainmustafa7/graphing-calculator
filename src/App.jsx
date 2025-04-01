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
  const [plotRange, setPlotRange] = useState({
    xMin: -10, xMax: 10, yMin: -10, yMax: 10
  });

  const colors = ["blue", "red", "green", "orange", "purple", "cyan", "magenta"];

  const extractVariables = (expr) => {
    const normalized = normalizeExpression(expr);
    const matches = normalized.match(/\b[a-zA-Z]\b/g);
    const letters = [...new Set(matches?.map((l) => l.toLowerCase()) || [])];
    return letters.filter((v) => !["x", "e", "p"].includes(v));
  };

  useEffect(() => {
    window.plotFromNative = function (expr) {
      const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
      const nextColor = colors[expressions.length % colors.length];
      setExpressions(prev => [...prev, { id: nextId, expr, color: nextColor }]);
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
    const { xMin, xMax } = plotRange;
    const x = Array.from({ length: 1500 }, (_, i) => xMin + (i * (xMax - xMin)) / 1499);

    expressions.forEach((exp, index) => {
      const raw = normalizeExpression(exp.expr);
      const color = exp.color || colors[index % colors.length];
      const isImplicit = raw.includes("=") && raw.includes("x") && raw.includes("y");

      try {
        if (isImplicit) {
          const expr0 = normalizeExpression(raw.replace("=", "-"));
          const points = { x: [], y: [] };

          const yVals = Array.from({ length: 300 }, (_, j) =>
            plotRange.yMin + (j * (plotRange.yMax - plotRange.yMin)) / 299);

          x.forEach(xVal => {
            yVals.forEach(yVal => {
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
            hoverinfo: "skip"
          });
          return;
        }

        const y = x.map(val =>
          evaluate(normalizeExpression(exp.expr), { x: val, ...variables })
        );

        plots.push({
          x,
          y,
          type: "scatter",
          mode: "lines",
          line: { color, width: 2 },
          name: exp.expr
        });

      } catch (err) {
        plots.push({
          x: [0],
          y: [0],
          type: "scatter",
          mode: "text",
          text: [`❌ ${exp.expr}`],
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

  const resetZoom = () => {
    setPlotRange({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
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
        <button className="reset-btn" onClick={resetZoom}>🔄 Reset Zoom</button>
      </div>

      <div className="plot-area">
        <Plot
          data={generatePlotData()}
          layout={{
            autosize: true,
            dragmode: "pan",
            xaxis: {
              range: [plotRange.xMin, plotRange.xMax],
              fixedrange: false
            },
            yaxis: {
              range: [plotRange.yMin, plotRange.yMax],
              fixedrange: false,
              scaleanchor: "x"
            },
            paper_bgcolor: "#121212",
            plot_bgcolor: "#121212",
            font: { color: "white" },
            margin: { t: 20 }
          }}
          config={{
            displaylogo: false,
            modeBarButtonsToRemove: ['sendDataToCloud', 'autoscale', 'resetScale2d']
          }}
          onRelayout={(e) => {
            if (
              e["xaxis.range[0]"] && e["xaxis.range[1]"] &&
              e["yaxis.range[0]"] && e["yaxis.range[1]"]
            ) {
              setPlotRange({
                xMin: e["xaxis.range[0]"],
                xMax: e["xaxis.range[1]"],
                yMin: e["yaxis.range[0]"],
                yMax: e["yaxis.range[1]"]
              });
            }
          }}
          style={{ width: "100%", height: "100vh" }}
        />
      </div>
    </div>
  );
}
