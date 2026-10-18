#!/usr/bin/env node
import { Command } from 'commander';
import prompts from 'prompts';
import { execSync } from 'child_process';

const program = new Command();

program
  .name('app-cli')
  .description('Internal CLI Tooling untuk Workspace Development')
  .version('1.0.0');

program
  .command('bootstrap')
  .description('Inisialisasi dependensi dan verifikasi environment')
  .action(async () => {
    console.log('🚀 Menyiapkan workspace environment...\n');

    const response = await prompts({
      type: 'confirm',
      name: 'installDeps',
      message: 'Jalankan pnpm install?',
      initial: true
    });

    if (response.installDeps) {
      console.log('📦 Installing dependencies...');
      execSync('pnpm install', { stdio: 'inherit' });
    }

    console.log('\n✅ Workspace siap digunakan!');
  });

program.parse(process.argv);
    
