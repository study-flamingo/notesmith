import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'NoteSmith',
    description: 'Insert clinical notes into your practice management system',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
  },
});

