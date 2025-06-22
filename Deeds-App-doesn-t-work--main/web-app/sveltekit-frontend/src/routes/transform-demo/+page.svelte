<!--
	Transform Sync Demo Page
	Demonstrates the advanced transform sync module with matrix operations, 
	undo/redo, and real-time canvas synchronization.
-->

<script lang="ts">
	import TransformSyncDemo from '$lib/components/TransformSyncDemo.svelte';
	import { page } from '$app/stores';
	
	let showDocumentation = false;
</script>

<svelte:head>
	<title>Transform Sync Demo - Advanced Canvas Operations</title>
	<meta name="description" content="Interactive demo of the transform sync module with Fabric.js, MathJS, and Svelte stores" />
</svelte:head>

<div class="page-container">
	<nav class="breadcrumb">
		<a href="/">Home</a>
		<span class="separator">›</span>
		<span class="current">Transform Sync Demo</span>
	</nav>

	<header class="page-header">
		<div class="header-content">
			<h1>Transform Sync Demo</h1>
			<p class="description">
				Advanced canvas operations with synchronized transforms, matrix math, undo/redo, and intelligent caching.
			</p>
			<button 
				class="toggle-docs" 
				on:click={() => showDocumentation = !showDocumentation}
			>
				{showDocumentation ? 'Hide' : 'Show'} Documentation
			</button>
		</div>
	</header>

	{#if showDocumentation}
		<section class="documentation">
			<div class="doc-content">
				<h2>Transform Sync System Features</h2>
				
				<div class="feature-grid">
					<div class="feature-card">
						<h3>🔄 Matrix Operations</h3>
						<p>Precise transformations using MathJS matrix algebra with support for translation, rotation, scaling, and composite transforms.</p>
						<ul>
							<li>3x3 transformation matrices</li>
							<li>Matrix multiplication and inversion</li>
							<li>Point transformation utilities</li>
							<li>Fabric.js integration</li>
						</ul>
					</div>

					<div class="feature-card">
						<h3>↶ Undo/Redo System</h3>
						<p>Intelligent state management with configurable stack limits and JSON serialization for reliable operation rollback.</p>
						<ul>
							<li>50-operation history limit</li>
							<li>Deep state cloning</li>
							<li>Keyboard shortcuts (Ctrl+Z/Y)</li>
							<li>Memory-efficient caching</li>
						</ul>
					</div>

					<div class="feature-card">
						<h3>💾 Smart Caching</h3>
						<p>Automatic state caching with size management, LRU eviction, and performance optimization for large canvases.</p>
						<ul>
							<li>10MB cache size limit</li>
							<li>Timestamp-based eviction</li>
							<li>Compression-ready serialization</li>
							<li>Real-time cache statistics</li>
						</ul>
					</div>

					<div class="feature-card">
						<h3>🔄 Auto-Save</h3>
						<p>Background state persistence with conflict detection and automatic save intervals for data safety.</p>
						<ul>
							<li>5-second save intervals</li>
							<li>Unsaved changes detection</li>
							<li>API endpoint integration</li>
							<li>Visual save indicators</li>
						</ul>
					</div>

					<div class="feature-card">
						<h3>🎯 Transform Queue</h3>
						<p>Batched operation processing with atomic transforms and synchronized canvas updates for smooth performance.</p>
						<ul>
							<li>Asynchronous processing</li>
							<li>Operation batching</li>
							<li>Transform validation</li>
							<li>Error recovery</li>
						</ul>
					</div>

					<div class="feature-card">
						<h3>🔧 Developer Tools</h3>
						<p>Comprehensive debugging and monitoring tools with matrix visualization and performance metrics.</p>
						<ul>
							<li>Real-time matrix display</li>
							<li>Transform operation logging</li>
							<li>Performance monitoring</li>
							<li>Cache utilization stats</li>
						</ul>
					</div>
				</div>

				<div class="api-reference">
					<h3>API Reference</h3>
					<div class="code-block">
						<h4>Transform Operations</h4>
						<pre><code>// Quick transforms
helpers.translate(objectId, x, y);
helpers.rotate(objectId, angleInRadians);
helpers.scale(objectId, scaleX, scaleY);

// Matrix operations
const matrix = MatrixUtils.translate(100, 50);
const rotateMatrix = MatrixUtils.rotate(Math.PI / 4);
const composite = MatrixUtils.multiply(matrix, rotateMatrix);
helpers.transform(objectId, composite);

// Undo/Redo
UndoRedoManager.undo();
UndoRedoManager.redo();

// State management
const state = StateManager.captureState(canvas);
await StateManager.restoreState(canvas, state);</code></pre>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<main class="demo-container">
		<TransformSyncDemo />
	</main>

	<footer class="page-footer">
		<div class="footer-content">
			<p>This demo showcases the integration of Fabric.js with advanced matrix mathematics and intelligent state management.</p>
			<div class="links">
				<a href="/interactive-canvas">← Canvas Editor</a>
				<a href="/">← Back to Home</a>
			</div>
		</div>
	</footer>
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}

	.breadcrumb {
		padding: 12px 20px;
		background: rgba(255, 255, 255, 0.9);
		border-bottom: 1px solid #dee2e6;
		font-size: 14px;
	}

	.breadcrumb a {
		color: #007bff;
		text-decoration: none;
	}

	.breadcrumb a:hover {
		text-decoration: underline;
	}

	.separator {
		margin: 0 8px;
		color: #6c757d;
	}

	.current {
		color: #495057;
		font-weight: 500;
	}

	.page-header {
		background: white;
		border-bottom: 2px solid #e9ecef;
		padding: 40px 20px;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header h1 {
		margin: 0 0 10px 0;
		font-size: 2.5rem;
		color: #2d3748;
		font-weight: 700;
	}

	.description {
		margin: 0 0 20px 0;
		font-size: 1.1rem;
		color: #6c757d;
		line-height: 1.6;
	}

	.toggle-docs {
		padding: 10px 20px;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.2s;
	}

	.toggle-docs:hover {
		background: #0056b3;
	}

	.documentation {
		background: white;
		border-bottom: 2px solid #e9ecef;
		padding: 40px 20px;
	}

	.doc-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.documentation h2 {
		margin: 0 0 30px 0;
		font-size: 2rem;
		color: #2d3748;
		text-align: center;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
		margin-bottom: 40px;
	}

	.feature-card {
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 25px;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.feature-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.feature-card h3 {
		margin: 0 0 15px 0;
		font-size: 1.2rem;
		color: #495057;
	}

	.feature-card p {
		margin: 0 0 15px 0;
		color: #6c757d;
		line-height: 1.5;
	}

	.feature-card ul {
		margin: 0;
		padding-left: 20px;
		color: #6c757d;
	}

	.feature-card li {
		margin-bottom: 5px;
		font-size: 14px;
	}

	.api-reference {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 25px;
		border: 1px solid #dee2e6;
	}

	.api-reference h3 {
		margin: 0 0 20px 0;
		color: #495057;
	}

	.code-block {
		background: #2d3748;
		color: #e2e8f0;
		border-radius: 6px;
		overflow: hidden;
	}

	.code-block h4 {
		margin: 0;
		padding: 15px 20px;
		background: #4a5568;
		color: white;
		font-size: 14px;
		font-weight: 600;
	}

	.code-block pre {
		margin: 0;
		padding: 20px;
		overflow-x: auto;
	}

	.code-block code {
		font-family: 'Fira Code', 'Consolas', monospace;
		font-size: 13px;
		line-height: 1.5;
	}

	.demo-container {
		padding: 20px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-footer {
		background: white;
		border-top: 2px solid #e9ecef;
		padding: 30px 20px;
		margin-top: 40px;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		text-align: center;
	}

	.footer-content p {
		margin: 0 0 15px 0;
		color: #6c757d;
	}

	.links {
		display: flex;
		justify-content: center;
		gap: 20px;
	}

	.links a {
		color: #007bff;
		text-decoration: none;
		font-weight: 500;
	}

	.links a:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.page-header h1 {
			font-size: 2rem;
		}

		.feature-grid {
			grid-template-columns: 1fr;
		}

		.links {
			flex-direction: column;
			gap: 10px;
		}
	}
</style>
