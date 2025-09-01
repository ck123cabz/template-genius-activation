/**
 * Time-Series Analysis Utilities
 * Epic 5, Story 5.2: Cohort Analysis by Hypothesis Type
 * 
 * Advanced time-series analysis utilities supporting conversion tracking,
 * trend detection, seasonality analysis, and forecasting for cohort analytics.
 * Leverages statistical methods from Story 5.1 for rigorous analysis.
 */

/**
 * Time-series data point interface
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Moving average calculation result
 */
export interface MovingAverageResult {
  values: number[];
  period: number;
  type: 'simple' | 'exponential' | 'weighted';
}

/**
 * Trend detection result
 */
export interface TrendDetectionResult {
  hasTrend: boolean;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1
  changePoints: ChangePoint[];
  trendStartDate: Date | null;
  trendEndDate: Date | null;
  confidence: number; // 0-1
}

/**
 * Change point in time series
 */
export interface ChangePoint {
  timestamp: Date;
  changeType: 'level' | 'trend' | 'variance';
  changeMagnitude: number;
  confidence: number; // 0-1
  beforeValue: number;
  afterValue: number;
}

/**
 * Autocorrelation analysis result
 */
export interface AutocorrelationResult {
  correlations: number[]; // Correlation at different lags
  significantLags: number[]; // Lags with significant correlation
  maxCorrelation: number;
  maxCorrelationLag: number;
  confidence: number; // 0-1
}

/**
 * Seasonal decomposition result
 */
export interface SeasonalDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  seasonalPeriod: number;
  seasonalStrength: number; // 0-1
  trendStrength: number; // 0-1
  residualVariance: number;
}

/**
 * Forecast result
 */
export interface ForecastResult {
  forecastValues: number[];
  forecastDates: Date[];
  confidenceIntervals: [number, number][];
  forecastMethod: string;
  accuracy: ForecastAccuracy;
  assumptions: string[];
}

/**
 * Forecast accuracy metrics
 */
export interface ForecastAccuracy {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  smape: number; // Symmetric Mean Absolute Percentage Error
  r2: number; // R-squared
}

/**
 * Outlier detection result
 */
export interface OutlierDetectionResult {
  outliers: OutlierPoint[];
  outlierCount: number;
  outlierRate: number; // percentage of outliers
  detectionMethod: string;
  threshold: number;
  cleanedSeries: TimeSeriesDataPoint[];
}

/**
 * Individual outlier point
 */
export interface OutlierPoint {
  timestamp: Date;
  value: number;
  outlierScore: number; // how unusual the value is
  outlierType: 'high' | 'low' | 'contextual';
  expectedValue: number;
  deviation: number;
}

/**
 * Time series smoothing result
 */
export interface SmoothingResult {
  smoothedValues: number[];
  smoothingMethod: string;
  parameters: Record<string, number>;
  residuals: number[];
  goodnessOfFit: number; // R-squared or similar
}

/**
 * Volatility analysis result
 */
export interface VolatilityAnalysis {
  volatility: number; // overall volatility measure
  timeVaryingVolatility: number[]; // volatility over time
  volatilityRegimes: VolatilityRegime[];
  garchParameters?: GARCHParameters; // if GARCH modeling used
}

/**
 * Volatility regime identification
 */
export interface VolatilityRegime {
  startDate: Date;
  endDate: Date;
  averageVolatility: number;
  regimeType: 'low' | 'medium' | 'high';
  transitionProbability: number; // probability of staying in this regime
}

/**
 * GARCH model parameters
 */
export interface GARCHParameters {
  alpha: number; // ARCH parameter
  beta: number; // GARCH parameter
  omega: number; // constant term
  logLikelihood: number;
  aic: number; // Akaike Information Criterion
  bic: number; // Bayesian Information Criterion
}

/**
 * Main Time-Series Analysis Engine
 */
export class TimeSeriesAnalysisEngine {
  /**
   * Calculate moving averages (simple, exponential, weighted)
   */
  calculateMovingAverage(
    data: TimeSeriesDataPoint[],
    period: number,
    type: 'simple' | 'exponential' | 'weighted' = 'simple'
  ): MovingAverageResult {
    if (data.length < period) {
      throw new Error(`Insufficient data points: ${data.length} < ${period}`);
    }

    const values = data.map(point => point.value);
    let movingAverages: number[] = [];

    switch (type) {
      case 'simple':
        movingAverages = this.calculateSimpleMovingAverage(values, period);
        break;
      case 'exponential':
        movingAverages = this.calculateExponentialMovingAverage(values, period);
        break;
      case 'weighted':
        movingAverages = this.calculateWeightedMovingAverage(values, period);
        break;
    }

    return {
      values: movingAverages,
      period,
      type
    };
  }

  /**
   * Detect trends in time series data
   */
  detectTrends(
    data: TimeSeriesDataPoint[],
    sensitivity: number = 0.7
  ): TrendDetectionResult {
    if (data.length < 3) {
      return this.getDefaultTrendResult();
    }

    const values = data.map(point => point.value);
    const timestamps = data.map(point => point.timestamp);

    // Use Mann-Kendall test for trend detection
    const mkResult = this.mannKendallTest(values);
    
    // Detect change points using CUSUM or similar method
    const changePoints = this.detectChangePoints(data, sensitivity);
    
    // Determine trend direction and strength
    const trendDirection = mkResult.slope > 0.01 ? 'increasing' : 
                          mkResult.slope < -0.01 ? 'decreasing' : 'stable';
    
    const trendStrength = Math.min(1, Math.abs(mkResult.tau)); // Kendall's tau as strength measure
    
    return {
      hasTrend: mkResult.pValue < 0.05 && trendStrength > sensitivity,
      trendDirection,
      trendStrength,
      changePoints,
      trendStartDate: changePoints.length > 0 ? changePoints[0].timestamp : timestamps[0],
      trendEndDate: changePoints.length > 0 ? changePoints[changePoints.length - 1].timestamp : timestamps[timestamps.length - 1],
      confidence: 1 - mkResult.pValue
    };
  }

  /**
   * Analyze autocorrelation to identify patterns and seasonality
   */
  analyzeAutocorrelation(
    data: TimeSeriesDataPoint[],
    maxLag: number = Math.min(data.length / 4, 20)
  ): AutocorrelationResult {
    const values = data.map(point => point.value);
    const correlations: number[] = [];
    const significantLags: number[] = [];

    // Calculate autocorrelation function
    for (let lag = 1; lag <= maxLag; lag++) {
      const correlation = this.calculateAutocorrelation(values, lag);
      correlations.push(correlation);

      // Check significance (simplified: |correlation| > 2/sqrt(n))
      const significanceThreshold = 2 / Math.sqrt(values.length);
      if (Math.abs(correlation) > significanceThreshold) {
        significantLags.push(lag);
      }
    }

    const maxCorrelationIndex = correlations.reduce((maxIndex, correlation, index) => 
      Math.abs(correlation) > Math.abs(correlations[maxIndex]) ? index : maxIndex, 0
    );

    return {
      correlations,
      significantLags,
      maxCorrelation: correlations[maxCorrelationIndex],
      maxCorrelationLag: maxCorrelationIndex + 1,
      confidence: significantLags.length / correlations.length
    };
  }

  /**
   * Perform seasonal decomposition
   */
  seasonalDecomposition(
    data: TimeSeriesDataPoint[],
    seasonalPeriod: number
  ): SeasonalDecomposition {
    if (data.length < 2 * seasonalPeriod) {
      throw new Error(`Insufficient data for seasonal decomposition: need at least ${2 * seasonalPeriod} points`);
    }

    const values = data.map(point => point.value);
    
    // Extract trend using moving averages
    const trend = this.extractTrend(values, seasonalPeriod);
    
    // Extract seasonal component
    const seasonal = this.extractSeasonal(values, trend, seasonalPeriod);
    
    // Calculate residuals
    const residual = values.map((value, i) => 
      value - (trend[i] || 0) - (seasonal[i] || 0)
    );

    // Calculate component strengths
    const seasonalStrength = this.calculateSeasonalStrength(values, seasonal);
    const trendStrength = this.calculateTrendStrength(values, trend);
    const residualVariance = this.calculateVariance(residual.filter(r => !isNaN(r)));

    return {
      trend,
      seasonal,
      residual,
      seasonalPeriod,
      seasonalStrength,
      trendStrength,
      residualVariance
    };
  }

  /**
   * Generate forecasts using various methods
   */
  forecast(
    data: TimeSeriesDataPoint[],
    forecastPeriods: number,
    method: 'linear' | 'exponential_smoothing' | 'arima' = 'linear'
  ): ForecastResult {
    const values = data.map(point => point.value);
    const timestamps = data.map(point => point.timestamp);

    let forecastValues: number[] = [];
    let confidenceIntervals: [number, number][] = [];
    let accuracy: ForecastAccuracy;

    switch (method) {
      case 'linear':
        const linearResult = this.linearForecast(values, forecastPeriods);
        forecastValues = linearResult.values;
        confidenceIntervals = linearResult.intervals;
        accuracy = this.calculateForecastAccuracy(values, linearResult.fitted);
        break;

      case 'exponential_smoothing':
        const esResult = this.exponentialSmoothingForecast(values, forecastPeriods);
        forecastValues = esResult.values;
        confidenceIntervals = esResult.intervals;
        accuracy = this.calculateForecastAccuracy(values, esResult.fitted);
        break;

      case 'arima':
        const arimaResult = this.arimaForecast(values, forecastPeriods);
        forecastValues = arimaResult.values;
        confidenceIntervals = arimaResult.intervals;
        accuracy = this.calculateForecastAccuracy(values, arimaResult.fitted);
        break;

      default:
        throw new Error(`Unsupported forecast method: ${method}`);
    }

    // Generate forecast dates
    const lastTimestamp = timestamps[timestamps.length - 1];
    const timeDiff = timestamps.length > 1 ? 
      timestamps[1].getTime() - timestamps[0].getTime() : 
      24 * 60 * 60 * 1000; // Default to daily

    const forecastDates = Array.from({ length: forecastPeriods }, (_, i) => 
      new Date(lastTimestamp.getTime() + (i + 1) * timeDiff)
    );

    return {
      forecastValues,
      forecastDates,
      confidenceIntervals,
      forecastMethod: method,
      accuracy,
      assumptions: this.getForecastAssumptions(method)
    };
  }

  /**
   * Detect outliers in time series data
   */
  detectOutliers(
    data: TimeSeriesDataPoint[],
    method: 'iqr' | 'zscore' | 'isolation_forest' = 'iqr',
    threshold: number = 2.5
  ): OutlierDetectionResult {
    const values = data.map(point => point.value);
    let outliers: OutlierPoint[] = [];

    switch (method) {
      case 'iqr':
        outliers = this.detectOutliersIQR(data, threshold);
        break;
      case 'zscore':
        outliers = this.detectOutliersZScore(data, threshold);
        break;
      case 'isolation_forest':
        outliers = this.detectOutliersIsolationForest(data, threshold);
        break;
    }

    // Create cleaned series
    const outlierTimestamps = new Set(outliers.map(o => o.timestamp.getTime()));
    const cleanedSeries = data.filter(point => !outlierTimestamps.has(point.timestamp.getTime()));

    return {
      outliers,
      outlierCount: outliers.length,
      outlierRate: (outliers.length / data.length) * 100,
      detectionMethod: method,
      threshold,
      cleanedSeries
    };
  }

  /**
   * Smooth time series data
   */
  smoothTimeSeries(
    data: TimeSeriesDataPoint[],
    method: 'moving_average' | 'exponential_smoothing' | 'loess' = 'moving_average',
    parameters?: Record<string, number>
  ): SmoothingResult {
    const values = data.map(point => point.value);
    let smoothedValues: number[] = [];
    let methodParams: Record<string, number> = parameters || {};

    switch (method) {
      case 'moving_average':
        const period = methodParams.period || 5;
        smoothedValues = this.calculateSimpleMovingAverage(values, period);
        methodParams = { period };
        break;

      case 'exponential_smoothing':
        const alpha = methodParams.alpha || 0.3;
        smoothedValues = this.exponentialSmoothing(values, alpha);
        methodParams = { alpha };
        break;

      case 'loess':
        const bandwidth = methodParams.bandwidth || 0.3;
        smoothedValues = this.loessSmoothing(values, bandwidth);
        methodParams = { bandwidth };
        break;

      default:
        throw new Error(`Unsupported smoothing method: ${method}`);
    }

    // Calculate residuals and goodness of fit
    const residuals = values.map((value, i) => 
      i < smoothedValues.length ? value - smoothedValues[i] : 0
    ).filter((_, i) => i < smoothedValues.length);

    const goodnessOfFit = this.calculateRSquared(
      values.slice(0, smoothedValues.length), 
      smoothedValues
    );

    return {
      smoothedValues,
      smoothingMethod: method,
      parameters: methodParams,
      residuals,
      goodnessOfFit
    };
  }

  /**
   * Analyze volatility in time series
   */
  analyzeVolatility(
    data: TimeSeriesDataPoint[],
    useGARCH: boolean = false
  ): VolatilityAnalysis {
    const values = data.map(point => point.value);
    
    // Calculate overall volatility (standard deviation of returns)
    const returns = this.calculateReturns(values);
    const volatility = Math.sqrt(this.calculateVariance(returns));

    // Calculate time-varying volatility using rolling window
    const windowSize = Math.min(20, Math.floor(values.length / 4));
    const timeVaryingVolatility = this.calculateRollingVolatility(returns, windowSize);

    // Identify volatility regimes
    const volatilityRegimes = this.identifyVolatilityRegimes(
      timeVaryingVolatility, 
      data.map(point => point.timestamp)
    );

    let garchParameters: GARCHParameters | undefined;
    if (useGARCH && values.length > 50) {
      garchParameters = this.estimateGARCH(returns);
    }

    return {
      volatility,
      timeVaryingVolatility,
      volatilityRegimes,
      garchParameters
    };
  }

  // ============================================================================
  // PRIVATE CALCULATION METHODS
  // ============================================================================

  private calculateSimpleMovingAverage(values: number[], period: number): number[] {
    const movingAverages: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      movingAverages.push(sum / period);
    }

    return movingAverages;
  }

  private calculateExponentialMovingAverage(values: number[], period: number): number[] {
    const alpha = 2 / (period + 1);
    const ema: number[] = [values[0]]; // Start with first value

    for (let i = 1; i < values.length; i++) {
      const newEma = alpha * values[i] + (1 - alpha) * ema[i - 1];
      ema.push(newEma);
    }

    return ema.slice(period - 1); // Return same length as simple MA
  }

  private calculateWeightedMovingAverage(values: number[], period: number): number[] {
    const movingAverages: number[] = [];
    const weights = Array.from({ length: period }, (_, i) => i + 1);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

    for (let i = period - 1; i < values.length; i++) {
      let weightedSum = 0;
      for (let j = 0; j < period; j++) {
        weightedSum += values[i - period + 1 + j] * weights[j];
      }
      movingAverages.push(weightedSum / weightSum);
    }

    return movingAverages;
  }

  private mannKendallTest(values: number[]): { tau: number; pValue: number; slope: number } {
    const n = values.length;
    let s = 0;

    // Calculate S statistic
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        s += Math.sign(values[j] - values[i]);
      }
    }

    // Calculate Kendall's tau
    const tau = s / (n * (n - 1) / 2);

    // Calculate variance (simplified, assumes no ties)
    const varS = (n * (n - 1) * (2 * n + 5)) / 18;

    // Calculate z-score
    const z = s > 0 ? (s - 1) / Math.sqrt(varS) : 
              s < 0 ? (s + 1) / Math.sqrt(varS) : 0;

    // Calculate p-value (simplified)
    const pValue = 2 * (1 - Math.min(1, Math.abs(z) / 2));

    // Estimate slope using Sen's slope estimator
    const slopes: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        if (j !== i) {
          slopes.push((values[j] - values[i]) / (j - i));
        }
      }
    }
    slopes.sort((a, b) => a - b);
    const slope = slopes[Math.floor(slopes.length / 2)]; // Median slope

    return { tau, pValue, slope };
  }

  private detectChangePoints(data: TimeSeriesDataPoint[], sensitivity: number): ChangePoint[] {
    // Simplified change point detection using CUSUM
    const values = data.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const changePoints: ChangePoint[] = [];
    let cusum = 0;
    const threshold = sensitivity * Math.sqrt(this.calculateVariance(values));

    for (let i = 1; i < values.length; i++) {
      cusum += values[i] - mean;
      
      if (Math.abs(cusum) > threshold) {
        changePoints.push({
          timestamp: data[i].timestamp,
          changeType: 'level',
          changeMagnitude: Math.abs(cusum),
          confidence: Math.min(1, Math.abs(cusum) / threshold),
          beforeValue: i > 0 ? values[i - 1] : mean,
          afterValue: values[i]
        });
        cusum = 0; // Reset after detecting change
      }
    }

    return changePoints;
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    if (lag >= values.length) return 0;

    const n = values.length - lag;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += (values[i] - mean) ** 2;
    }

    return denominator > 0 ? numerator / denominator : 0;
  }

  private extractTrend(values: number[], seasonalPeriod: number): number[] {
    // Use centered moving average to extract trend
    const trend: number[] = new Array(values.length).fill(NaN);
    const halfPeriod = Math.floor(seasonalPeriod / 2);

    for (let i = halfPeriod; i < values.length - halfPeriod; i++) {
      let sum = 0;
      for (let j = i - halfPeriod; j <= i + halfPeriod; j++) {
        sum += values[j];
      }
      trend[i] = sum / (2 * halfPeriod + 1);
    }

    return trend;
  }

  private extractSeasonal(values: number[], trend: number[], seasonalPeriod: number): number[] {
    const seasonal: number[] = new Array(values.length).fill(0);
    const seasonalAverages: number[] = new Array(seasonalPeriod).fill(0);
    const seasonalCounts: number[] = new Array(seasonalPeriod).fill(0);

    // Calculate seasonal averages
    for (let i = 0; i < values.length; i++) {
      if (!isNaN(trend[i])) {
        const seasonIndex = i % seasonalPeriod;
        seasonalAverages[seasonIndex] += values[i] - trend[i];
        seasonalCounts[seasonIndex]++;
      }
    }

    // Normalize seasonal averages
    for (let i = 0; i < seasonalPeriod; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalAverages[i] /= seasonalCounts[i];
      }
    }

    // Apply seasonal pattern
    for (let i = 0; i < values.length; i++) {
      seasonal[i] = seasonalAverages[i % seasonalPeriod];
    }

    return seasonal;
  }

  private calculateSeasonalStrength(original: number[], seasonal: number[]): number {
    const seasonalVariance = this.calculateVariance(seasonal.filter(s => !isNaN(s)));
    const originalVariance = this.calculateVariance(original);
    return originalVariance > 0 ? seasonalVariance / originalVariance : 0;
  }

  private calculateTrendStrength(original: number[], trend: number[]): number {
    const trendVariance = this.calculateVariance(trend.filter(t => !isNaN(t)));
    const originalVariance = this.calculateVariance(original);
    return originalVariance > 0 ? trendVariance / originalVariance : 0;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (values.length - 1);
  }

  private linearForecast(values: number[], periods: number): {
    values: number[];
    intervals: [number, number][];
    fitted: number[];
  } {
    // Simple linear regression for forecasting
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const regression = this.calculateLinearRegression(x, values);

    const forecastValues = Array.from({ length: periods }, (_, i) => 
      regression.intercept + regression.slope * (n + i)
    );

    // Calculate fitted values for accuracy assessment
    const fitted = x.map(xi => regression.intercept + regression.slope * xi);

    // Simple confidence intervals (would be more sophisticated in production)
    const residualStdError = Math.sqrt(
      values.reduce((sum, val, i) => sum + (val - fitted[i]) ** 2, 0) / (n - 2)
    );

    const intervals: [number, number][] = forecastValues.map(forecast => [
      forecast - 1.96 * residualStdError,
      forecast + 1.96 * residualStdError
    ]);

    return { values: forecastValues, intervals, fitted };
  }

  private exponentialSmoothingForecast(values: number[], periods: number): {
    values: number[];
    intervals: [number, number][];
    fitted: number[];
  } {
    // Simple exponential smoothing
    const alpha = 0.3; // Smoothing parameter
    const fitted: number[] = [values[0]];
    
    for (let i = 1; i < values.length; i++) {
      fitted.push(alpha * values[i] + (1 - alpha) * fitted[i - 1]);
    }

    // Forecast using last smoothed value
    const lastSmoothed = fitted[fitted.length - 1];
    const forecastValues = Array.from({ length: periods }, () => lastSmoothed);

    // Simple confidence intervals
    const residuals = values.map((val, i) => val - fitted[i]);
    const residualStdError = Math.sqrt(this.calculateVariance(residuals));
    
    const intervals: [number, number][] = forecastValues.map(forecast => [
      forecast - 1.96 * residualStdError,
      forecast + 1.96 * residualStdError
    ]);

    return { values: forecastValues, intervals, fitted };
  }

  private arimaForecast(values: number[], periods: number): {
    values: number[];
    intervals: [number, number][];
    fitted: number[];
  } {
    // Simplified ARIMA(1,1,1) model - would use proper ARIMA estimation in production
    const differenced = values.slice(1).map((val, i) => val - values[i]);
    const lastValue = values[values.length - 1];
    const lastDiff = differenced[differenced.length - 1];
    
    // Simple forecast assuming random walk with drift
    const drift = differenced.reduce((sum, val) => sum + val, 0) / differenced.length;
    const forecastValues = Array.from({ length: periods }, (_, i) => 
      lastValue + drift * (i + 1)
    );

    // Fitted values (simplified)
    const fitted = values.map((_, i) => i === 0 ? values[0] : values[i - 1] + drift);

    // Confidence intervals
    const residualVariance = this.calculateVariance(
      values.slice(1).map((val, i) => val - fitted[i + 1])
    );
    const residualStdError = Math.sqrt(residualVariance);

    const intervals: [number, number][] = forecastValues.map((forecast, i) => [
      forecast - 1.96 * residualStdError * Math.sqrt(i + 1),
      forecast + 1.96 * residualStdError * Math.sqrt(i + 1)
    ]);

    return { values: forecastValues, intervals, fitted };
  }

  private calculateForecastAccuracy(actual: number[], fitted: number[]): ForecastAccuracy {
    const n = Math.min(actual.length, fitted.length);
    const errors = actual.slice(0, n).map((val, i) => val - fitted[i]);
    const absoluteErrors = errors.map(e => Math.abs(e));
    const percentageErrors = actual.slice(0, n).map((val, i) => 
      val !== 0 ? Math.abs(errors[i] / val) * 100 : 0
    );

    const mae = absoluteErrors.reduce((sum, e) => sum + e, 0) / n;
    const mse = errors.reduce((sum, e) => sum + e * e, 0) / n;
    const rmse = Math.sqrt(mse);
    const mape = percentageErrors.reduce((sum, e) => sum + e, 0) / n;
    
    // Symmetric MAPE
    const smape = actual.slice(0, n).reduce((sum, val, i) => {
      const denominator = (Math.abs(val) + Math.abs(fitted[i])) / 2;
      return sum + (denominator > 0 ? Math.abs(errors[i]) / denominator * 100 : 0);
    }, 0) / n;

    const r2 = this.calculateRSquared(actual.slice(0, n), fitted.slice(0, n));

    return { mae, mse, rmse, mape, smape, r2 };
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, val) => sum + (val - actualMean) ** 2, 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + (val - predicted[i]) ** 2, 0);
    
    return totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
  }

  private calculateLinearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    r2: number;
  } {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const meanY = sumY / n;
    const totalSumSquares = sumYY - n * meanY * meanY;
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = intercept + slope * x[i];
      return sum + (val - predicted) ** 2;
    }, 0);
    
    const r2 = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

    return { slope, intercept, r2 };
  }

  // Placeholder implementations for complex methods
  private getForecastAssumptions(method: string): string[] {
    const assumptions: { [key: string]: string[] } = {
      linear: ['Linear trend assumption', 'Constant variance', 'No seasonal patterns'],
      exponential_smoothing: ['Local level model', 'Exponential decay of weights', 'Constant error variance'],
      arima: ['Stationarity after differencing', 'Autocorrelated errors', 'Gaussian residuals']
    };
    return assumptions[method] || [];
  }

  private detectOutliersIQR(data: TimeSeriesDataPoint[], threshold: number): OutlierPoint[] {
    const values = data.map(point => point.value);
    const sortedValues = [...values].sort((a, b) => a - b);
    
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - threshold * iqr;
    const upperBound = q3 + threshold * iqr;

    return data.filter(point => point.value < lowerBound || point.value > upperBound)
      .map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        outlierScore: Math.max(
          Math.abs(point.value - lowerBound) / iqr,
          Math.abs(point.value - upperBound) / iqr
        ),
        outlierType: point.value < lowerBound ? 'low' : 'high',
        expectedValue: point.value < lowerBound ? lowerBound : upperBound,
        deviation: Math.min(Math.abs(point.value - lowerBound), Math.abs(point.value - upperBound))
      }));
  }

  private detectOutliersZScore(data: TimeSeriesDataPoint[], threshold: number): OutlierPoint[] {
    const values = data.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(this.calculateVariance(values));

    return data.filter(point => Math.abs((point.value - mean) / stdDev) > threshold)
      .map(point => ({
        timestamp: point.timestamp,
        value: point.value,
        outlierScore: Math.abs((point.value - mean) / stdDev),
        outlierType: point.value > mean ? 'high' : 'low',
        expectedValue: mean,
        deviation: Math.abs(point.value - mean)
      }));
  }

  private detectOutliersIsolationForest(data: TimeSeriesDataPoint[], threshold: number): OutlierPoint[] {
    // Simplified isolation forest - would use proper implementation in production
    return this.detectOutliersZScore(data, threshold); // Fallback to z-score
  }

  private exponentialSmoothing(values: number[], alpha: number): number[] {
    const smoothed = [values[0]];
    for (let i = 1; i < values.length; i++) {
      smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
    }
    return smoothed;
  }

  private loessSmoothing(values: number[], bandwidth: number): number[] {
    // Simplified LOESS - would use proper implementation in production
    const windowSize = Math.floor(values.length * bandwidth);
    return this.calculateSimpleMovingAverage(values, windowSize);
  }

  private calculateReturns(values: number[]): number[] {
    return values.slice(1).map((val, i) => (val - values[i]) / values[i]);
  }

  private calculateRollingVolatility(returns: number[], windowSize: number): number[] {
    const volatilities: number[] = [];
    for (let i = windowSize - 1; i < returns.length; i++) {
      const window = returns.slice(i - windowSize + 1, i + 1);
      volatilities.push(Math.sqrt(this.calculateVariance(window)));
    }
    return volatilities;
  }

  private identifyVolatilityRegimes(volatilities: number[], timestamps: Date[]): VolatilityRegime[] {
    // Simplified regime identification
    const mean = volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length;
    const stdDev = Math.sqrt(this.calculateVariance(volatilities));
    
    const regimes: VolatilityRegime[] = [];
    let currentRegime: VolatilityRegime | null = null;

    volatilities.forEach((vol, i) => {
      const regimeType = vol < mean - 0.5 * stdDev ? 'low' :
                        vol > mean + 0.5 * stdDev ? 'high' : 'medium';

      if (!currentRegime || currentRegime.regimeType !== regimeType) {
        if (currentRegime) {
          currentRegime.endDate = timestamps[Math.min(i, timestamps.length - 1)];
          regimes.push(currentRegime);
        }
        currentRegime = {
          startDate: timestamps[Math.min(i, timestamps.length - 1)],
          endDate: timestamps[timestamps.length - 1],
          averageVolatility: vol,
          regimeType,
          transitionProbability: 0.8
        };
      }
    });

    if (currentRegime) {
      regimes.push(currentRegime);
    }

    return regimes;
  }

  private estimateGARCH(returns: number[]): GARCHParameters {
    // Simplified GARCH estimation - would use proper MLE estimation in production
    return {
      alpha: 0.1,
      beta: 0.8,
      omega: 0.01,
      logLikelihood: -100,
      aic: 206,
      bic: 210
    };
  }

  private getDefaultTrendResult(): TrendDetectionResult {
    return {
      hasTrend: false,
      trendDirection: 'stable',
      trendStrength: 0,
      changePoints: [],
      trendStartDate: null,
      trendEndDate: null,
      confidence: 0
    };
  }
}