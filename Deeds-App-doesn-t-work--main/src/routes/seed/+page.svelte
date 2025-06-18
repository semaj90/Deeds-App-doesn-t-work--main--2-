<script lang="ts">
    async function seedDatabase() {
        try {
            const response = await fetch('/api/seed-criminals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('Database seeded successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to seed database: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error seeding database:', error);
            alert('An error occurred while seeding the database.');
        }
    }
</script>

<div class="container mx-auto p-4">
    <div class="card bg-base-100 shadow-xl max-w-md mx-auto text-center">
        <div class="card-body">
            <h1 class="card-title text-2xl font-bold mb-4 justify-center">Seed Database</h1>
            <p class="mb-6 text-gray-700">Click the button below to populate the database with dummy criminal data.</p>
            <div class="card-actions justify-center">
                <button on:click={seedDatabase} class="btn btn-primary">Seed Criminals Database</button>
            </div>
        </div>
    </div>
</div>