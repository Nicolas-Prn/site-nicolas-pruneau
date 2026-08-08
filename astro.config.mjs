// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://nicolas-pruneau.com',
	output: 'static',
	integrations: [sitemap()],
});
