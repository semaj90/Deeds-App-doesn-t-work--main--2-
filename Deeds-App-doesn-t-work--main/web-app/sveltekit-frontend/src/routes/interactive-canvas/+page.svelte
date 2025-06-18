<script lang="ts">
  import Header from '$lib/components/+Header.svelte';
  import Sidebar from '$lib/components/+Sidebar.svelte';
  import FileUploadSection from '$lib/components/+FileUploadSection.svelte';
  import AutomateUploadSection from '$lib/components/+AutomateUploadSection.svelte';
  import AddNotesSection from '$lib/components/+AddNotesSection.svelte';
  import SearchBar from '$lib/components/+SearchBar.svelte';

  let searchTerm: string = '';
</script>

<div class="interactive-canvas-layout">
  <Sidebar />
  <div class="main-content-area">
    <Header user={{ id: 'temp', name: 'Prosecutor', email: '', username: 'prosecutor', role: 'Prosecutor' }} title="Interactive Canvas Containers">
      <SearchBar bind:value={searchTerm} />
    </Header>
    <div class="canvas-sections">
      <FileUploadSection />
      <AutomateUploadSection />
      <AddNotesSection />
    </div>
  </div>
</div>

<style>
  .interactive-canvas-layout {
    display: flex;
    min-height: 100vh;
  }

  .main-content-area {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background-color: #f0f2f5; /* Light gray background */
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .canvas-sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
  }
</style>