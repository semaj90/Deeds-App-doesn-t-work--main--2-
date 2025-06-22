<script lang="ts">
</script>

<svelte:head>
	<title>The Firm - About Us</title>
</svelte:head>

<section id="about" class="py-5">
	<div class="container">
		<div class="row align-items-center">
			<div class="col-lg-6 mb-4 mb-lg-0">
				<img src="https://via.placeholder.com/600x400" class="img-fluid rounded shadow-lg" alt="About Us" />
			</div>
			<div class="col-lg-6">
				<h2 class="display-4 fw-bold mb-4">About The Firm</h2>
				<p class="lead mb-4">We are dedicated to empowering legal professionals with innovative technology that simplifies complex workflows and enhances productivity.</p>
				<p>Our platform is built on a foundation of security, reliability, and user-centric design, ensuring that you can focus on what matters most: delivering justice.</p>
			</div>
		</div>
	</div>
</section>

<!-- AI Features Section -->
<section id="ai-features" class="py-5 bg-light">
	<div class="container">
		<div class="row">
			<div class="col-lg-6 mb-4 mb-lg-0">
				<h2 class="display-4 fw-bold mb-4">AI-Powered Features</h2>
				<p class="lead mb-4">Harness the power of artificial intelligence to revolutionize your legal practice.</p>
				
				<div class="feature-list">
					<div class="feature-item mb-3">
						<h5><i class="fas fa-search text-primary me-2"></i>Intelligent Case Analysis</h5>
						<p>AI-powered search and analysis of legal documents, evidence, and case files to uncover insights and patterns.</p>
					</div>
					
					<div class="feature-item mb-3">
						<h5><i class="fas fa-brain text-primary me-2"></i>Evidence Processing</h5>
						<p>Automated evidence categorization, OCR text extraction, and multimodal analysis of documents, images, and audio.</p>
					</div>
					
					<div class="feature-item mb-3">
						<h5><i class="fas fa-chart-line text-primary me-2"></i>Predictive Analytics</h5>
						<p>Machine learning models to predict case outcomes, identify key evidence, and suggest optimal legal strategies.</p>
					</div>
					
					<div class="feature-item mb-3">
						<h5><i class="fas fa-file-alt text-primary me-2"></i>Document Generation</h5>
						<p>AI-assisted legal document drafting, contract analysis, and automated report generation from case data.</p>
					</div>
				</div>
			</div>
			
			<div class="col-lg-6">
				<div class="ai-demo-box p-4 bg-white rounded shadow-lg">
					<h4 class="mb-3 text-center">Try Our AI Assistant</h4>
					<div class="chat-preview">
						<div class="message ai-message mb-2">
							<strong>AI:</strong> How can I assist with your legal case today?
						</div>
						<div class="message user-message mb-2">
							<strong>You:</strong> Analyze the evidence in Case #2025-001
						</div>
						<div class="message ai-message mb-2">
							<strong>AI:</strong> I found 12 pieces of evidence. Key findings include witness testimony inconsistencies and timeline gaps. Would you like a detailed breakdown?
						</div>
					</div>
					<a href="/ai/search" class="btn btn-primary w-100 mt-3">Start AI Conversation</a>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	section {
		padding: 80px 0; /* Standard padding for individual pages */
	}

	section h2 {
		font-size: 2.5rem;
		margin-bottom: 3rem;
		color: #007bff;
	}

	/* AI Features Section Styles */
	#ai-features {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	}

	.feature-item {
		padding: 1rem 0;
		border-bottom: 1px solid #dee2e6;
	}

	.feature-item:last-child {
		border-bottom: none;
	}

	.feature-item h5 {
		color: #495057;
		font-weight: 600;
	}

	.feature-item p {
		color: #6c757d;
		margin-bottom: 0;
	}

	.ai-demo-box {
		background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
		border: 1px solid #e9ecef;
	}

	.chat-preview {
		max-height: 200px;
		overflow-y: auto;
		background: #f8f9fa;
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.9rem;
	}

	.message {
		padding: 0.5rem 0;
	}

	.ai-message {
		color: #007bff;
	}

	.user-message {
		color: #28a745;
	}

	.fas {
		width: 20px;
	}
</style>