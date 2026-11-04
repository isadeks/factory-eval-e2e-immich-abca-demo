<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
</script>

<p class="mb-4 text-sm text-gray-500 dark:text-gray-400" data-testid="account-email">{authManager.user.email}</p>
