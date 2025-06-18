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

<div style="padding: 20px;">
    <h1>Seed Database</h1>
    <button on:click={seedDatabase}>Seed Criminals Database</button>
    <p>Click the button above to populate the database with dummy criminal data.</p>
</div>

<style>
    div {
        font-family: sans-serif;
        max-width: 600px;
        margin: 50px auto;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
    }
    h1 {
        color: #333;
        margin-bottom: 20px;
    }
    button {
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
    }
    button:hover {
        background-color: #0056b3;
    }
    p {
        margin-top: 20px;
        color: #666;
    }
</style>