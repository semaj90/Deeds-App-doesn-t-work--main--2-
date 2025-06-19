<script lang="ts">
    import Header from '$lib/components/+Header.svelte';
    import Sidebar from '$lib/components/+Sidebar.svelte';
    import DropZone from '$lib/components/DropZone.svelte';
    import type { PageData } from './$types';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';
    import { dragDropManager, type DragDropZone, type DragDropItem } from '$lib/stores/dragDrop';

    export let data: PageData;
    let user = data.user;
    let criminals = data.criminals || [];
    let cases = data.cases || [];
    
    // Dashboard statistics
    let stats = {
        totalCases: cases.length,
        activeCases: cases.filter(c => c.status === 'open' || c.status === 'investigation').length,
        criticalCases: cases.filter(c => (c.dangerScore || 0) >= 8).length,
        completedCases: cases.filter(c => c.status === 'closed').length,
        totalCriminals: criminals.length,
        highThreatCriminals: criminals.filter(c => c.threatLevel === 'high').length
    };

    // Real-time updates
    let updateInterval: NodeJS.Timeout;
    let lastUpdate = new Date();

    // Drag and drop zones for dashboard organization
    let dashboardZones: DragDropZone[] = [
        {
            id: 'priority-cases',
            title: '🔥 Priority Cases',
            accepts: ['case'],
            items: [],
            maxItems: 5,
            className: 'border-error/30'
        },
        {
            id: 'active-investigations',
            title: '🔍 Active Investigations',
            accepts: ['case', 'evidence'],
            items: [],
            className: 'border-warning/30'
        },
        {
            id: 'watch-list',
            title: '👁️ Watch List',
            accepts: ['criminal'],
            items: [],
            maxItems: 10,
            className: 'border-info/30'
        },
        {
            id: 'recent-evidence',
            title: '📁 Recent Evidence',
            accepts: ['evidence'],
            items: [],
            maxItems: 8,
            className: 'border-success/30'
        }
    ];

    // Chart data for analytics
    let caseStatusChart = {
        open: cases.filter(c => c.status === 'open').length,
        investigation: cases.filter(c => c.status === 'investigation').length,
        pending: cases.filter(c => c.status === 'pending').length,
        trial: cases.filter(c => c.status === 'trial').length,
        closed: cases.filter(c => c.status === 'closed').length,
        archived: cases.filter(c => c.status === 'archived').length
    };

    let dangerScoreDistribution = {
        low: cases.filter(c => (c.dangerScore || 0) <= 3).length,
        medium: cases.filter(c => (c.dangerScore || 0) > 3 && (c.dangerScore || 0) <= 7).length,
        high: cases.filter(c => (c.dangerScore || 0) > 7).length
    };

    onMount(() => {
        // Initialize drag and drop zones
        dashboardZones.forEach(zone => {
            dragDropManager.createZone(zone);
        });

        // Populate initial items
        populateInitialItems();

        // Set up real-time updates (every 30 seconds)
        updateInterval = setInterval(async () => {
            await refreshDashboardData();
        }, 30000);
    });

    onDestroy(() => {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });

    function populateInitialItems() {
        // Populate priority cases (high danger score or critical status)
        const priorityCases = cases
            .filter(c => (c.dangerScore || 0) >= 7 || c.status === 'trial')
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                type: 'case' as const,
                title: c.title,
                description: c.description || '',
                status: c.status,
                metadata: {
                    dangerScore: c.dangerScore,
                    createdAt: new Date(c.createdAt).toLocaleDateString()
                }
            }));

        // Populate active investigations
        const activeInvestigations = cases
            .filter(c => c.status === 'investigation' || c.status === 'open')
            .slice(0, 6)
            .map(c => ({
                id: c.id,
                type: 'case' as const,
                title: c.title,
                description: c.description || '',
                status: c.status,
                metadata: {
                    dangerScore: c.dangerScore,
                    createdAt: new Date(c.createdAt).toLocaleDateString()
                }
            }));

        // Populate watch list (high threat criminals)
        const watchListItems = criminals
            .filter(c => c.threatLevel === 'high')
            .slice(0, 8)
            .map(c => ({
                id: c.id,
                type: 'criminal' as const,
                title: `${c.firstName} ${c.lastName}`,
                description: c.aliases?.join(', ') || 'No aliases',
                status: c.threatLevel,
                metadata: {
                    threatLevel: c.threatLevel,
                    lastKnownAddress: c.address || 'Unknown'
                }
            }));

        // Update zones with initial items
        dragDropManager.updateZone('priority-cases', { items: priorityCases });
        dragDropManager.updateZone('active-investigations', { items: activeInvestigations });
        dragDropManager.updateZone('watch-list', { items: watchListItems });
    }

    async function refreshDashboardData() {
        try {
            // In a real app, this would fetch from API endpoints
            // For now, simulate data refresh
            lastUpdate = new Date();
            
            // Update statistics
            stats = {
                totalCases: cases.length,
                activeCases: cases.filter(c => c.status === 'open' || c.status === 'investigation').length,
                criticalCases: cases.filter(c => (c.dangerScore || 0) >= 8).length,
                completedCases: cases.filter(c => c.status === 'closed').length,
                totalCriminals: criminals.length,
                highThreatCriminals: criminals.filter(c => c.threatLevel === 'high').length
            };
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    }

    function handleZoneItemAdded(event: CustomEvent) {
        console.log('Item added to zone:', event.detail);
    }

    function handleZoneItemRemoved(event: CustomEvent) {
        console.log('Item removed from zone:', event.detail);
    }

    function handleViewItem(event: CustomEvent) {
        const { item } = event.detail;
        if (item.type === 'case') {
            goto(`/cases/${item.id}`);
        } else if (item.type === 'criminal') {
            goto(`/criminals/${item.id}`);
        }
    }

    function getStatColor(value: number, threshold: { warning: number; critical: number }) {
        if (value >= threshold.critical) return 'text-error';
        if (value >= threshold.warning) return 'text-warning';
        return 'text-success';
    }
</script>

<svelte:head>
    <title>WardenNet - Home</title>
</svelte:head>

{#if !user}
    <section class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-base-200">
        <div class="max-w-2xl text-center p-8 bg-base-100 rounded-xl shadow-lg">
            <h1 class="text-4xl font-bold text-primary mb-4">Welcome to WardenNet</h1>
            <p class="text-lg text-base-content/80 mb-6">
                Modern case management for prosecutors. Track cases, manage evidence, and collaborate securely.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/login" class="btn btn-primary btn-lg">Sign In</a>
                <a href="/register" class="btn btn-outline-primary btn-lg">Register</a>
            </div>
        </div>
    </section>
{:else}
    <div class="flex">
        <Sidebar />
        <div class="flex-1 flex flex-col">
            <Header {user} />
            <main class="p-6 flex-1 bg-base-200">
                <!-- Dashboard Header -->
                <div class="mb-8">
                    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 class="text-3xl font-bold text-primary mb-2">Dashboard</h1>
                            <p class="text-base-content/70">Welcome back, {user.name}! Here's your case overview.</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-sm text-base-content/60">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </div>
                            <button class="btn btn-primary btn-sm" on:click={refreshDashboardData}>
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stat bg-base-100 rounded-lg shadow-sm">
                        <div class="stat-figure text-primary">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div class="stat-title">Total Cases</div>
                        <div class="stat-value text-primary">{stats.totalCases}</div>
                        <div class="stat-desc">
                            <span class="{getStatColor(stats.activeCases, { warning: 5, critical: 10 })}">
                                {stats.activeCases} active
                            </span>
                        </div>
                    </div>

                    <div class="stat bg-base-100 rounded-lg shadow-sm">
                        <div class="stat-figure text-warning">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div class="stat-title">Critical Cases</div>
                        <div class="stat-value text-warning">{stats.criticalCases}</div>
                        <div class="stat-desc">Danger score ≥ 8</div>
                    </div>

                    <div class="stat bg-base-100 rounded-lg shadow-sm">
                        <div class="stat-figure text-info">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div class="stat-title">Total Criminals</div>
                        <div class="stat-value text-info">{stats.totalCriminals}</div>
                        <div class="stat-desc">
                            <span class="{getStatColor(stats.highThreatCriminals, { warning: 3, critical: 8 })}">
                                {stats.highThreatCriminals} high threat
                            </span>
                        </div>
                    </div>

                    <div class="stat bg-base-100 rounded-lg shadow-sm">
                        <div class="stat-figure text-success">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="stat-title">Completed</div>
                        <div class="stat-value text-success">{stats.completedCases}</div>
                        <div class="stat-desc">Cases closed</div>
                    </div>
                </div>

                <!-- Analytics Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <!-- Case Status Distribution -->
                    <div class="card bg-base-100 shadow-sm">
                        <div class="card-body">
                            <h2 class="card-title">Case Status Distribution</h2>
                            <div class="space-y-3">
                                {#each Object.entries(caseStatusChart) as [status, count]}
                                    <div class="flex items-center justify-between">
                                        <span class="capitalize">{status.replace('_', ' ')}</span>
                                        <div class="flex items-center gap-2">
                                            <div class="w-24 bg-base-200 rounded-full h-2">
                                                <div 
                                                    class="h-2 rounded-full bg-{
                                                        status === 'open' ? 'success' :
                                                        status === 'investigation' ? 'warning' :
                                                        status === 'trial' ? 'error' :
                                                        status === 'closed' ? 'primary' :
                                                        'neutral'
                                                    }"
                                                    style="width: {stats.totalCases > 0 ? (count / stats.totalCases) * 100 : 0}%"
                                                ></div>
                                            </div>
                                            <span class="badge badge-sm">{count}</span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>

                    <!-- Danger Score Distribution -->
                    <div class="card bg-base-100 shadow-sm">
                        <div class="card-body">
                            <h2 class="card-title">Risk Assessment</h2>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <span class="text-success">Low Risk (0-3)</span>
                                    <div class="flex items-center gap-2">
                                        <div class="w-24 bg-base-200 rounded-full h-2">
                                            <div 
                                                class="h-2 rounded-full bg-success"
                                                style="width: {stats.totalCases > 0 ? (dangerScoreDistribution.low / stats.totalCases) * 100 : 0}%"
                                            ></div>
                                        </div>
                                        <span class="badge badge-sm badge-success">{dangerScoreDistribution.low}</span>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-warning">Medium Risk (4-7)</span>
                                    <div class="flex items-center gap-2">
                                        <div class="w-24 bg-base-200 rounded-full h-2">
                                            <div 
                                                class="h-2 rounded-full bg-warning"
                                                style="width: {stats.totalCases > 0 ? (dangerScoreDistribution.medium / stats.totalCases) * 100 : 0}%"
                                            ></div>
                                        </div>
                                        <span class="badge badge-sm badge-warning">{dangerScoreDistribution.medium}</span>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-error">High Risk (8-10)</span>
                                    <div class="flex items-center gap-2">
                                        <div class="w-24 bg-base-200 rounded-full h-2">
                                            <div 
                                                class="h-2 rounded-full bg-error"
                                                style="width: {stats.totalCases > 0 ? (dangerScoreDistribution.high / stats.totalCases) * 100 : 0}%"
                                            ></div>
                                        </div>
                                        <span class="badge badge-sm badge-error">{dangerScoreDistribution.high}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Interactive Drag and Drop Zones -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {#each dashboardZones as zone (zone.id)}
                        <DropZone 
                            {zone}
                            on:itemAdded={handleZoneItemAdded}
                            on:itemRemoved={handleZoneItemRemoved}
                            on:viewItem={handleViewItem}
                            className={zone.className}
                        />
                    {/each}
                </div>

                <!-- Quick Actions -->
                <div class="card bg-base-100 shadow-sm mt-8">
                    <div class="card-body">
                        <h2 class="card-title mb-4">Quick Actions</h2>
                        <div class="flex flex-wrap gap-4">
                            <a href="/cases/new" class="btn btn-primary">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                New Case
                            </a>
                            <a href="/criminals" class="btn btn-outline">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                View Criminals
                            </a>
                            <a href="/evidence" class="btn btn-outline">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Manage Evidence
                            </a>
                            <button class="btn btn-outline" on:click={() => goto('/reports')}>
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
{/if}
