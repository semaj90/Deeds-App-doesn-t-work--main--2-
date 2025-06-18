<script lang="ts">
  // Sidebar navigation logic will go here
  // For now, a simple list of items
  const navItems = [
    { name: 'Dashboard', icon: '📊', href: '/dashboard' },
    { name: 'Cases', icon: '🗂️', href: '/cases' },
    { name: 'Criminals', icon: '🧑‍⚖️', href: '/criminals' },
    { name: 'Statutes', icon: '⚖️', href: '/statutes' },
    { name: 'Interactive Canvas', icon: '🎨', href: '/interactive-canvas' },
    { name: 'About', icon: 'ℹ️', href: '/about' },
  ];

  let activeItem = 'Interactive Canvas'; // Default active item for the new UI
</script>

<div class="offcanvas offcanvas-start" tabindex="-1" id="sidebarOffcanvas" aria-labelledby="sidebarOffcanvasLabel">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="sidebarOffcanvasLabel">Menu</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <ul class="nav flex-column">
      {#each navItems as item}
        <li class="nav-item mb-2">
          <a href={item.href} class="nav-link link-dark d-flex align-items-center {item.name === activeItem ? 'active bg-primary text-white' : ''}" aria-current="{item.name === activeItem ? 'page' : undefined}">
            <span class="me-2">{item.icon}</span>
            {item.name}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  /* All styling handled by DaisyUI utility classes */
</style>