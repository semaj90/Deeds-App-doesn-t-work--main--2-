<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { enhance } from '$app/forms';
    import type { PageData } from './$types';

    export let data: PageData;

    // Helper function to format date
    function formatDate(date: string | Date) {
        return new Date(date).toLocaleDateString();
    }

    // Helper function to get status badge color
    function getStatusColor(status: string) {
        switch(status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'investigating': return 'bg-blue-100 text-blue-800';
            case 'trial': return 'bg-orange-100 text-orange-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Helper function to get threat level color
    function getThreatColor(threat: string) {
        switch(threat) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-red-100 text-red-800';
            case 'extreme': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
</script>

<svelte:head>
    <title>Dashboard - Legal Case Management</title>
</svelte:head>

<div class="dashboard-container">
    <!-- Header -->
    <div class="dashboard-header">
        <div class="header-content">
            <div class="header-text">
                <h1>Dashboard</h1>
                <p>Welcome back, {data.user?.name || data.user?.email || 'User'}</p>
            </div>
            <div class="header-actions">
                <a href="/cases/new" class="btn btn-primary">
                    <span class="icon">📋</span>
                    New Case
                </a>
                <a href="/criminals" class="btn btn-secondary">
                    <span class="icon">👤</span>
                    View Criminals
                </a>
            </div>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="search-section">
        <form method="POST" action="?/search" use:enhance class="search-form">
            <input 
                type="text" 
                name="search" 
                placeholder="Search cases and criminals..." 
                value={data.searchTerm || ''}
                class="search-input"
            />
            <button type="submit" class="search-btn">
                <span class="icon">🔍</span>
                Search
            </button>
        </form>
    </div>

    <!-- Dashboard Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value">{data.dashboardStats.totalCases}</div>
            <div class="stat-label">Total Cases</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.dashboardStats.openCases}</div>
            <div class="stat-label">Open Cases</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.dashboardStats.totalCriminals}</div>
            <div class="stat-label">Total Criminals</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">{data.dashboardStats.activeCriminals}</div>
            <div class="stat-label">High Threat</div>
        </div>
    </div>

    <!-- Search Results -->
    {#if data.searchTerm}
        <div class="search-results">
            <h2>Search Results for "{data.searchTerm}"</h2>
            
            {#if data.searchResults.cases.length > 0 || data.searchResults.criminals.length > 0}
                <div class="results-grid">
                    <!-- Case Results -->
                    {#if data.searchResults.cases.length > 0}
                        <div class="results-section">
                            <h3>Cases ({data.searchResults.cases.length})</h3>
                            <div class="case-list">
                                {#each data.searchResults.cases as case_}
                                    <div class="case-card">
                                        <div class="case-header">
                                            <span class="case-number">{case_.caseNumber}</span>
                                            <span class="status-badge {getStatusColor(case_.status)}">{case_.status}</span>
                                        </div>
                                        <h4><a href="/cases/{case_.id}">{case_.title}</a></h4>
                                        <p class="case-description">{case_.description}</p>
                                        <div class="case-meta">
                                            <span>Created: {formatDate(case_.createdAt)}</span>
                                            <span>Priority: {case_.priority}</span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Criminal Results -->
                    {#if data.searchResults.criminals.length > 0}
                        <div class="results-section">
                            <h3>Criminals ({data.searchResults.criminals.length})</h3>
                            <div class="criminal-list">
                                {#each data.searchResults.criminals as criminal}
                                    <div class="criminal-card">
                                        <div class="criminal-header">
                                            <span class="threat-badge {getThreatColor(criminal.threatLevel)}">{criminal.threatLevel}</span>
                                        </div>
                                        <h4><a href="/criminals/{criminal.id}">{criminal.firstName} {criminal.lastName}</a></h4>
                                        {#if criminal.aliases && criminal.aliases.length > 0}
                                            <p class="aliases">Aliases: {criminal.aliases.join(', ')}</p>
                                        {/if}
                                        <div class="criminal-meta">
                                            <span>Status: {criminal.status}</span>
                                            <span>Added: {formatDate(criminal.createdAt)}</span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <p class="no-results">No results found for "{data.searchTerm}"</p>
            {/if}
        </div>
    {/if}

    <!-- Main Content Grid -->
    <div class="main-grid">
        <!-- Recent Cases -->
        <div class="section">
            <div class="section-header">
                <h2>Recent Cases</h2>
                <a href="/cases" class="view-all-link">View All</a>
            </div>
            {#if data.recentCases?.length}
                <div class="case-list">
                    {#each data.recentCases as case_}
                        <div class="case-card">
                            <div class="case-header">
                                <span class="case-number">{case_.caseNumber}</span>
                                <span class="status-badge {getStatusColor(case_.status)}">{case_.status}</span>
                            </div>
                            <h4><a href="/cases/{case_.id}">{case_.title}</a></h4>
                            <p class="case-description">{case_.description}</p>
                            <div class="case-meta">
                                <span>Created: {formatDate(case_.createdAt)}</span>
                                <span>Priority: {case_.priority}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-state">No recent cases.</p>
            {/if}
        </div>

        <!-- High Priority Cases -->
        <div class="section">
            <div class="section-header">
                <h2>High Priority Cases</h2>
                <a href="/cases?priority=high" class="view-all-link">View All</a>
            </div>
            {#if data.highPriorityCases?.length}
                <div class="case-list">
                    {#each data.highPriorityCases as case_}
                        <div class="case-card priority-high">
                            <div class="case-header">
                                <span class="case-number">{case_.caseNumber}</span>
                                <span class="priority-badge">🔥 HIGH</span>
                            </div>
                            <h4><a href="/cases/{case_.id}">{case_.title}</a></h4>
                            <p class="case-description">{case_.description}</p>
                            <div class="case-meta">
                                <span>Created: {formatDate(case_.createdAt)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-state">No high priority cases.</p>
            {/if}
        </div>

        <!-- Recent Criminals -->
        <div class="section">
            <div class="section-header">
                <h2>Recent Criminals</h2>
                <a href="/criminals" class="view-all-link">View All</a>
            </div>
            {#if data.recentCriminals?.length}
                <div class="criminal-list">
                    {#each data.recentCriminals as criminal}
                        <div class="criminal-card">
                            <div class="criminal-header">
                                <span class="threat-badge {getThreatColor(criminal.threatLevel)}">{criminal.threatLevel}</span>
                            </div>
                            <h4><a href="/criminals/{criminal.id}">{criminal.firstName} {criminal.lastName}</a></h4>
                            {#if criminal.aliases && criminal.aliases.length > 0}
                                <p class="aliases">Aliases: {criminal.aliases.join(', ')}</p>
                            {/if}
                            <div class="criminal-meta">
                                <span>Status: {criminal.status}</span>
                                <span>Added: {formatDate(criminal.createdAt)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-state">No recent criminals.</p>
            {/if}
        </div>

        <!-- High Threat Criminals -->
        <div class="section">
            <div class="section-header">
                <h2>High Threat Criminals</h2>
                <a href="/criminals?threat=high" class="view-all-link">View All</a>
            </div>
            {#if data.highThreatCriminals?.length}
                <div class="criminal-list">
                    {#each data.highThreatCriminals as criminal}
                        <div class="criminal-card threat-high">
                            <div class="criminal-header">
                                <span class="threat-badge high">⚠️ HIGH THREAT</span>
                            </div>
                            <h4><a href="/criminals/{criminal.id}">{criminal.firstName} {criminal.lastName}</a></h4>
                            {#if criminal.aliases && criminal.aliases.length > 0}
                                <p class="aliases">Aliases: {criminal.aliases.join(', ')}</p>
                            {/if}
                            <div class="criminal-meta">
                                <span>Status: {criminal.status}</span>
                                <span>Added: {formatDate(criminal.createdAt)}</span>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="empty-state">No high threat criminals.</p>
            {/if}
        </div>
    </div>

    <!-- Error Display -->
    {#if data.error}
        <div class="error-banner">
            <span class="icon">⚠️</span>
            {data.error}
        </div>
    {/if}
</div>

<style>
    /* Dashboard Container */
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: #f8fafc;
        min-height: 100vh;
    }

    /* Header */
    .dashboard-header {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
    }

    .header-text h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
    }

    .header-text p {
        color: #6b7280;
        margin: 4px 0 0 0;
        font-size: 1.1rem;
    }

    .header-actions {
        display: flex;
        gap: 12px;
    }

    /* Search Section */
    .search-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .search-form {
        display: flex;
        gap: 12px;
        max-width: 600px;
    }

    .search-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 16px;
        transition: border-color 0.2s;
    }

    .search-input:focus {
        outline: none;
        border-color: #3b82f6;
    }

    .search-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background-color 0.2s;
    }

    .search-btn:hover {
        background: #2563eb;
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 32px;
    }

    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border-left: 4px solid #3b82f6;
    }

    .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
    }

    .stat-label {
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.875rem;
        letter-spacing: 0.5px;
    }

    /* Search Results */
    .search-results {
        background: white;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 32px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border-left: 4px solid #10b981;
    }

    .search-results h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 20px;
    }

    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 24px;
    }

    .results-section h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
    }

    .no-results {
        color: #6b7280;
        font-style: italic;
        text-align: center;
        padding: 20px;
    }

    /* Main Grid */
    .main-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 24px;
    }

    /* Section */
    .section {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 2px solid #f3f4f6;
    }

    .section-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }

    .view-all-link {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;
    }

    .view-all-link:hover {
        color: #2563eb;
        text-decoration: underline;
    }

    /* Case and Criminal Lists */
    .case-list, .criminal-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* Case Cards */
    .case-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.2s;
        background: #fafafa;
    }

    .case-card:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    .case-card.priority-high {
        border-left: 4px solid #ef4444;
        background: #fef2f2;
    }

    .case-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .case-number {
        font-family: monospace;
        font-weight: 600;
        color: #374151;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.875rem;
    }

    .case-card h4 {
        margin: 0 0 8px 0;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .case-card h4 a {
        color: #1f2937;
        text-decoration: none;
    }

    .case-card h4 a:hover {
        color: #3b82f6;
        text-decoration: underline;
    }

    .case-description {
        color: #6b7280;
        font-size: 0.925rem;
        line-height: 1.5;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .case-meta {
        display: flex;
        gap: 16px;
        font-size: 0.875rem;
        color: #6b7280;
    }

    /* Criminal Cards */
    .criminal-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        transition: all 0.2s;
        background: #fafafa;
    }

    .criminal-card:hover {
        border-color: #10b981;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
    }

    .criminal-card.threat-high {
        border-left: 4px solid #ef4444;
        background: #fef2f2;
    }

    .criminal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .criminal-card h4 {
        margin: 0 0 8px 0;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .criminal-card h4 a {
        color: #1f2937;
        text-decoration: none;
    }

    .criminal-card h4 a:hover {
        color: #10b981;
        text-decoration: underline;
    }

    .aliases {
        color: #6b7280;
        font-size: 0.925rem;
        margin-bottom: 12px;
        font-style: italic;
    }

    .criminal-meta {
        display: flex;
        gap: 16px;
        font-size: 0.875rem;
        color: #6b7280;
    }

    /* Badges */
    .status-badge, .threat-badge, .priority-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .priority-badge {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    .threat-badge.high {
        background: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    /* Buttons */
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.925rem;
        transition: all 0.2s;
        border: none;
        cursor: pointer;
    }

    .btn-primary {
        background: #3b82f6;
        color: white;
    }

    .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
    }

    .btn-secondary {
        background: #10b981;
        color: white;
    }

    .btn-secondary:hover {
        background: #059669;
        transform: translateY(-1px);
    }

    /* Icons */
    .icon {
        font-size: 1.1em;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        color: #6b7280;
        font-style: italic;
        padding: 40px 20px;
        background: #f9fafb;
        border-radius: 8px;
        border: 2px dashed #d1d5db;
    }

    /* Error Banner */
    .error-banner {
        background: #fef2f2;
        color: #dc2626;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        margin-top: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .dashboard-container {
            padding: 12px;
        }

        .header-content {
            flex-direction: column;
            align-items: stretch;
        }

        .header-actions {
            justify-content: center;
        }

        .main-grid {
            grid-template-columns: 1fr;
        }

        .results-grid {
            grid-template-columns: 1fr;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .search-form {
            flex-direction: column;
        }

        .case-meta, .criminal-meta {
            flex-direction: column;
            gap: 4px;
        }
    }

    @media (max-width: 480px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }

        .header-text h1 {
            font-size: 2rem;
        }

        .section, .dashboard-header, .search-section {
            padding: 16px;
        }
    }
</style>