<script lang="ts">
</script>

<svelte:head>
	<title>The Firm - Contact Us</title>
</svelte:head>

<section id="contact" class="py-5 bg-light">
	<div class="container">
		<h2 class="text-center mb-5 display-4 fw-bold">Get in Touch</h2>
		<div class="row justify-content-center">
			<div class="col-lg-8">
				<form>
					<div class="mb-3">
						<label for="name" class="form-label">Name</label>
						<input type="text" class="form-control" id="name" placeholder="Your Name" />
					</div>
					<div class="mb-3">
						<label for="email" class="form-label">Email address</label>
						<input type="email" class="form-control" id="email" placeholder="name@example.com" />
					</div>
					<div class="mb-3">
						<label for="message" class="form-label">Message</label>
						<textarea class="form-control" id="message" rows="5" placeholder="Your Message"></textarea>
					</div>
					<button type="submit" class="btn btn-primary btn-lg w-100">Send Message</button>
				</form>
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
</style>