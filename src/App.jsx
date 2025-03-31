import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { evaluate } from "mathjs";
import { normalizeExpression } from "./utils/normalizeExpression";
import "./styles.css";

export default function App() {
  const [expressions, setExpressions] = useState([
    { id: 1, expr: "sinx", color: "blue" }
  ]);

  const colors = ["blue", "red", "green", "orange", "purple", "cyan", "magenta"];

  // ✅ Android WebView support
  useEffect(() => {
    window.plotFromNative = function (expr) {
      console.log("📡 Received from Android:", expr);
      const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
      const nextColor = colors[expressions.length % colors.length];
      setExpressions(prev => [...prev, { id: nextId, expr: expr, color: nextColor }]);
    };
  }, [expressions]);

  const generatePlotData = () => {
    const plots = [];

    const xRange = Array.from({ length: 200 }, (_, i) => i / 10 - 10);
    const yRange = Array.from({ length: 200 }, (_, j) => j / 10 - 10);

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
              const scope = { x: xVal, y: yVal };
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

          return;
        }

        // Standard function: y = f(x)
        const x = Array.from({ length: 1000 }, (_, i) => i / 50 - 10);
        const y = x.map(val =>
          evaluate(normalizeExpression(exp.expr), { x: val })
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
      evaluate(normalizeExpression(expr), { x: 0 });
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
      </div>

      <div className="plot-area">
        <Plot
          data={generatePlotData()}
          layout={{
            autosize: true,
            dragmode: "pan",
            xaxis: {
              autorange: true,
              title: "x"
            },
            yaxis: {
              autorange: true,
              scaleanchor: "x",
              title: "y"
            },
            plot_bgcolor: "#121212",
            paper_bgcolor: "#121212",
            font: { color: "white" },
            margin: { t: 20 }
          }}
          config={{
            displaylogo: false,
            modeBarButtonsToRemove: ['sendDataToCloud'],
            responsive: true,
            scrollZoom: true,
          }}
          style={{ width: "100%", height: "500px" }}
        />
      </div>
    </div>
  );
}
