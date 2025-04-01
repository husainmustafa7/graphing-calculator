import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { evaluate } from "mathjs";
import { normalizeExpression } from "./utils/normalizeExpression";
import "./styles.css";

export default function App() {
  const [expressions, setExpressions] = useState([
    { id: 1, expr: "sinx", color: "blue" }
  ]);

  const [plotRange, setPlotRange] = useState({
    xMin: -50, xMax: 50,
    yMin: -50, yMax: 50
  });

  const colors = ["blue", "red", "green", "orange", "purple", "cyan", "magenta"];

  useEffect(() => {
    window.plotFromNative = function (expr) {
      const nextId = expressions.length ? expressions[expressions.length - 1].id + 1 : 1;
      const nextColor = colors[expressions.length % colors.length];
      setExpressions(prev => [...prev, { id: nextId, expr, color: nextColor }]);
    };
  }, [expressions]);

  const generatePlotData = () => {
    const plots = [];
    const resolution = 2000;
    const stepX = (plotRange.xMax - plotRange.xMin) / resolution;
    const x = Array.from({ length: resolution }, (_, i) => plotRange.xMin + i * stepX);

    const stepXY = (plotRange.xMax - plotRange.xMin) / 100;
    const xRange = Array.from({ length: 100 }, (_, i) => plotRange.xMin + i * stepXY);
    const yRange = Array.from({ length: 100 }, (_, j) => plotRange.yMin + j * stepXY);

    expressions.forEach((exp, index) => {
      const raw = normalizeExpression(exp.expr);
      const color = exp.color || colors[index % colors.length];
      const isImplicit = raw.includes("=") && raw.includes("x") && raw.includes("y");

      try {
        if (isImplicit) {
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

        const y = x.map(val =>
          evaluate(normalizeExpression(exp.expr), { x: val })
        );

        plots.push({
          x,
          y,
          type: "scatter",
          mode: "lines",
          line: {
            color,
            width: 2,
            dash: "solid"
          },
          name: exp.expr,
        });

      } catch (err) {
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
      <h2 className="title">Graphing Calculator</h2>

      {expressions.map(exp => (
        <div key={exp.id} className="expression-row">
          <input
            type="text"
            value={exp.expr}
            onChange={(e) => handleExpressionChange(exp.id, e.target.value)}
            placeholder="e.g. y = sinx or x^2 + y^2 = 25"
          />
          <button className="remove-btn" onClick={() => removeExpression(exp.id)}>✖</button>
        </div>
      ))}

      <button className="add-btn" onClick={addExpression}>+ Add Expression</button>

      <button className="reset-btn" onClick={resetZoom}>🔄 Reset Zoom</button>

      <Plot
        data={generatePlotData()}
        layout={{
          dragmode: "pan",
          xaxis: {
            title: "x",
            range: [plotRange.xMin, plotRange.xMax]
          },
          yaxis: {
            title: "y",
            range: [plotRange.yMin, plotRange.yMax],
            scaleanchor: "x"
          },
          plot_bgcolor: "#121212",
          paper_bgcolor: "#121212",
          font: { color: "white" },
          margin: { t: 20 }
        }}
        config={{
          displaylogo: false,
          scrollZoom: true,
          responsive: true,
          modeBarButtonsToRemove: ['sendDataToCloud', 'autoScale2d', 'resetScale2d']
        }}
        onRelayout={(e) => {
          if (e["xaxis.range[0]"] && e["xaxis.range[1]"] && e["yaxis.range[0]"] && e["yaxis.range[1]"]) {
            setPlotRange({
              xMin: e["xaxis.range[0]"],
              xMax: e["xaxis.range[1]"],
              yMin: e["yaxis.range[0]"],
              yMax: e["yaxis.range[1]"]
            });
          }
        }}
        style={{
          width: "100%",
          height: window.innerWidth < 600 ? "400px" : "500px"
        }}
      />
    </div>
  );
}
