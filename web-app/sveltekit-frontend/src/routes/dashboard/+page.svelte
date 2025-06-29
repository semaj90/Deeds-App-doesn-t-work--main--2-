<script lang="ts">
  import { onMount } from 'svelte';
  export let data;
  // Use recentCases and recentCriminals from server load
  const { recentCases, recentCriminals } = data;
  
  // Hash verification stats
  let hashStats: {
    total: number;
    successful: number;
    failed: number;
    recent: any[];
  } = {
    total: 0,
    successful: 0,
    failed: 0,
    recent: []
  };
  let loadingStats = true;
  
  onMount(async () => {
    try {
      const response = await fetch('/api/evidence/hash/history?limit=5');
      if (response.ok) {
        const data = await response.json();
        hashStats = {
          total: data.stats.total,
          successful: data.stats.successful,
          failed: data.stats.failed,
          recent: data.verifications.slice(0, 5)
        };
      }
    } catch (err) {
      console.error('Error loading hash verification stats:', err);
    } finally {
      loadingStats = false;
    }
  });
</script>

<section class="dashboard container">
  <h1>Dashboard</h1>
  <div class="dashboard-sections">
    <!-- Evidence Integrity Stats -->
    <div class="dashboard-block">
      <h2>📊 Evidence Integrity</h2>
      {#if loadingStats}
        <div class="loading-spinner">Loading...</div>
      {:else}
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-value">{hashStats.total}</div>
            <div class="stat-label">Total Verifications</div>
          </div>
          <div class="stat">
            <div class="stat-value text-success">{hashStats.successful}</div>
            <div class="stat-label">Successful</div>
          </div>
          <div class="stat">
            <div class="stat-value text-warning">{hashStats.failed}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat">
            <div class="stat-value">
              {hashStats.total > 0 ? Math.round((hashStats.successful / hashStats.total) * 100) : 0}%
            </div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>
        <div class="mt-3">
          <a href="/evidence/hash" class="btn btn-sm btn-outline">View Hash Verification →</a>
        </div>
      {/if}
    </div>

    <!-- Recent Hash Verifications -->
    <div class="dashboard-block">
      <h2>🔐 Recent Verifications</h2>
      {#if loadingStats}
        <div class="loading-spinner">Loading...</div>
      {:else if hashStats.recent.length > 0}
        <ul class="verification-list">
          {#each hashStats.recent as verification}
            <li class="verification-item">
              <div class="verification-header">
                <span class="evidence-name">{verification.evidenceTitle || verification.fileName || 'Unknown'}</span>
                <span class="verification-badge" class:success={verification.result} class:failed={!verification.result}>
                  {verification.result ? '✅' : '❌'}
                </span>
              </div>
              <div class="verification-meta">
                <code class="hash-short">{verification.verifiedHash.substring(0, 8)}...</code>
                <span class="verification-time">
                  {new Date(verification.verifiedAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          {/each}
        </ul>
        <div class="mt-3">
          <a href="/api/evidence/hash/history" class="btn btn-sm btn-ghost">View All History →</a>
        </div>
      {:else}
        <p>No hash verifications yet.</p>
        <div class="mt-3">
          <a href="/evidence/hash" class="btn btn-sm btn-primary">Start Verifying →</a>
        </div>
      {/if}
    </div>

    <div class="dashboard-block">
      <h2>Recent Cases</h2>
      {#if recentCases && recentCases.length > 0}
        <ul>
          {#each recentCases as c}
            <li>
              <strong>{c.title}</strong>
              <div class="meta">{c.caseNumber} &mdash; {c.status} &mdash; {c.createdAt ? new Date(c.createdAt).toISOString().slice(0,10) : 'Unknown'}</div>
              <div class="desc">{c.description}</div>
            </li>
          {/each}
        </ul>
      {:else}
        <p>No recent cases found.</p>
      {/if}
    </div>
    <div class="dashboard-block">
      <h2>Recent Persons of Interest</h2>
      {#if recentCriminals && recentCriminals.length > 0}
        <ul>
          {#each recentCriminals as p}
            <li>
              <strong>{p.firstName} {p.lastName}</strong>
              <div class="meta">{p.status} &mdash; {p.createdAt ? new Date(p.createdAt).toISOString().slice(0,10) : 'Unknown'}</div>
              <div class="desc">{Array.isArray(p.aliases) ? p.aliases.join(', ') : ''}</div>
            </li>
          {/each}
        </ul>
      {:else}
        <p>No recent persons of interest found.</p>
      {/if}
    </div>
  </div>
</section>

<style>
.dashboard.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
}
.dashboard-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}
.dashboard-block {
  background: var(--pico-background, #fff);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1.5rem;
  min-width: 300px;
}
.dashboard-block h2 {
  margin-top: 0;
}
.meta {
  color: #888;
  font-size: 0.95em;
  margin-bottom: 0.5em;
}
.desc {
  color: #444;
  font-size: 1em;
}

/* Stats grid for evidence integrity */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}
.stat {
  text-align: center;
  padding: 1rem;
  background: rgba(0,0,0,0.02);
  border-radius: 0.5rem;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}
.stat-label {
  font-size: 0.8rem;
  opacity: 0.7;
}
.text-success {
  color: #10b981;
}
.text-warning {
  color: #f59e0b;
}

/* Verification list */
.verification-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.verification-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.verification-item:last-child {
  border-bottom: none;
}
.verification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}
.evidence-name {
  font-weight: 500;
  font-size: 0.9rem;
}
.verification-badge.success {
  color: #10b981;
}
.verification-badge.failed {
  color: #ef4444;
}
.verification-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.7;
}
.hash-short {
  font-family: monospace;
  background: rgba(0,0,0,0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}
.btn-outline {
  border: 1px solid #d1d5db;
  color: #374151;
  background: transparent;
}
.btn-outline:hover {
  background: #f9fafb;
}
.btn-ghost {
  color: #6b7280;
  background: transparent;
}
.btn-ghost:hover {
  background: rgba(0,0,0,0.05);
}
.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-primary:hover {
  background: #2563eb;
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
  opacity: 0.6;
}

.mt-3 {
  margin-top: 0.75rem;
}
</style>
