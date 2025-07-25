<!--
  Advanced Performance Dashboard
  Real-time monitoring and analytics
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  interface PerformanceMetrics {
    totalRequests: number;
    averageResponseTime: number;
    slowestEndpoints: { endpoint: string; avgTime: number; requests: number }[];
    errorRate: number;
    peakHours: { hour: number; requests: number }[];
  }

  interface SystemHealth {
    cpu: number;
    memory: number;
    database: 'healthy' | 'warning' | 'error';
    storage: number;
  }

  const metrics = writable<PerformanceMetrics | null>(null);
  const health = writable<SystemHealth | null>(null);
  const logs = writable<any[]>([]);
  
  let refreshInterval: NodeJS.Timeout;
  let autoRefresh = true;

  onMount(() => {
    loadMetrics();
    if (autoRefresh) {
      refreshInterval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  });

  async function loadMetrics() {
    try {
      // Load performance metrics
      const metricsResponse = await fetch('/api/admin/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        metrics.set(metricsData.data);
      }

      // Load system health
      const healthResponse = await fetch('/api/admin/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        health.set(healthData.data);
      }

      // Load recent logs
      const logsResponse = await fetch('/api/admin/logs?limit=50');
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        logs.set(logsData.data);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    if (autoRefresh) {
      refreshInterval = setInterval(loadMetrics, 30000);
    } else {
      clearInterval(refreshInterval);
    }
  }

  function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  function getHealthColor(status: string): string {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  function formatHour(hour: number): string {
    return hour === 0 ? '12 AM' : 
           hour === 12 ? '12 PM' :
           hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  }
</script>

<svelte:head>
  <title>Performance Dashboard - Legal Case Management</title>
</svelte:head>

<div class="performance-dashboard">
  <div class="dashboard-header">
    <h1>Performance Dashboard</h1>
    <div class="controls">
      <button 
        class="btn {autoRefresh ? 'btn-primary' : 'btn-secondary'}"
        on:click={toggleAutoRefresh}
      >
        {autoRefresh ? '🔄 Auto Refresh On' : '⏸️ Auto Refresh Off'}
      </button>
      <button class="btn btn-secondary" on:click={loadMetrics}>
        🔄 Refresh Now
      </button>
    </div>
  </div>

  <!-- System Health Cards -->
  {#if $health}
    <div class="health-grid">
      <div class="health-card">
        <h3>Database</h3>
        <div class="health-status {getHealthColor($health.database)}">
          {$health.database}
        </div>
      </div>
      
      <div class="health-card">
        <h3>CPU Usage</h3>
        <div class="metric-value">{$health.cpu}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {$health.cpu}%"></div>
        </div>
      </div>
      
      <div class="health-card">
        <h3>Memory Usage</h3>
        <div class="metric-value">{$health.memory}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {$health.memory}%"></div>
        </div>
      </div>
      
      <div class="health-card">
        <h3>Storage</h3>
        <div class="metric-value">{$health.storage}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {$health.storage}%"></div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Performance Metrics -->
  {#if $metrics}
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Total Requests</h3>
        <div class="metric-value large">{$metrics.totalRequests.toLocaleString()}</div>
      </div>
      
      <div class="metric-card">
        <h3>Average Response Time</h3>
        <div class="metric-value large">{formatTime($metrics.averageResponseTime)}</div>
      </div>
      
      <div class="metric-card">
        <h3>Error Rate</h3>
        <div class="metric-value large {$metrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}">
          {($metrics.errorRate * 100).toFixed(2)}%
        </div>
      </div>
    </div>

    <!-- Slowest Endpoints -->
    <div class="chart-section">
      <h2>Slowest Endpoints</h2>
      <div class="endpoints-list">
        {#each $metrics.slowestEndpoints as endpoint}
          <div class="endpoint-item">
            <div class="endpoint-path">{endpoint.endpoint}</div>
            <div class="endpoint-stats">
              <span class="response-time">{formatTime(endpoint.avgTime)}</span>
              <span class="request-count">{endpoint.requests} requests</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Peak Hours Chart -->
    <div class="chart-section">
      <h2>Peak Hours</h2>
      <div class="peak-hours-chart">
        {#each $metrics.peakHours as peak}
          <div class="peak-hour-bar">
            <div class="bar-fill" style="height: {(peak.requests / Math.max(...$metrics.peakHours.map(p => p.requests))) * 100}%"></div>
            <div class="bar-label">{formatHour(peak.hour)}</div>
            <div class="bar-count">{peak.requests}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Recent Logs -->
  <div class="logs-section">
    <h2>Recent System Logs</h2>
    <div class="logs-container">
      {#each $logs as log}
        <div class="log-entry {log.level}">
          <div class="log-timestamp">{new Date(log.timestamp).toLocaleString()}</div>
          <div class="log-level">{log.level.toUpperCase()}</div>
          <div class="log-message">{log.message}</div>
          {#if log.metadata}
            <div class="log-metadata">
              {JSON.stringify(log.metadata, null, 2)}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .performance-dashboard {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .dashboard-header h1 {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary-color);
  }

  .controls {
    display: flex;
    gap: 1rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
  }

  .btn-secondary {
    background: var(--secondary-color);
    color: var(--text-color);
  }

  .health-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .health-card {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
  }

  .health-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: var(--text-secondary);
  }

  .health-status {
    font-size: 1.25rem;
    font-weight: bold;
    text-transform: capitalize;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .metric-card {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
    text-align: center;
  }

  .metric-card h3 {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary-color);
  }

  .metric-value.large {
    font-size: 2rem;
  }

  .progress-bar {
    width: 100%;
    height: 0.5rem;
    background: var(--border-color);
    border-radius: 0.25rem;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: var(--primary-color);
    transition: width 0.3s ease;
  }

  .chart-section {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
    margin-bottom: 2rem;
  }

  .chart-section h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: var(--text-color);
  }

  .endpoints-list {
    space-y: 0.5rem;
  }

  .endpoint-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--background-light);
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
  }

  .endpoint-path {
    font-family: monospace;
    font-weight: 500;
  }

  .endpoint-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .peak-hours-chart {
    display: flex;
    align-items: end;
    gap: 0.5rem;
    height: 200px;
    padding: 1rem 0;
  }

  .peak-hour-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar-fill {
    width: 100%;
    background: var(--primary-color);
    border-radius: 0.25rem 0.25rem 0 0;
    min-height: 2px;
  }

  .bar-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    writing-mode: vertical-rl;
    text-orientation: mixed;
  }

  .bar-count {
    font-size: 0.75rem;
    font-weight: 500;
    margin-top: 0.25rem;
  }

  .logs-section {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
  }

  .logs-section h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: var(--text-color);
  }

  .logs-container {
    max-height: 400px;
    overflow-y: auto;
  }

  .log-entry {
    padding: 0.75rem;
    border-left: 4px solid var(--border-color);
    margin-bottom: 0.5rem;
    background: var(--background-light);
    border-radius: 0 0.375rem 0.375rem 0;
  }

  .log-entry.error {
    border-left-color: #ef4444;
    background: #fef2f2;
  }

  .log-entry.warn {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  .log-entry.info {
    border-left-color: #3b82f6;
    background: #eff6ff;
  }

  .log-timestamp {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  .log-level {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: bold;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background: var(--text-secondary);
    color: white;
    margin-bottom: 0.5rem;
  }

  .log-message {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .log-metadata {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--text-secondary);
    background: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    white-space: pre-wrap;
    max-height: 100px;
    overflow-y: auto;
  }

  .text-green-600 { color: #059669; }
  .text-yellow-600 { color: #d97706; }
  .text-red-600 { color: #dc2626; }
  .text-gray-600 { color: #6b7280; }
</style>
