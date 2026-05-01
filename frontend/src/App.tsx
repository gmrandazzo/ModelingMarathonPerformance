import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  Scatter,
  ReferenceArea
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import './App.css';

interface PlotData {
  vo2_lt: number;
  speed_high: number;
  speed_low: number;
  speed_avg: number;
  speed_range: [number, number];
}

interface TandaPlotData {
  training_weekly_km: number;
  predicted_pace_sec_km: number;
  study_baseline_pace_sec_km: number;
}

interface TandaStudyPoint {
  k: number;
  pm: number;
}

interface CalculationResult {
  vo2_lt: number;
  marathon_speed_kmh: number;
  marathon_time: string;
  plot_data: PlotData[];
  current_point: {
    vo2_lt: number;
    speed: number;
  };
  tanda_time?: string;
  tanda_speed_kmh?: number;
  tanda_plot_data?: TandaPlotData[];
  tanda_study_data?: TandaStudyPoint[];
}

type ModelView = 'joyner' | 'tanda' | 'compare';

function App() {
  // Joyner Inputs
  const [vo2Max, setVo2Max] = useState(70);
  const [lactateMmol, setLactateMmol] = useState(2.5);
  const [economyFactor, setEconomyFactor] = useState(0.5);

  // Tanda Inputs
  const [trainingDistance, setTrainingDistance] = useState(70);
  const [trainingPaceMin, setTrainingPaceMin] = useState(4);
  const [trainingPaceSec, setTrainingPaceSec] = useState(30);

  const [selectedView, setSelectedView] = useState<ModelView>('compare');
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const calculate = async () => {
      try {
        const paceInSeconds = trainingPaceMin * 60 + trainingPaceSec;
        const response = await fetch('/api/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vo2_max: vo2Max,
            lactate_mmol: lactateMmol,
            economy_factor: economyFactor,
            training_weekly_km: trainingDistance,
            training_pace_sec_km: paceInSeconds,
          }),
        });
        if (!response.ok) {
          console.error('API Error Status:', response.status);
          return;
        }
        const data = (await response.json()) as CalculationResult;
        setResult(data);
      } catch (error) {
        console.error('Error calculating:', error);
      }
    };

    void calculate();
  }, [vo2Max, lactateMmol, economyFactor, trainingDistance, trainingPaceMin, trainingPaceSec]);

  return (
    <div className="container">
      <header className="app-header">
        <h1>Marathon Performance Modeler</h1>
        <div className="view-selector">
          <label>Select View:</label>
          <select 
            value={selectedView} 
            onChange={(e) => setSelectedView(e.target.value as ModelView)}
          >
            <option value="joyner">Joyner Model (Physiological)</option>
            <option value="tanda">Tanda Model (Training-based)</option>
            <option value="compare">Unified Dashboard (Compare All)</option>
          </select>
        </div>
      </header>

      <div className="layout">
        <div className="visualization">
          {selectedView === 'joyner' && (
            <>
              <div className="chart-header">
                Marathon Speed vs VO2 at Lactate Threshold (Joyner 1991)
              </div>
              {result && (
                <ResponsiveContainer width="100%" height={600}>
                  <ComposedChart
                    data={result.plot_data}
                    margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="vo2_lt" 
                      type="number"
                      domain={[30, 85]}
                      label={{ value: 'VO2 at LT (ml/kg/min)', position: 'bottom', offset: 40 }} 
                    />
                    <YAxis 
                      label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', offset: -20 }} 
                      domain={[10, 25]}
                      ticks={[10, 12, 14, 16, 18, 20, 22, 24]}
                    />
                    <Tooltip 
                      formatter={(value: ValueType | undefined, name: any) => {
                        const displayName = String(name || "Value");
                        if (typeof value === 'number') return [`${value.toFixed(2)} km/h`, displayName];
                        if (Array.isArray(value)) return [`${value[0].toFixed(2)} - ${value[1].toFixed(2)} km/h`, displayName];
                        return [String(value || ''), displayName];
                      }}
                      labelFormatter={(label) => `Supply (VO₂ at LT): ${label} ml/kg/min`}
                    />
                    <Legend verticalAlign="top" height={50} iconType="circle"/>
                    <Area name="Performance Range" type="monotone" dataKey="speed_range" stroke="#8884d8" fill="#8884d8" fillOpacity={0.15} isAnimationActive={false} />
                    <Line name="Average Economy" type="monotone" dataKey="speed_avg" stroke="#82ca9d" dot={false} strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} />
                    <ReferenceDot x={result.current_point.vo2_lt} y={result.current_point.speed} r={10} fill="#ff0000" stroke="#fff" strokeWidth={3} label={{ value: 'Current', position: 'top', fill: '#ff0000', fontSize: 12, fontWeight: 'bold' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
              
              <div className="scientific-context" style={{marginTop: '3rem', padding: 0, background: 'transparent', border: 'none'}}>
                <h2>Scientific Context & Model Derivation</h2>
                <div className="context-grid">
                  <div className="context-card">
                    <h3>1. The Joyner Formula (1991)</h3>
                    <p>
                      Joyner's original conceptual model defines marathon speed as:
                    </p>
                    <div className="formula-box">
                      <code>Speed = VO₂max × %LT × RE</code>
                    </div>
                    <p style={{fontSize: '0.85rem', marginTop: '10px'}}>
                      Where <strong>%LT</strong> is the fraction of VO₂max sustained and <strong>RE</strong> is the running economy.
                    </p>
                    <p style={{fontSize: '0.85rem', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '8px'}}>
                      <strong>How %LT is determined:</strong> Joyner defined this fraction based on empirical observations of elite runners, noting they typically sustain <strong>75% to 85% of VO₂max</strong> during a 2-hour race, corresponding to blood lactate levels between 2.0 and 3.0 mmol/L.
                    </p>
                  </div>

                  <div className="context-card">
                    <h3>2. %LT (Fraction Sustained) Mapping</h3>
                    <p>
                      To calculate the <strong>%LT</strong> (percentage of VO₂max sustained), we use a linear mapping based on elite performance benchmarks:
                    </p>
                    <ul style={{fontSize: '0.85rem', paddingLeft: '20px'}}>
                      <li><strong>1.5 mmol/L</strong> (High Efficiency) ≈ 90% LT</li>
                      <li><strong>2.5 mmol/L</strong> (Average Efficiency) ≈ 80% LT</li>
                      <li><strong>4.0 mmol/L</strong> (Low Efficiency) ≈ 65% LT</li>
                    </ul>
                    <div className="formula-box">
                      <code>%LT = 105 - (Lactate × 10)</code>
                    </div>
                    <div style={{fontSize: '0.75rem', marginTop: '10px', color: '#666', borderTop: '1px solid #eee', paddingTop: '8px'}}>
                      <strong>Mathematical Derivation:</strong><br/>
                      Using the linear equation <code>y = mx + b</code> where <code>y</code> is %LT and <code>x</code> is Lactate:<br/>
                      1. <strong>Slope (m):</strong> (80% - 90%) / (2.5 - 1.5) = <strong>-10</strong> (Drop in %LT per mmol/L).<br/>
                      2. <strong>Intercept (b):</strong> 80 = (-10 × 2.5) + b &rarr; 80 = -25 + b &rarr; b = <strong>105</strong>.
                    </div>
                  </div>

                  <div className="context-card">
                    <h3>3. The Regression Constants</h3>
                    <p>
                      Derived from <strong>treadmill experiments</strong> (Conley & Krahenbuhl, 1980), these constants define the Running Economy lines:
                    </p>
                    <ul style={{fontSize: '0.8rem', paddingLeft: '15px', color: '#666'}}>
                      <li><strong>High Economy (100%):</strong> Slope 0.2936 | Intercept 2.6481</li>
                      <li><strong>Average Economy (50%):</strong> Slope 0.2878 | Intercept 1.5867</li>
                      <li><strong>Low Economy (0%):</strong> Slope 0.2779 | Intercept 1.2499</li>
                    </ul>
                    <p style={{fontSize: '0.75rem', marginTop: '10px'}}>
                      The <strong>Slope</strong> is km/h gained per ml/kg/min of O₂. The <strong>Intercept</strong> is the laboratory baseline offset.
                    </p>
                  </div>
                </div>

                <div className="context-card" style={{marginTop: '2rem', width: '100%'}}>
                  <h3>4. Comprehensive Marathon Speed Model & 10% Correction</h3>
                  <p>Because treadmill running lacks wind resistance and is of short duration, Joyner applies a <strong>10% slowing factor (0.90)</strong> to adapt lab data to a real-world marathon:</p>
                  <div className="formula-box" style={{textAlign: 'center', padding: '1rem'}}>
                    <code>Final Speed = [(VO₂max × %LT/100) × Slope + Intercept] × 0.90</code>
                  </div>
                  <p style={{fontSize: '0.85rem', marginTop: '10px', textAlign: 'center'}}>
                    <strong>Correction Breakdown:</strong> ~7-8% for Wind Resistance (overground) + ~2-3% for VO₂ Drift (increase in metabolic cost over 2+ hours).
                  </p>
                  <div style={{fontSize: '0.85rem', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                    <p><strong>Implementation Note (Lactate):</strong> Since the input is in mmol/L, we use the linear mapping <code>%LT = 105 - (Lactate × 10)</code>. This allows the model to demonstrate how a "higher" lactate response (indicating less metabolic efficiency) translates to a lower sustained fraction of an athlete's VO₂max capacity.</p>
                    <p style={{marginTop: '10px'}}><strong>Implementation Note (Constants):</strong> The Slopes (0.2936 to 0.2779) and Intercepts (2.6481 to 1.2499) are <strong>Joyner's 1991 re-calculations</strong> (inverted to predict km/h) using the raw treadmill data from Conley & Krahenbuhl (1980).</p>
                  </div>
                </div>

                <div className="context-grid" style={{marginTop: '2rem'}}>
                  <div className="context-card">
                    <h3>5. Measuring & Estimating Running Economy</h3>
                    <p>Running Economy (RE) is the metabolic cost of a given speed. It is measured in a lab using a metabolic mask to track <strong>ml/kg/min of oxygen</strong> consumed at steady-state paces.</p>
                    <ul style={{fontSize: '0.85rem', paddingLeft: '20px', marginTop: '10px'}}>
                      <li><strong>Direct Measurement:</strong> Oxygen cost divided by velocity ($VO_2 / v$).</li>
                      <li><strong>Field Proxy:</strong> If your Heart Rate drops at the same pace, your RE has likely improved.</li>
                      <li><strong>Improvements:</strong> Strength training, high mileage, and "super shoes" (carbon plates) can improve RE by 3-4%.</li>
                    </ul>
                  </div>

                  <div className="context-card">
                    <h3>6. Estimating Your % Economy</h3>
                    <p>The 0–100% scale represents the range between the <strong>Least (0%)</strong> and <strong>Most (100%)</strong> economical elite runners in the 1980 study.</p>
                    <div style={{fontSize: '0.85rem', background: '#f8f9fa', padding: '10px', borderRadius: '6px', margin: '10px 0'}}>
                      <strong>VO₂ Cost at 16 km/h (Treadmill):</strong>
                      <ul style={{marginTop: '5px'}}>
                        <li><strong>100% Efficiency:</strong> 45.5 ml/kg/min</li>
                        <li><strong>0% Efficiency:</strong> 53.1 ml/kg/min</li>
                      </ul>
                    </div>
                    <p style={{fontSize: '0.85rem', fontWeight: 'bold', marginTop: '10px'}}>The Calibration Method (No Lab):</p>
                    <p style={{fontSize: '0.85rem'}}>Set your VO₂max and Lactate (2.5), then move the Economy slider until the <strong>Predicted Time</strong> matches your current Marathon PB. That percentage is your relative Running Economy.</p>
                  </div>
                </div>

                <div className="context-card" style={{marginTop: '2rem', width: '100%', borderTop: '2px solid #007bff'}}>
                  <h3>References & Literature</h3>
                  <ul style={{fontSize: '0.85rem', lineHeight: '1.6'}}>
                    <li>
                      <strong>Joyner, M. J. (1991).</strong> Modeling: optimal marathon performance on the basis of physiological factors. 
                      <em>Journal of Applied Physiology</em>, 70(2), 683-687. 
                      <a href="https://doi.org/10.1152/jappl.1991.70.2.683" target="_blank" rel="noreferrer" style={{marginLeft: '5px', color: '#007bff'}}>doi: 10.1152/jappl.1991.70.2.683</a>
                    </li>
                    <li>
                      <strong>Conley, D. L., & Krahenbuhl, G. S. (1980).</strong> Running economy and distance running performance of highly trained athletes. 
                      <em>Medicine and Science in Sports and Exercise</em>, 12(5), 357-360. 
                      <a href="https://journals.lww.com/acsm-msse/abstract/1980/25000/running_economy_and_distance_running_performance.10.aspx" target="_blank" rel="noreferrer" style={{marginLeft: '5px', color: '#007bff'}}>[Link to Article]</a>
                    </li>
                    <li>
                      <strong>Benítez-Muñoz, J. A., & Cupeiro, R. (2025).</strong> Factors Influencing Blood Lactate Concentration During Exercise: A Narrative Review With a Lactate Shuttle Perspective. 
                      <em>Acta Physiologica</em>, e70131. 
                      <a href="https://doi.org/10.1111/apha.70131" target="_blank" rel="noreferrer" style={{marginLeft: '5px', color: '#007bff'}}>doi: 10.1111/apha.70131</a>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {selectedView === 'tanda' && (
            <div className="tanda-focus">
              <div className="chart-header">
                Marathon Pace vs Weekly Distance (Tanda 2011 Data & Model)
              </div>
              {result && (
                <ResponsiveContainer width="100%" height={500}>
                  <ComposedChart
                    margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      type="number"
                      dataKey="training_weekly_km"
                      name="Distance"
                      unit="km"
                      domain={[30, 150]}
                      label={{ value: 'Weekly Distance (km)', position: 'bottom', offset: 40 }} 
                    />
                    <YAxis 
                      type="number"
                      dataKey="predicted_pace_sec_km"
                      name="Pace"
                      unit="s/km"
                      domain={[320, 220]}
                      ticks={[320, 300, 280, 260, 240, 220]}
                      label={{ value: 'Pace (sec/km)', angle: -90, position: 'insideLeft', offset: -20 }} 
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: ValueType | undefined, name: any) => {
                        if (typeof value === 'number') {
                          const min = Math.floor(value / 60);
                          const sec = Math.round(value % 60);
                          return [`${min}:${sec.toString().padStart(2, '0')} /km`, name];
                        }
                        return [String(value || ''), name];
                      }}
                    />
                    <Legend verticalAlign="top" height={50} iconType="circle"/>
                    
                    {/* Validity Range Area */}
                    <ReferenceArea
                      x1={40}
                      x2={111}
                      y1={307}
                      y2={237}
                      stroke="none"
                      fill="#f0f0f0"
                      fillOpacity={0.4}
                      label={{ value: 'Model Validity Range', position: 'top', fill: '#888', fontSize: 10 }}
                    />

                    {/* Raw Study Data */}
                    <Scatter
                      name="Tanda Study Data (n=46)"
                      data={result.tanda_study_data?.map(p => ({ training_weekly_km: p.k, predicted_pace_sec_km: p.pm }))}
                      fill="#8884d8"
                      line={false}
                    />

                    {/* Study Baseline Line (P=284.6) */}
                    <Line
                      name="Study Mean Regression (P=284.6)"
                      data={result.tanda_plot_data}
                      type="monotone"
                      dataKey="study_baseline_pace_sec_km"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />

                    {/* Model Prediction Line */}
                    <Line
                      name="Your Tanda Prediction"
                      data={result.tanda_plot_data}
                      type="monotone"
                      dataKey="predicted_pace_sec_km"
                      stroke="#007bff"
                      dot={false}
                      strokeWidth={3}
                      isAnimationActive={false}
                    />

                    {/* Current User Dot */}
                    <ReferenceDot
                      x={trainingDistance}
                      y={3600 / (result.tanda_speed_kmh || 1)}
                      r={10}
                      fill="#ff0000"
                      stroke="#fff"
                      strokeWidth={3}
                      label={{ value: 'Current', position: 'top', fill: '#ff0000', fontSize: 12, fontWeight: 'bold' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
              <div className="tanda-focus-stats" style={{textAlign: 'center', marginTop: '2rem'}}>
                <div style={{fontSize: '3rem', fontWeight: 'bold', color: '#007bff'}}>
                  {result?.tanda_time}
                </div>
                <div style={{fontSize: '1.2rem', color: '#666'}}>
                  Predicted Marathon Time at {result?.tanda_speed_kmh} km/h
                </div>
              </div>
              <div className="context-card" style={{maxWidth: '800px', margin: '2rem auto'}}>
                <h3>Scientific Basis</h3>
                <p>The Tanda model correlates marathon pace (Pm) with two training indices from the 8 weeks prior to the race:</p>
                <ul>
                  <li><strong>K:</strong> Mean weekly distance (km/week)</li>
                  <li><strong>P:</strong> Mean training pace (sec/km)</li>
                </ul>
                <div className="formula-box"><code>Pm = 17.1 + 140e<sup>-0.0053K</sup> + 0.55P</code></div>
                <p style={{fontSize: '0.85rem', marginTop: '1rem'}}>
                  Tanda, G. (2011). Prediction of marathon performance time on the basis of training indices. <em>Journal of Human Sport & Exercise</em>.
                </p>
              </div>
            </div>
          )}

          {selectedView === 'compare' && (
            <div className="comparison-dashboard">
              <h2>Unified Performance Leaderboard</h2>
              <div className="leaderboard">
                <div className="leaderboard-card">
                  <div className="card-label">Joyner (Physiological)</div>
                  <div className="card-time">{result?.marathon_time}</div>
                  <div className="card-sub">{result?.marathon_speed_kmh} km/h</div>
                  <div className="card-note">Potential based on lab metrics</div>
                </div>
                <div className="leaderboard-card highlight">
                  <div className="card-label">Tanda (Training)</div>
                  <div className="card-time">{result?.tanda_time}</div>
                  <div className="card-sub">{result?.tanda_speed_kmh} km/h</div>
                  <div className="card-note">Predicted by training load</div>
                </div>
              </div>
              <div className="comparison-analysis" style={{marginTop: '2rem', padding: '1.5rem', background: '#fff9e6', borderRadius: '8px', border: '1px solid #ffeeba'}}>
                <strong>Analysis:</strong> The gap between these two models represents your "Training Efficiency." 
                If Joyner is faster than Tanda, you have more potential than your current training supports.
              </div>
            </div>
          )}
        </div>

        <div className="controls-panel">
          <h3>Runner Profile</h3>
          
          {(selectedView === 'joyner' || selectedView === 'compare') && (
            <div className="input-section">
              <h4>Physiology (Joyner)</h4>
              <div className="control-group">
                <label>VO2 Max <span className="value-display">{vo2Max}</span></label>
                <input type="range" min="40" max="90" value={vo2Max} onChange={(e) => setVo2Max(Number(e.target.value))} />
              </div>
              <div className="control-group">
                <label>Lactate Response <span className="value-display">{lactateMmol.toFixed(1)}</span></label>
                <input type="range" min="1.5" max="4.0" step="0.1" value={lactateMmol} onChange={(e) => setLactateMmol(Number(e.target.value))} />
              </div>
              <div className="control-group">
                <label>Economy Factor <span className="value-display">{(economyFactor * 100).toFixed(0)}%</span></label>
                <input type="range" min="0" max="1" step="0.01" value={economyFactor} onChange={(e) => setEconomyFactor(Number(e.target.value))} />
              </div>
              {result && selectedView === 'joyner' && (
                <div className="results" style={{marginTop: '1rem'}}>
                  <h3>Joyner Predictions</h3>
                  <div className="result-item">
                    <span className="result-label">LT Intensity: </span>
                    {Math.round((result.vo2_lt / vo2Max) * 100)}% VO2 Max
                  </div>
                  <div className="result-item">
                    <span className="result-label">Speed: </span>
                    {result.marathon_speed_kmh} km/h
                  </div>
                  <div className="result-item">
                    <span className="result-label">Time: </span>
                    <span style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {result.marathon_time}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {(selectedView === 'tanda' || selectedView === 'compare') && (
            <div className="input-section">
              <h4>Training (Tanda)</h4>
              <div className="control-group">
                <label>Weekly Distance <span className="value-display">{trainingDistance} km</span></label>
                <input type="range" min="30" max="150" value={trainingDistance} onChange={(e) => setTrainingDistance(Number(e.target.value))} />
              </div>
              <div className="control-group">
                <label>Mean Pace <span className="value-display">{trainingPaceMin}:{trainingPaceSec.toString().padStart(2, '0')} /km</span></label>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input type="number" min="3" max="8" value={trainingPaceMin} onChange={(e) => setTrainingPaceMin(Number(e.target.value))} style={{width: '60px'}} />
                  <span>:</span>
                  <input type="number" min="0" max="59" value={trainingPaceSec} onChange={(e) => setTrainingPaceSec(Number(e.target.value))} style={{width: '60px'}} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
